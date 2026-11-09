<script setup lang="ts">
import type { Block } from '@shared/blocks'
import HeroForm from '@/editor/block-forms/HeroForm.vue'
import TextForm from '@/editor/block-forms/TextForm.vue'
import ImageTextForm from '@/editor/block-forms/ImageTextForm.vue'
import ListForm from '@/editor/block-forms/ListForm.vue'
import QuoteForm from '@/editor/block-forms/QuoteForm.vue'
import ButtonsForm from '@/editor/block-forms/ButtonsForm.vue'
import WorksForm from '@/editor/block-forms/WorksForm.vue'
import NewsForm from '@/editor/block-forms/NewsForm.vue'
import HeadingOnlyForm from '@/editor/block-forms/HeadingOnlyForm.vue'
import PressKitForm from '@/editor/block-forms/PressKitForm.vue'

// The form for one block, picked by its type (the editor's twin of
// src/components/blocks/PageBlocks.vue).
const block = defineModel<Block>({ required: true })
</script>

<template>
  <HeroForm v-if="block.type === 'hero'" v-model="block" />
  <TextForm v-else-if="block.type === 'text'" v-model="block" />
  <ImageTextForm v-else-if="block.type === 'imageText'" v-model="block" />
  <ListForm v-else-if="block.type === 'list'" v-model="block" />
  <QuoteForm v-else-if="block.type === 'quote'" v-model="block" />
  <ButtonsForm v-else-if="block.type === 'buttons'" v-model="block" />
  <WorksForm v-else-if="block.type === 'works'" v-model="block" />
  <NewsForm v-else-if="block.type === 'news'" v-model="block" />
  <PressKitForm v-else-if="block.type === 'pressKit'" v-model="block" />
  <HeadingOnlyForm v-else v-model="block" />
</template>
