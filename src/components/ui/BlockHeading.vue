<script setup lang="ts">
// A block's optional heading. Blocks sit under the page's title, so their
// headings are h2.
defineProps<{ text: string }>()
</script>

<template>
  <h2 v-if="text" class="mb-6 text-3xl font-semibold">{{ text }}</h2>
</template>
