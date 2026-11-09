<script setup lang="ts">
import { computed } from 'vue'
import type { Book } from '@shared/schema'
import { groupAdjacentSeries } from '@/content/format'
import BookEntry from '@/components/books/BookEntry.vue'

// Every book, in the order the owner arranged them; neighbouring books of
// one series share the series name as a heading.
const props = defineProps<{ books: Book[]; authorName: string }>()
const groups = computed(() => groupAdjacentSeries(props.books))
</script>

<template>
  <p v-if="!books.length" class="text-lg text-muted">No books yet.</p>
  <section v-for="group in groups" :key="group.books[0]?.id" class="mb-16">
    <h2 v-if="group.seriesName" class="mb-8 text-2xl font-semibold">The {{ group.seriesName }} series</h2>
    <div class="space-y-14">
      <BookEntry v-for="book in group.books" :key="book.id" :book="book" :author-name="authorName" />
    </div>
  </section>
</template>
