<script setup lang="ts">
// A link that stays inside the app for this site's pages ("/books") and
// opens outside addresses normally.
defineProps<{ to: string }>()
</script>

<template>
  <RouterLink v-if="to.startsWith('/')" :to="to"><slot /></RouterLink>
  <a v-else :href="to" rel="noopener"><slot /></a>
</template>
