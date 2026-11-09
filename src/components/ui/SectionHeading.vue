<script setup lang="ts">
// A page's title (h1), for pages that don't start with a big banner.
defineProps<{ title: string }>()
</script>

<template>
  <header class="mb-12 border-b border-line pb-6">
    <h1 class="text-4xl font-semibold sm:text-5xl">{{ title }}</h1>
  </header>
</template>
