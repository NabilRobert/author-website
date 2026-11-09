/**
 * The login page's steps:
 *   log-in   email + password;
 *   sign-up  email + password, then `confirm`: the 6-digit code we emailed;
 *   forgot   email, then `reset`: the emailed code and a new password;
 *   name     the first time only: pick the page's address.
 * Afterwards it goes to the person's editor, or back to where they came from.
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { siteNameSchema } from '@shared/names'
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT } from '@shared/passwords'
import { authClient } from '@/auth/authClient'
import { claimName } from '@/auth/account'
import { refreshAccount, useAccount } from '@/auth/useAccount'

export type LoginStep = 'log-in' | 'sign-up' | 'confirm' | 'forgot' | 'reset' | 'name'

const TOO_MANY = 'Too many tries in a row. Wait a minute, then try again.'
const WRONG_LOGIN = "That email and password don't match. Check them, or reset your password."
const ACCOUNT_EXISTS = 'There is already an account with that email. Log in instead, or reset the password.'
const NOT_SENT = "We couldn't send the code. Check the email address and try again."
const WRONG_CODE = 'That code is wrong or has expired. Check it, or ask for a new one.'
const SOMETHING_FAILED = 'Something went wrong. Try again in a moment.'

interface AuthError {
  status?: number
  code?: string
  message?: string
}

// The server's own words for a leaked password (server/auth.ts); our
// words for everything else.
function problemFrom(error: AuthError, fallback: string): string {
  if (error.status === 429) return TOO_MANY
  if (error.code === 'PASSWORD_COMPROMISED' && error.message) return error.message
  return fallback
}

/** What every step shares: who, which step, the last problem, and "busy". */
function useLoginState() {
  const step = ref<LoginStep>('log-in')
  const email = ref('')
  const password = ref('')
  const code = ref('')
  const problem = ref('')
  const isBusy = ref(false)
  // One step at a time: clears the last problem and shows "busy" while it runs.
  async function busy(task: () => Promise<void>) {
    problem.value = ''
    isBusy.value = true
    await task().finally(() => (isBusy.value = false))
  }
  const fail = (message: string) => void (problem.value = message)
  const trimmedEmail = () => email.value.trim()
  return { step, email, password, code, problem, isBusy, busy, fail, trimmedEmail }
}
type LoginState = ReturnType<typeof useLoginState>

function useLogInAndSignUp(state: LoginState, afterLogin: () => Promise<void>) {
  const { step, password, code, busy, fail, trimmedEmail } = state

  async function sendConfirmCode() {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: trimmedEmail(),
      type: 'email-verification',
    })
    if (error) return fail(problemFrom(error, NOT_SENT))
    code.value = ''
    step.value = 'confirm'
  }

  const logIn = () =>
    busy(async () => {
      const { error } = await authClient.signIn.email({ email: trimmedEmail(), password: password.value })
      // 403: the password is right but the email isn't confirmed yet.
      if (error?.status === 403) return sendConfirmCode()
      if (error) return fail(problemFrom(error, WRONG_LOGIN))
      await afterLogin()
    })

  const signUp = () =>
    busy(async () => {
      if (password.value.length < MIN_PASSWORD_LENGTH) return fail(PASSWORD_TOO_SHORT)
      const { error } = await authClient.signUp.email({ email: trimmedEmail(), password: password.value, name: '' })
      if (error) return fail(problemFrom(error, error.status === 422 ? ACCOUNT_EXISTS : SOMETHING_FAILED))
      code.value = ''
      step.value = 'confirm'
    })

  const confirmEmail = () =>
    busy(async () => {
      const { error } = await authClient.emailOtp.verifyEmail({ email: trimmedEmail(), otp: code.value.trim() })
      if (error) return fail(problemFrom(error, WRONG_CODE))
      await afterLogin()
    })

  return { logIn, signUp, confirmEmail, resendConfirmCode: () => busy(sendConfirmCode) }
}

function usePasswordReset(state: LoginState, afterLogin: () => Promise<void>) {
  const { step, password, code, busy, fail, trimmedEmail } = state

  const requestReset = () =>
    busy(async () => {
      const { error } = await authClient.emailOtp.requestPasswordReset({ email: trimmedEmail() })
      if (error) return fail(problemFrom(error, NOT_SENT))
      code.value = ''
      password.value = ''
      step.value = 'reset'
    })

  const resetPassword = () =>
    busy(async () => {
      if (password.value.length < MIN_PASSWORD_LENGTH) return fail(PASSWORD_TOO_SHORT)
      const reset = { email: trimmedEmail(), otp: code.value.trim(), password: password.value }
      const { error } = await authClient.emailOtp.resetPassword(reset)
      if (error) return fail(problemFrom(error, WRONG_CODE))
      // Resetting logs out everywhere (server/auth.ts), so log in afresh.
      const login = await authClient.signIn.email({ email: reset.email, password: reset.password })
      if (login.error) return fail(problemFrom(login.error, SOMETHING_FAILED))
      await afterLogin()
    })

  return { requestReset, resetPassword }
}

function usePickName(state: LoginState, name: Ref<string>) {
  const router = useRouter()
  const pickName = () =>
    state.busy(async () => {
      const checked = siteNameSchema.safeParse(name.value)
      if (!checked.success) return state.fail(checked.error.issues[0]?.message ?? '')
      const refusal = await claimName(checked.data)
      if (refusal) return state.fail(refusal)
      await refreshAccount()
      await router.push(`/${checked.data}/edit`)
    })
  return { pickName }
}

export function useLogin(next: string | null) {
  const router = useRouter()
  const { ownSite } = useAccount()
  const state = useLoginState()
  const name = ref('')

  // Into the editor of the person's page, or on to picking a name.
  async function afterLogin() {
    await refreshAccount()
    if (ownSite.value) await router.push(next ?? `/${ownSite.value}/edit`)
    else state.step.value = 'name'
  }

  // Moving between steps forgets the last problem.
  function goTo(step: LoginStep) {
    state.problem.value = ''
    state.step.value = step
  }

  return {
    ...state,
    name,
    goTo,
    ...useLogInAndSignUp(state, afterLogin),
    ...usePasswordReset(state, afterLogin),
    ...usePickName(state, name),
  }
}
