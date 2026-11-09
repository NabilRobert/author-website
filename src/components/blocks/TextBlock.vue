<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { paragraphs } from '@shared/text'
import BlockHeading from '@/components/ui/BlockHeading.vue'

// Words: an optional heading and paragraphs (a blank line starts a new one).
defineProps<{ block: BlockOf<'text'> }>()
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <div class="prose-text">
      <p v-for="(paragraph, index) in paragraphs(block.body)" :key="index">{{ paragraph }}</p>
    </div>
  </section>
</template>
