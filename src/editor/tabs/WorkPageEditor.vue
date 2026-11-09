<script setup lang="ts">
import { computed } from 'vue'
import type { Work } from '@shared/schema'
import TextField from '@/editor/fields/TextField.vue'
import SaveAsLayout from '@/editor/fields/SaveAsLayout.vue'
import PageBlocksEditor from '@/editor/tabs/PageBlocksEditor.vue'

// A work's own page in the Pages tab, edited like any other page: its
// address, removing it, saving it as a layout, and its blocks. Its top part
// (title, picture, description, links) comes from the work in the Work tab.
const work = defineModel<Work>({ required: true })
const emit = defineEmits<{ removed: [] }>()

// An empty address would mean "no page" (shared/schema.ts) and the page
// would vanish mid-typing, so the last character can't be deleted;
// typing over it works. "Remove its page" is the way to remove it.
const address = computed({
  get: () => work.value.pageSlug,
  set: (value: string) => {
    if (value.trim() !== '') work.value.pageSlug = value
  },
})

function removePage() {
  if (!window.confirm(`Remove the page of “${work.value.title}”? Undo brings it back until you save.`)) return
  work.value.pageSlug = ''
  work.value.pageBlocks = []
  emit('removed')
}
</script>

<template>
  <section class="space-y-4 rounded-md border border-panel-line bg-panel p-4">
    <h2 class="text-xl font-semibold">Page of “{{ work.title }}”</h2>
    <p class="text-sm text-panel-muted">
      Its title, picture, description and links sit at the top; change them in the Work tab. The blocks below follow
      them.
    </p>
    <TextField
      v-model="address"
      label="Its address"
      hint="After your page's address and /work/. Lower-case letters, numbers and dashes."
    />
    <button type="button" class="rounded-md border border-danger px-4 py-2 text-danger" @click="removePage">
      Remove its page
    </button>
    <SaveAsLayout :blocks="work.pageBlocks" :default-name="`${work.title} layout`" />
  </section>
  <section>
    <h2 class="mb-4 text-xl font-semibold">Blocks on this page</h2>
    <PageBlocksEditor v-model="work.pageBlocks" />
  </section>
</template>
