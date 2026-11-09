<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import type { SiteContent } from '@shared/schema'
import { themeVariables } from '@/content/themeVariables'
import { loadFonts } from '@/styles/fonts'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import PageBlocks from '@/components/blocks/PageBlocks.vue'
import WorkPage from '@/components/works/WorkPage.vue'

// One page of the draft, drawn by the same components as the public site
// and in the draft's colours and fonts, so it shows exactly what visitors
// will see after saving: a site page, or a work's own page (`pageId` is then
// the work's id). Clicking a block selects it for editing; the selected
// block is outlined.
const props = defineProps<{ content: SiteContent; pageId: string; selectedBlockId?: string }>()
const emit = defineEmits<{ selectBlock: [blockId: string] }>()
const previewRoot = ref<HTMLElement>()

const page = computed(() => props.content.pages.find((candidate) => candidate.id === props.pageId))
const workWithPage = computed(() =>
  props.content.works.find((work) => work.id === props.pageId && work.pageSlug !== ''),
)
const startsWithBanner = computed(() => page.value?.blocks[0]?.type === 'hero')
const style = computed(() => themeVariables(props.content.theme))

// Blocks show they can be clicked (dashed on hover); the selected one has a
// solid outline. The colour is the editor's, not the site's.
const BLOCK_OUTLINES = [
  '[&_[data-block-id]]:cursor-pointer [&_[data-block-id]]:outline-offset-4 [&_[data-block-id]]:outline-action',
  '[&_[data-block-id]:not([data-selected]):hover]:outline-2 [&_[data-block-id]:not([data-selected]):hover]:outline-dashed',
  '[&_[data-selected]]:outline-3 [&_[data-selected]]:outline-solid',
]

// Links and buttons in the site never act here (RouterLink, and a
// gallery's full-size view, skip an event that is already prevented); a
// click anywhere in a block selects that block.
function handleClick(event: MouseEvent) {
  const target = event.target as Element
  if (target.closest('a, button')) event.preventDefault()
  const blockId = target.closest<HTMLElement>('[data-block-id]')?.dataset.blockId
  if (blockId) emit('selectBlock', blockId)
}

// When a block's form is picked, bring that block into view if it isn't.
watch(
  () => props.selectedBlockId,
  (blockId) => {
    if (!blockId) return
    previewRoot.value?.querySelector(`[data-block-id="${blockId}"]`)?.scrollIntoView({ block: 'nearest' })
  },
  { flush: 'post' },
)

watchEffect(() => loadFonts([props.content.theme.headingFont, props.content.theme.bodyFont]))
</script>

<template>
  <div
    :style="style"
    class="overflow-hidden rounded-md border border-panel-line bg-paper font-[family-name:var(--font-body)] text-ink"
  >
    <!-- Clicks on links are stopped here so they can't leave the editor;
         scrolling and selecting text work as on the real page. -->
    <div ref="previewRoot" class="site-background @container" :class="BLOCK_OUTLINES" @click.capture="handleClick">
      <div class="site-panel">
        <SiteHeader :content="content" />
        <div class="page-width pb-4">
          <template v-if="page">
            <SectionHeading v-if="!startsWithBanner" :title="page.title" />
            <PageBlocks :blocks="page.blocks" :content="content" :selected-block-id="selectedBlockId" />
          </template>
          <WorkPage
            v-else-if="workWithPage"
            :work="workWithPage"
            :content="content"
            :selected-block-id="selectedBlockId"
          />
        </div>
        <SiteFooter :content="content" />
      </div>
    </div>
  </div>
</template>
