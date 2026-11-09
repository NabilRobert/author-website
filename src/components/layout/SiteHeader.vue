<script setup lang="ts">
import { computed } from 'vue'
import type { SiteContent } from '@shared/schema'
import { useSitePath } from '@/content/sitePath'

// The profile's name, linking home, and the menu: the pages the owner chose
// to show in it, in their order. Takes the content as a prop so the
// editor's preview can show the draft.
const props = defineProps<{ content: SiteContent }>()
const sitePath = useSitePath()

const menuLinks = computed(() =>
  props.content.pages
    .filter((page) => page.showInMenu)
    .map((page) => ({ to: sitePath(`/${page.slug}`), label: page.title })),
)
</script>

<template>
  <header class="page-width flex flex-col items-center gap-4 py-8 @2xl:flex-row @2xl:justify-between">
    <RouterLink :to="sitePath('/')" class="font-heading text-2xl font-semibold tracking-tight">{{
      content.profile.name
    }}</RouterLink>
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
