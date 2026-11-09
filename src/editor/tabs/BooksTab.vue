<script setup lang="ts">
import { useDraft } from '@/editor/useEditor'
import { moveItem, newBook } from '@/editor/newItems'
import ItemControls from '@/editor/fields/ItemControls.vue'
import BookForm from '@/editor/tabs/BookForm.vue'

// The books, kept once and shown by any "Your books" block and the press
// kit. Each opens to its form.
const draft = useDraft()

function addBook() {
  draft.value.books.unshift(newBook())
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-panel-muted">
      Books in the same series are shown together, in order of their number. Open a book to change it.
    </p>
    <button type="button" class="rounded-md bg-action px-5 py-3 font-semibold text-panel" @click="addBook">
      + Add a book
    </button>
    <details
      v-for="(book, index) in draft.books"
      :key="book.id"
      class="rounded-md border border-panel-line bg-panel p-4"
      :open="book.title === 'New book'"
    >
      <summary class="cursor-pointer text-lg font-semibold">{{ book.title || 'Untitled book' }}</summary>
      <div class="mt-4 space-y-4">
        <BookForm v-model="draft.books[index]!" />
        <ItemControls
          :item-name="`the book “${book.title}”`"
          :is-first="index === 0"
          :is-last="index === draft.books.length - 1"
          @move="(offset) => moveItem(draft.books, index, offset)"
          @remove="draft.books.splice(index, 1)"
        />
      </div>
    </details>
  </div>
</template>
