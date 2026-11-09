/**
 * The login page's three steps: type your email, type the code we emailed,
 * and (the first time) pick your page's name. Afterwards it goes to your
 * editor, or back to where you were sent from.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { siteNameSchema } from '@shared/names'
import { authClient } from '@/auth/authClient'
import { claimName, testAccountLogin } from '@/auth/account'
import { TEST_ACCOUNT_EMAIL } from '@shared/test-account'
import { refreshAccount, useAccount } from '@/auth/useAccount'

export type LoginStep = 'email' | 'code' | 'name'

const TOO_MANY = 'You asked for several codes in a row. Wait a minute, then try again.'
const NOT_SENT = "We couldn't send the code. Check the email address and try again."
const WRONG_CODE = 'That code is wrong or has expired. Check it, or ask for a new one.'
const TEST_ACCOUNT_LOCAL_ONLY =
  'The test account works only on a local development server, with LOCAL_DEV_TEST_LOGIN on in .dev.vars.'

/** One step at a time: clears the last problem and shows "busy" while it runs. */
function useBusy() {
  const problem = ref('')
  const isBusy = ref(false)
  async function busy(task: () => Promise<void>) {
    problem.value = ''
    isBusy.value = true
    await task().finally(() => (isBusy.value = false))
  }
  return { problem, isBusy, busy }
}

export function useLogin(next: string | null) {
  const router = useRouter()
  const { ownSite } = useAccount()
  const step = ref<LoginStep>('email')
  const email = ref('')
  const code = ref('')
  const name = ref('')
  const { problem, isBusy, busy } = useBusy()

  // Into the editor of the person's page, or on to picking a name.
  async function afterLogin() {
    await refreshAccount()
    if (ownSite.value) await router.push(next ?? `/${ownSite.value}/edit`)
    else step.value = 'name'
  }

  const sendCode = () =>
    busy(async () => {
      // The local test account skips the code (server/dev-routes.ts).
      if (email.value.trim().toLowerCase() === TEST_ACCOUNT_EMAIL) {
        return (await testAccountLogin()) ? afterLogin() : void (problem.value = TEST_ACCOUNT_LOCAL_ONLY)
      }
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.value.trim(), type: 'sign-in' })
      if (error) problem.value = error.status === 429 ? TOO_MANY : NOT_SENT
      else step.value = 'code'
    })

  const checkCode = () =>
    busy(async () => {
      const { error } = await authClient.signIn.emailOtp({ email: email.value.trim(), otp: code.value.trim() })
      if (error) return void (problem.value = WRONG_CODE)
      await afterLogin()
    })

  const pickName = () =>
    busy(async () => {
      const checked = siteNameSchema.safeParse(name.value)
      if (!checked.success) return void (problem.value = checked.error.issues[0]?.message ?? '')
      const refusal = await claimName(checked.data)
      if (refusal) return void (problem.value = refusal)
      await refreshAccount()
      await router.push(`/${checked.data}/edit`)
    })

  return { step, email, code, name, problem, isBusy, sendCode, checkCode, pickName }
}
