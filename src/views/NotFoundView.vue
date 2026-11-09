<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue'
</script>

<template>
  <SectionHeading title="Page not found" />
  <p class="prose-text">
    That page doesn't exist. Try the <RouterLink to="/books" class="text-accent underline">books</RouterLink> or go back
    to the <RouterLink to="/" class="text-accent underline">front page</RouterLink>.
  </p>
</template>
