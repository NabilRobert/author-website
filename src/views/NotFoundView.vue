<script setup lang="ts">
import SectionHeading from '@/components/ui/SectionHeading.vue'
import { useSitePath } from '@/content/sitePath'

const sitePath = useSitePath()
</script>

<template>
  <SectionHeading title="Page not found" />
  <p class="prose-text">
    That page doesn't exist. Go back to the
    <RouterLink :to="sitePath('/')" class="text-accent underline">front page</RouterLink>.
  </p>
</template>
