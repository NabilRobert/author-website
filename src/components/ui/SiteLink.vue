<script setup lang="ts">
import { useSitePath } from '@/content/sitePath'

// A link that stays inside the app for this site's pages ("/works" becomes
// "/<site>/works") and opens outside addresses normally.
defineProps<{ to: string }>()
const sitePath = useSitePath()
</script>

<template>
  <RouterLink v-if="to.startsWith('/')" :to="sitePath(to)"><slot /></RouterLink>
  <a v-else :href="to" rel="noopener"><slot /></a>
</template>
