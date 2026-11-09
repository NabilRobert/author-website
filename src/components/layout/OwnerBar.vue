<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, forgetAccount } from '@/auth/useAccount'
import { authClient } from '@/auth/authClient'

// A small bar on the owner's own page, and only there: switch to the editor
// (on the page being viewed) or log out. Visitors never see it.
const props = defineProps<{ site: string }>()
const route = useRoute()
const router = useRouter()
const { ownSite } = useAccount()

const isOwner = computed(() => ownSite.value === props.site)
// The page being viewed, for the editor to preview: ?page=about, or
// ?work=lantern on a work's own page.
const editQuery = computed(() => {
  if (route.params.work) return { work: String(route.params.work) }
  return route.params.page ? { page: String(route.params.page) } : {}
})

async function logOut() {
  await authClient.signOut()
  forgetAccount()
  await router.push(`/${props.site}`)
}
</script>

<template>
  <div
    v-if="isOwner"
    role="region"
    aria-label="Your page"
    class="fixed right-4 bottom-4 z-20 flex items-center gap-2 rounded-full border border-panel-line bg-panel p-1.5 font-sans text-sm text-panel-text shadow-lg"
  >
    <RouterLink
      :to="{ path: `/${site}/edit`, query: editQuery }"
      class="rounded-full bg-action px-4 py-2 font-semibold text-panel"
      >Edit this page</RouterLink
    >
    <button type="button" class="rounded-full px-3 py-2 text-panel-muted hover:text-panel-text" @click="logOut">
      Log out
    </button>
  </div>
</template>
