/**
 * Who is logged in, known everywhere in the app: the owner bar on their own
 * page, the "My page" link in Framed's header, the login page. Asked from
 * the API once (GET /api/me) and refreshed after logging in or out.
 *
 * This only decides what the screen shows. The server checks the login
 * again on every save and upload.
 */
import { computed, ref } from 'vue'
import { fetchMe } from '@/auth/account'
import type { Me } from '@/auth/account'

const me = ref<Me | null>(null)
const isKnown = ref(false)
let pending: Promise<void> | null = null

export function refreshAccount(): Promise<void> {
  pending = fetchMe()
    .catch(() => null)
    .then((result) => {
      me.value = result
      isKnown.value = true
    })
  return pending
}

export function forgetAccount(): void {
  me.value = null
  isKnown.value = true
}

export function useAccount() {
  if (!isKnown.value && !pending) void refreshAccount()
  const ownSite = computed(() => me.value?.site?.name ?? null)
  return { me, isKnown, ownSite }
}
