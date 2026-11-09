/**
 * The login page's three steps: type your email, type the code we emailed,
 * and (the first time) pick your page's name. Afterwards it goes to your
 * editor, or back to where you were sent from.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { siteNameSchema } from '@shared/names'
import { authClient } from '@/auth/authClient'
import { claimName, fetchMe } from '@/auth/account'

export type LoginStep = 'email' | 'code' | 'name'

const TOO_MANY = 'You asked for several codes in a row. Wait a minute, then try again.'
const NOT_SENT = "We couldn't send the code. Check the email address and try again."
const WRONG_CODE = 'That code is wrong or has expired. Check it, or ask for a new one.'

export function useLogin(next: string | null) {
  const router = useRouter()
  const step = ref<LoginStep>('email')
  const email = ref('')
  const code = ref('')
  const name = ref('')
  const problem = ref('')
  const isBusy = ref(false)

  async function busy(task: () => Promise<void>) {
    problem.value = ''
    isBusy.value = true
    await task().finally(() => (isBusy.value = false))
  }

  const sendCode = () =>
    busy(async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.value.trim(), type: 'sign-in' })
      if (error) problem.value = error.status === 429 ? TOO_MANY : NOT_SENT
      else step.value = 'code'
    })

  const checkCode = () =>
    busy(async () => {
      const { error } = await authClient.signIn.emailOtp({ email: email.value.trim(), otp: code.value.trim() })
      if (error) return void (problem.value = WRONG_CODE)
      const me = await fetchMe()
      if (me?.site) await router.push(next ?? `/${me.site.name}/edit`)
      else step.value = 'name'
    })

  const pickName = () =>
    busy(async () => {
      const checked = siteNameSchema.safeParse(name.value)
      if (!checked.success) return void (problem.value = checked.error.issues[0]?.message ?? '')
      const refusal = await claimName(checked.data)
      if (refusal) problem.value = refusal
      else await router.push(`/${checked.data}/edit`)
    })

  return { step, email, code, name, problem, isBusy, sendCode, checkCode, pickName }
}
