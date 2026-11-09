<script setup lang="ts">
import type { Page, SiteContent } from '@shared/schema'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import TextBlock from '@/components/blocks/TextBlock.vue'
import ImageTextBlock from '@/components/blocks/ImageTextBlock.vue'
import ListBlock from '@/components/blocks/ListBlock.vue'
import QuoteBlock from '@/components/blocks/QuoteBlock.vue'
import ButtonsBlock from '@/components/blocks/ButtonsBlock.vue'
import BooksBlock from '@/components/blocks/BooksBlock.vue'
import NewsBlock from '@/components/blocks/NewsBlock.vue'
import ContactBlock from '@/components/blocks/ContactBlock.vue'
import PressKitBlock from '@/components/blocks/PressKitBlock.vue'

// A page's blocks, top to bottom. The public page and the editor's preview
// both use this, so the preview is exactly what visitors will see.
defineProps<{ page: Page; content: SiteContent }>()
</script>

<template>
  <div class="space-y-16">
    <template v-for="(block, index) in page.blocks" :key="block.id">
      <HeroBlock v-if="block.type === 'hero'" :block="block" :is-page-title="index === 0" />
      <TextBlock v-else-if="block.type === 'text'" :block="block" />
      <ImageTextBlock v-else-if="block.type === 'imageText'" :block="block" />
      <ListBlock v-else-if="block.type === 'list'" :block="block" />
      <QuoteBlock v-else-if="block.type === 'quote'" :block="block" />
      <ButtonsBlock v-else-if="block.type === 'buttons'" :block="block" />
      <BooksBlock v-else-if="block.type === 'books'" :block="block" :content="content" />
      <NewsBlock v-else-if="block.type === 'news'" :block="block" :items="content.news" />
      <ContactBlock v-else-if="block.type === 'contact'" :block="block" :author="content.author" />
      <PressKitBlock v-else-if="block.type === 'pressKit'" :block="block" :content="content" />
    </template>
  </div>
</template>
