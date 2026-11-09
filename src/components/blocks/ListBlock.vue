<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import BlockHeading from '@/components/ui/BlockHeading.vue'

// A bulleted or numbered list.
defineProps<{ block: BlockOf<'list'> }>()
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <component
      :is="block.numbered ? 'ol' : 'ul'"
      class="prose-text space-y-2 pl-6"
      :class="block.numbered ? 'list-decimal' : 'list-disc marker:text-accent'"
    >
      <li v-for="(item, index) in block.items" :key="index">{{ item }}</li>
    </component>
  </section>
</template>
