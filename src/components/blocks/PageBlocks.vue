<script setup lang="ts">
import type { Page, SiteContent } from '@shared/schema'
import BlockBox from '@/components/blocks/BlockBox.vue'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import TextBlock from '@/components/blocks/TextBlock.vue'
import ImageTextBlock from '@/components/blocks/ImageTextBlock.vue'
import GalleryBlock from '@/components/blocks/GalleryBlock.vue'
import ListBlock from '@/components/blocks/ListBlock.vue'
import QuoteBlock from '@/components/blocks/QuoteBlock.vue'
import ButtonsBlock from '@/components/blocks/ButtonsBlock.vue'
import WorksBlock from '@/components/blocks/WorksBlock.vue'
import NewsBlock from '@/components/blocks/NewsBlock.vue'
import ContactBlock from '@/components/blocks/ContactBlock.vue'
import PressKitBlock from '@/components/blocks/PressKitBlock.vue'

// A page's blocks, top to bottom, each in its box (BlockBox). The public page and the editor's preview
// both use this, so the preview is exactly what visitors will see. Each box carries its block's id
// (data-block-id) so the editor's preview can tell which block was clicked, and marks the selected one.
defineProps<{ page: Page; content: SiteContent; selectedBlockId?: string }>()
</script>

<template>
  <div class="space-y-16">
    <BlockBox
      v-for="(block, index) in page.blocks"
      :key="block.id"
      :box-style="block.style"
      :data-block-id="block.id"
      :data-selected="block.id === selectedBlockId || undefined"
    >
      <HeroBlock v-if="block.type === 'hero'" :block="block" :is-page-title="index === 0" />
      <TextBlock v-else-if="block.type === 'text'" :block="block" />
      <ImageTextBlock v-else-if="block.type === 'imageText'" :block="block" />
      <GalleryBlock v-else-if="block.type === 'gallery'" :block="block" />
      <ListBlock v-else-if="block.type === 'list'" :block="block" />
      <QuoteBlock v-else-if="block.type === 'quote'" :block="block" />
      <ButtonsBlock v-else-if="block.type === 'buttons'" :block="block" />
      <WorksBlock v-else-if="block.type === 'works'" :block="block" :content="content" />
      <NewsBlock v-else-if="block.type === 'news'" :block="block" :items="content.news" />
      <ContactBlock v-else-if="block.type === 'contact'" :block="block" :profile="content.profile" />
      <PressKitBlock v-else-if="block.type === 'pressKit'" :block="block" :content="content" />
    </BlockBox>
  </div>
</template>
