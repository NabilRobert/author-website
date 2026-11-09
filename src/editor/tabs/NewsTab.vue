<script setup lang="ts">
import type { NewsItem } from '@shared/schema'
import { useDraft } from '@/editor/useEditor'
import { newNewsItem } from '@/editor/newItems'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'

// News posts and events. The site sorts them by date, newest first, so
// there is nothing to reorder.
const draft = useDraft()

const KINDS: { value: NewsItem['kind']; label: string }[] = [
  { value: 'news', label: 'News post' },
  { value: 'event', label: 'Event' },
]

function removeItem(index: number, title: string) {
  if (window.confirm(`Remove “${title}”? Nothing changes on the site until you save.`)) {
    draft.value.news.splice(index, 1)
  }
}
</script>

<template>
  <div class="space-y-4">
    <button
      type="button"
      class="rounded-md bg-action px-5 py-3 font-semibold text-panel"
      @click="draft.news.unshift(newNewsItem(new Date()))"
    >
      + Add news or an event
    </button>
    <details
      v-for="(item, index) in draft.news"
      :key="item.id"
      class="rounded-md border border-panel-line bg-panel p-4"
      :open="item.title === 'New post'"
    >
      <summary class="cursor-pointer text-lg font-semibold">
        {{ item.title || 'Untitled' }} · {{ item.happensOn }}
      </summary>
      <div class="mt-4 space-y-4">
        <ChoiceField v-model="item.kind" label="Kind" :options="KINDS" />
        <TextField v-model="item.title" label="Headline" />
        <TextField v-model="item.happensOn" label="Date" type="date" hint="For an event, the day it happens." />
        <TextField v-model="item.place" label="Place" hint="Optional. For events, like a bookshop or a city." />
        <TextField v-model="item.body" label="Text" multiline />
        <TextField v-model="item.linkUrl" label="Link" hint="Optional. A full address for tickets or details." />
        <button
          type="button"
          class="rounded-md border border-danger px-3 py-2 text-sm text-danger"
          @click="removeItem(index, item.title)"
        >
          Remove
        </button>
      </div>
    </details>
  </div>
</template>
