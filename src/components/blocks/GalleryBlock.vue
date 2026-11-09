<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import PictureGrid from '@/components/blocks/PictureGrid.vue'

// A heading over a grid of pictures (PictureGrid), as the owner set it up.
defineProps<{ block: BlockOf<'gallery'> }>()
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <PictureGrid
      :pictures="block.pictures"
      :columns="block.columns"
      :shape="block.imageShape"
      :corners="block.pictureCorners"
    />
  </section>
</template>
