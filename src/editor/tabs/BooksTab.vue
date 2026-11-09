<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { useDraft } from '@/editor/useEditor'
import { moveItem, newBook } from '@/editor/newItems'
import ItemControls from '@/editor/fields/ItemControls.vue'
import BookForm from '@/editor/tabs/BookForm.vue'

// The books, kept once and shown by any "Your books" block and the press
// kit, in the order arranged here: drag a book by its handle, or use Up and
// Down. Each opens to its form.
const draft = useDraft()

function addBook() {
  draft.value.books.unshift(newBook())
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-panel-muted">
      The site shows your books in this order. Drag a book by its handle (⠿) or use Up and Down. Books of one series
      placed next to each other share a series heading. Open a book to change it.
    </p>
    <button type="button" class="rounded-md bg-action px-5 py-3 font-semibold text-panel" @click="addBook">
      + Add a book
    </button>
    <VueDraggable v-model="draft.books" handle=".drag-handle" :animation="150" class="space-y-4">
      <details
        v-for="(book, index) in draft.books"
        :key="book.id"
        class="rounded-md border border-panel-line bg-panel p-4"
        :open="book.title === 'New book'"
      >
        <summary class="flex cursor-pointer items-center gap-3 text-lg font-semibold">
          <span class="drag-handle cursor-grab px-1 text-panel-muted" title="Drag to reorder" aria-hidden="true"
            >⠿</span
          >
          {{ book.title || 'Untitled book' }}
        </summary>
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
    </VueDraggable>
  </div>
</template>
