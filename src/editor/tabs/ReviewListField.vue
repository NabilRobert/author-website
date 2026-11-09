<script setup lang="ts">
import type { Review } from '@shared/schema'
import { moveItem } from '@/editor/newItems'
import TextField from '@/editor/fields/TextField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'

// A book's review quotes.
const reviews = defineModel<Review[]>({ required: true })
</script>

<template>
  <fieldset class="rounded-md border border-panel-line p-4">
    <legend class="px-1 font-semibold">Review quotes</legend>
    <div v-for="(review, index) in reviews" :key="index" class="mb-4 space-y-2 border-b border-panel-line pb-4">
      <TextField v-model="review.quote" label="Quote" multiline />
      <TextField v-model="review.source" label="Who said it" hint="For example, a newspaper or a reviewer's name." />
      <ItemControls
        :item-name="`quote ${index + 1}`"
        :is-first="index === 0"
        :is-last="index === reviews.length - 1"
        @move="(offset) => moveItem(reviews, index, offset)"
        @remove="reviews.splice(index, 1)"
      />
    </div>
    <button
      type="button"
      class="rounded-md border border-action px-4 py-2 font-semibold text-action"
      @click="reviews.push({ quote: '', source: '' })"
    >
      + Add a quote
    </button>
  </fieldset>
</template>
