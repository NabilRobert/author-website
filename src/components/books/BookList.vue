<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@shared/schema'
import { groupBooksBySeries } from '@/content/format'
import BookEntry from '@/components/books/BookEntry.vue'

// Every book, with a series' books together under the series name, in
// reading order.
const props = defineProps<{ books: Book[]; authorName: string }>()
const groups = computed(() => groupBooksBySeries(props.books))
</script>

<template>
  <p v-if="!books.length" class="text-lg text-muted">No books yet.</p>
  <section v-for="group in groups" :key="group.books[0]?.id" class="mb-16">
    <h2 v-if="group.seriesName" class="mb-8 text-2xl font-semibold">
      The {{ group.seriesName }} series <span class="font-sans text-base text-muted">(read in this order)</span>
    </h2>
    <div class="space-y-14">
      <BookEntry v-for="book in group.books" :key="book.id" :book="book" :author-name="authorName" />
    </div>
  </section>
</template>
