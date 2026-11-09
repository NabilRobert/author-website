<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'

// A row of buttons linking to other pages or other sites.
defineProps<{ block: BlockOf<'buttons'> }>()
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <LinkButtons :links="block.links" :label="block.heading || 'Links'" />
  </section>
</template>
