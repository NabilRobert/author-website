<script setup lang="ts">
import type { Book } from '@shared/schema'
import { formatDate, paragraphs, seriesLabel } from '@/content/format'
import BookCover from '@/components/books/BookCover.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'

// One book in full: cover, title, series, date, blurb, where to buy it and
// what reviewers said.
defineProps<{ book: Book; authorName: string }>()
</script>

<template>
  <article class="grid gap-6 @2xl:grid-cols-[12rem_1fr] @2xl:gap-10">
    <div class="w-40 @2xl:w-full">
      <BookCover
        :title="book.title"
        :author-name="authorName"
        :cover-key="book.coverKey"
        :cover-crop="book.coverCrop"
      />
    </div>
    <div>
      <p v-if="seriesLabel(book)" class="small-caps mb-2 text-accent">{{ seriesLabel(book) }}</p>
      <h3 class="text-3xl font-semibold">{{ book.title }}</h3>
      <p v-if="book.publishedOn" class="mt-1 font-sans text-sm text-muted">
        Published {{ formatDate(book.publishedOn) }}
      </p>
      <div class="prose-text mt-4">
        <p v-for="(paragraph, index) in paragraphs(book.blurb)" :key="index">{{ paragraph }}</p>
      </div>
      <div class="mt-5">
        <LinkButtons :links="book.buyLinks" :label="`Where to buy ${book.title}`" />
      </div>
      <figure v-for="review in book.reviews" :key="review.quote" class="mt-6 border-l-2 border-accent pl-4">
        <blockquote class="text-lg italic">“{{ review.quote }}”</blockquote>
        <figcaption class="mt-1 font-sans text-sm text-muted">{{ review.source }}</figcaption>
      </figure>
    </div>
  </article>
</template>
