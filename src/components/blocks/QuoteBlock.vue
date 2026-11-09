<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'

// A large quotation, with who said it.
defineProps<{ block: BlockOf<'quote'> }>()
</script>

<template>
  <figure class="mx-auto max-w-3xl text-center">
    <blockquote class="text-2xl leading-snug italic @2xl:text-3xl">“{{ block.quote }}”</blockquote>
    <figcaption v-if="block.source" class="mt-4 font-sans text-muted">{{ block.source }}</figcaption>
  </figure>
</template>
