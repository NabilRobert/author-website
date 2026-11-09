<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { createEditor, DRAFT_KEY } from '@/editor/useEditor'
import EditorTopBar from '@/editor/EditorTopBar.vue'
import SitePreview from '@/editor/SitePreview.vue'
import PagesTab from '@/editor/tabs/PagesTab.vue'
import BooksTab from '@/editor/tabs/BooksTab.vue'
import NewsTab from '@/editor/tabs/NewsTab.vue'
import AuthorTab from '@/editor/tabs/AuthorTab.vue'
import LookTab from '@/editor/tabs/LookTab.vue'

// The editor: tabs of forms on the left, a live preview of the draft on the
// right (below on a phone), and the Save button on top.
const editor = createEditor()
const { draft, status, loadError, isStarter, isDirty } = editor
provide(DRAFT_KEY, draft)
useHead({ title: 'Edit your site', meta: [{ name: 'robots', content: 'noindex' }] })

const TABS = [
  { key: 'pages', label: 'Pages' },
  { key: 'books', label: 'Books' },
  { key: 'news', label: 'News' },
  { key: 'author', label: 'About you' },
  { key: 'look', label: 'Look' },
] as const
const activeTab = ref<(typeof TABS)[number]['key']>('pages')
const previewPageId = ref('')

// Preview the front page until the owner picks another.
watch(status, () => (previewPageId.value ||= draft.value.pages[0]?.id ?? ''))

// Leaving with unsaved changes asks first (the browser shows its own message).
function warnBeforeLeaving(event: BeforeUnloadEvent) {
  if (isDirty.value) event.preventDefault()
}
onMounted(() => {
  void editor.load()
  window.addEventListener('beforeunload', warnBeforeLeaving)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving))
</script>

<template>
  <!-- The editor keeps its own plain font; only the preview uses the theme. -->
  <div class="min-h-screen bg-panel-back font-sans text-panel-text [--font-heading:var(--font-sans)]">
    <p v-if="status === 'loading'" class="p-8 text-lg">Loading your site…</p>
    <div v-else-if="status === 'signed-out'" class="p-8 text-lg">
      <p>Your sign-in has expired.</p>
      <a href="/edit" class="mt-4 inline-block rounded-md bg-action px-6 py-3 font-semibold text-panel"
        >Sign in again</a
      >
    </div>
    <p v-else-if="status === 'failed'" class="p-8 text-lg text-danger" role="alert">{{ loadError }}</p>
    <template v-else>
      <EditorTopBar :editor="editor" />
      <p v-if="isStarter" class="bg-notice px-4 py-3">
        Your site is new, so this is example content. Change it to your own, then press <strong>Save changes</strong>
        to publish it.
      </p>
      <div class="grid gap-6 p-4 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <section aria-label="Edit">
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
        <section aria-label="Preview" class="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <h2 class="mb-2 font-semibold">Preview: what visitors will see after you save</h2>
          <label class="mb-3 flex items-center gap-2 text-sm">
            Page:
            <select v-model="previewPageId" class="rounded-md border border-panel-line bg-panel p-2">
              <option v-for="page in draft.pages" :key="page.id" :value="page.id">{{ page.title }}</option>
            </select>
          </label>
          <SitePreview :content="draft" :page-id="previewPageId" />
        </section>
      </div>
    </template>
  </div>
</template>
