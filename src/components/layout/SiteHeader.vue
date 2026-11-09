<script setup lang="ts">
import { computed } from 'vue'
import { useSiteContent } from '@/content/useSiteContent'

// The author's name, linking home, and the menu: the pages the owner chose
// to show in it, in their order.
const { content } = useSiteContent()

const menuLinks = computed(() =>
  content.value.pages.filter((page) => page.showInMenu).map((page) => ({ to: `/${page.slug}`, label: page.title })),
)
</script>

<template>
  <header class="page-width flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
    <RouterLink to="/" class="font-heading text-2xl font-semibold tracking-tight">{{ content.author.name }}</RouterLink>
    <nav aria-label="Main">
      <ul class="flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-[0.95rem]">
        <li v-for="link in menuLinks" :key="link.to">
          <RouterLink
            :to="link.to"
            active-class="text-accent underline"
            class="underline-offset-[0.35em] hover:text-accent hover:underline"
            >{{ link.label }}</RouterLink
          >
        </li>
      </ul>
    </nav>
  </header>
</template>
