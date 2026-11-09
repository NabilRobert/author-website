<script setup lang="ts">
import { computed } from 'vue'
import type { SiteContent, Work } from '@shared/schema'
import WorkEntry from '@/components/works/WorkEntry.vue'
import PageBlocks from '@/components/blocks/PageBlocks.vue'
import PictureGrid from '@/components/blocks/PictureGrid.vue'
import { useSitePath } from '@/content/sitePath'

// A work's own page: its details on top (picture, title, description,
// links, quotes), its more pictures, the blocks the owner added, then links to the
// previous and next works that have their own pages, in the Work tab's
// order. The public page (WorkPageView) and the editor's preview both use this.
const props = defineProps<{ work: Work; content: SiteContent; selectedBlockId?: string }>()
const sitePath = useSitePath()

// Back to whichever page shows all the work, or the front page.
const allWorkPath = computed(() => {
  const page = props.content.pages.find((candidate) =>
    candidate.blocks.some((block) => block.type === 'works' && block.show === 'all'),
  )
  return sitePath(`/${page?.slug ?? ''}`)
})

// Only works with their own page, so every link lands on a page.
const neighbours = computed(() => {
  const withPages = props.content.works.filter((work) => work.showPage)
  const index = withPages.findIndex((work) => work.id === props.work.id)
  return { previous: withPages[index - 1], next: withPages[index + 1] }
})
const workPath = (work: Work) => sitePath(`/work/${work.pageSlug}`)
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
  <div v-if="work.morePictures.length" class="mt-16">
    <PictureGrid :pictures="work.morePictures" :columns="3" :shape="content.theme.workShape" corners="soft" />
  </div>
  <PageBlocks class="mt-16" :blocks="work.pageBlocks" :content="content" :selected-block-id="selectedBlockId" />
  <nav
    v-if="neighbours.previous || neighbours.next"
    aria-label="More work"
    class="mt-16 flex flex-wrap justify-between gap-6 border-t border-line pt-6 font-sans"
  >
    <RouterLink v-if="neighbours.previous" :to="workPath(neighbours.previous)" rel="prev" class="group">
      <span class="block text-sm text-muted">← Previous</span>
      <span class="text-lg text-accent group-hover:underline">{{ neighbours.previous.title }}</span>
    </RouterLink>
    <RouterLink v-if="neighbours.next" :to="workPath(neighbours.next)" rel="next" class="group ml-auto text-right">
      <span class="block text-sm text-muted">Next →</span>
      <span class="text-lg text-accent group-hover:underline">{{ neighbours.next.title }}</span>
    </RouterLink>
  </nav>
</template>
