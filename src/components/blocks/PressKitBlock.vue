<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import type { SiteContent } from '@shared/schema'
import { imageUrl } from '@/content/format'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import BookCover from '@/components/books/BookCover.vue'

// For journalists and event organisers: a headshot and covers to download,
// and a short bio to copy.
defineProps<{ block: BlockOf<'pressKit'>; content: SiteContent }>()
</script>

<template>
  <BlockHeading :text="block.heading" />
  <div class="space-y-12">
    <section>
      <h3 class="mb-3 text-2xl font-semibold">Short bio</h3>
      <p class="prose-text rounded-sm bg-paper-deep p-5">{{ content.author.bioShort }}</p>
    </section>
    <section v-if="content.author.photoKey">
      <h3 class="mb-3 text-2xl font-semibold">Author photo</h3>
      <a :href="imageUrl(content.author.photoKey)" download class="inline-block">
        <img
          :src="imageUrl(content.author.photoKey)"
          :alt="`Photo of ${content.author.name}`"
          class="w-48 rounded-sm shadow-md"
        />
        <span class="mt-2 block font-sans text-accent underline">Download photo</span>
      </a>
    </section>
    <section v-if="content.books.length">
      <h3 class="mb-3 text-2xl font-semibold">Covers</h3>
      <ul class="grid grid-cols-2 gap-6 @2xl:grid-cols-4">
        <li v-for="book in content.books" :key="book.id">
          <BookCover :title="book.title" :author-name="content.author.name" :cover-key="book.coverKey" />
          <a
            v-if="book.coverKey"
            :href="imageUrl(book.coverKey)"
            download
            class="mt-2 block font-sans text-accent underline"
            >Download cover</a
          >
          <p v-else class="mt-2 font-sans text-sm text-muted">Cover image coming soon</p>
        </li>
      </ul>
    </section>
  </div>
</template>
