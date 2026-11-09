<script setup lang="ts">
import { ref } from 'vue'
import PagesTab from '@/editor/tabs/PagesTab.vue'
import BooksTab from '@/editor/tabs/BooksTab.vue'
import NewsTab from '@/editor/tabs/NewsTab.vue'
import AuthorTab from '@/editor/tabs/AuthorTab.vue'
import LookTab from '@/editor/tabs/LookTab.vue'

// The editing side: the tabs and the active tab's forms. The page picked in
// the Pages tab is the one the preview shows.
const previewPageId = defineModel<string>('previewPageId', { required: true })

const TABS = [
  { key: 'pages', label: 'Pages' },
  { key: 'books', label: 'Books' },
  { key: 'news', label: 'News' },
  { key: 'author', label: 'About you' },
  { key: 'look', label: 'Look' },
] as const
const activeTab = ref<(typeof TABS)[number]['key']>('pages')
</script>

<template>
  <section aria-label="Edit" class="p-4">
    <div role="tablist" class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        role="tab"
        type="button"
        :aria-selected="activeTab === tab.key"
        class="rounded-md border-2 border-panel-line bg-panel px-4 py-2 text-lg font-semibold aria-selected:border-action aria-selected:bg-action aria-selected:text-panel"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <PagesTab v-if="activeTab === 'pages'" v-model:page-id="previewPageId" />
    <BooksTab v-else-if="activeTab === 'books'" />
    <NewsTab v-else-if="activeTab === 'news'" />
    <AuthorTab v-else-if="activeTab === 'author'" />
    <LookTab v-else />
  </section>
</template>
