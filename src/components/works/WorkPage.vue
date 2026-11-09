<script setup lang="ts">
import { computed } from 'vue'
import type { SiteContent, Work } from '@shared/schema'
import WorkEntry from '@/components/works/WorkEntry.vue'
import PageBlocks from '@/components/blocks/PageBlocks.vue'
import { useSitePath } from '@/content/sitePath'

// A work's own page: its details on top (picture, title, description,
// links, quotes), then the blocks the owner added. The public page
// (WorkPageView) and the editor's preview both use this.
const props = defineProps<{ work: Work; content: SiteContent; selectedBlockId?: string }>()
const sitePath = useSitePath()

// Back to whichever page shows all the work, or the front page.
const allWorkPath = computed(() => {
  const page = props.content.pages.find((candidate) =>
    candidate.blocks.some((block) => block.type === 'works' && block.show === 'all'),
  )
  return sitePath(`/${page?.slug ?? ''}`)
})
</script>

<template>
  <RouterLink :to="allWorkPath" class="mb-8 inline-block font-sans text-sm text-accent underline">
    ← All work
  </RouterLink>
  <WorkEntry
    :work="work"
    :owner-name="content.profile.name"
    :shape="content.theme.workShape"
    corners="soft"
    is-page-title
  />
  <PageBlocks class="mt-16" :blocks="work.pageBlocks" :content="content" :selected-block-id="selectedBlockId" />
</template>
