<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import type { SiteContent } from '@shared/schema'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import BookEntry from '@/components/books/BookEntry.vue'
import BookList from '@/components/books/BookList.vue'
import { useSitePath } from '@/content/sitePath'

// The author's books, from the Books tab: all of them, or only the newest.
const props = defineProps<{ block: BlockOf<'books'>; content: SiteContent }>()
const sitePath = useSitePath()

// The newest by publication date; an undated book counts as oldest.
const newestBook = computed(() =>
  [...props.content.books].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn)).at(0),
)
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <template v-if="block.show === 'newest'">
      <BookEntry v-if="newestBook" :book="newestBook" :author-name="content.author.name" />
      <RouterLink :to="sitePath('/books')" class="mt-8 inline-block font-sans text-accent underline"
        >See all books</RouterLink
      >
    </template>
    <BookList v-else :books="content.books" :author-name="content.author.name" />
  </section>
</template>
