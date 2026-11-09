<script setup lang="ts">
import type { SiteContent } from '@shared/schema'
import SitePreview from '@/editor/SitePreview.vue'

// The preview side: which page to show, and the page itself. Its layout
// follows the panel's width, like a phone, tablet or computer screen.
defineProps<{ content: SiteContent }>()
const pageId = defineModel<string>('pageId', { required: true })
</script>

<template>
  <section aria-label="Preview" class="p-4">
    <h2 class="mb-2 font-semibold">Preview: what visitors will see after you save</h2>
    <label class="mb-3 flex items-center gap-2 text-sm">
      Page:
      <select v-model="pageId" class="rounded-md border border-panel-line bg-panel p-2">
        <option v-for="page in content.pages" :key="page.id" :value="page.id">{{ page.title }}</option>
      </select>
    </label>
    <SitePreview :content="content" :page-id="pageId" />
  </section>
</template>
