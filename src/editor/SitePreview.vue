<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { SiteContent } from '@shared/schema'
import { themeVariables } from '@/content/themeVariables'
import { loadFonts } from '@/styles/fonts'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import PageBlocks from '@/components/blocks/PageBlocks.vue'

// One page of the draft, drawn by the same components as the public site
// and in the draft's colours and fonts, so it shows exactly what visitors
// will see after saving.
const props = defineProps<{ content: SiteContent; pageId: string }>()

const page = computed(() => props.content.pages.find((candidate) => candidate.id === props.pageId))
const startsWithBanner = computed(() => page.value?.blocks[0]?.type === 'hero')
const style = computed(() => themeVariables(props.content.theme))

// RouterLink skips navigation for an event that is already prevented.
function stopLinks(event: MouseEvent) {
  if ((event.target as Element).closest('a')) event.preventDefault()
}

watchEffect(() => loadFonts([props.content.theme.headingFont, props.content.theme.bodyFont]))
</script>

<template>
  <div
    :style="style"
    class="overflow-hidden rounded-md border border-panel-line bg-paper font-[family-name:var(--font-body)] text-ink"
  >
    <!-- Clicks on links are stopped here so they can't leave the editor;
         scrolling and selecting text work as on the real page. -->
    <div class="site-background @container" @click.capture="stopLinks">
      <div class="site-panel">
        <SiteHeader :content="content" />
        <div class="page-width pb-4">
          <template v-if="page">
            <SectionHeading v-if="!startsWithBanner" :title="page.title" />
            <PageBlocks :page="page" :content="content" />
          </template>
        </div>
        <SiteFooter :content="content" />
      </div>
    </div>
  </div>
</template>
