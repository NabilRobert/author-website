<script setup lang="ts">
import type { Book } from '@shared/schema'
import TextField from '@/editor/fields/TextField.vue'
import NumberField from '@/editor/fields/NumberField.vue'
import ImageField from '@/editor/fields/ImageField.vue'
import LinkListField from '@/editor/fields/LinkListField.vue'
import ReviewListField from '@/editor/tabs/ReviewListField.vue'

// Everything about one book.
const book = defineModel<Book>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="book.title" label="Title" />
    <ImageField
      v-model="book.coverKey"
      label="Cover"
      hint="Until you add one, the site shows a plain cover with the title."
    />
    <div class="grid gap-4 sm:grid-cols-[1fr_auto]">
      <TextField v-model="book.seriesName" label="Series" hint="Leave empty if the book stands alone." />
      <NumberField v-model="book.seriesPosition" label="Number in series" />
    </div>
    <TextField v-model="book.publishedOn" label="Published on" type="date" hint="Optional." />
    <TextField v-model="book.blurb" label="Blurb" hint="Leave a blank line to start a new paragraph." multiline />
    <LinkListField
      v-model="book.buyLinks"
      label="Where to buy"
      add-label="Add a shop"
      url-hint="The full address of the book's page in the shop, starting with https://"
    />
    <ReviewListField v-model="book.reviews" />
  </div>
</template>
