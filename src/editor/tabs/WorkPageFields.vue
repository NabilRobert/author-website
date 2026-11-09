<script setup lang="ts">
import { ref } from 'vue'
import type { Work } from '@shared/schema'
import { useDraft } from '@/editor/useEditor'
import { uniqueSlug } from '@/editor/newItems'
import { WORK_PAGE_TEMPLATES } from '@/editor/pageTemplates'
import type { LayoutTemplate } from '@/editor/pageTemplates'
import TextField from '@/editor/fields/TextField.vue'
import TemplatePicker from '@/editor/tabs/TemplatePicker.vue'
import PageBlocksEditor from '@/editor/tabs/PageBlocksEditor.vue'

// A work's own page: off, or on with its address and its blocks. Turning it
// on picks a layout (src/editor/pageTemplates.ts) and shows the page in the
// preview.
const work = defineModel<Work>({ required: true })
const emit = defineEmits<{ preview: [] }>()
const draft = useDraft()
const isChoosingLayout = ref(false)

function givePage(template: LayoutTemplate) {
  const takenSlugs = draft.value.works.filter((other) => other.id !== work.value.id).map((other) => other.pageSlug)
  work.value.pageSlug = uniqueSlug(work.value.title, takenSlugs, 'work')
  work.value.pageBlocks = template.blocks()
  isChoosingLayout.value = false
  emit('preview')
}

function removePage() {
  if (!window.confirm(`Remove the page of “${work.value.title}”? Undo brings it back until you save.`)) return
  work.value.pageSlug = ''
  work.value.pageBlocks = []
}
</script>

<template>
  <section class="space-y-4 rounded-md border border-panel-line p-3">
    <h3 class="font-semibold">Its own page</h3>
    <template v-if="!work.pageSlug">
      <p class="text-sm text-panel-muted">
        Optional: a page just for this work, with more pictures and its story. Lists of your work then link to it.
      </p>
      <TemplatePicker
        v-if="isChoosingLayout"
        title="Choose a layout for its page"
        :templates="WORK_PAGE_TEMPLATES"
        @pick="givePage"
        @cancel="isChoosingLayout = false"
      />
      <button
        v-else
        type="button"
        class="rounded-md border-2 border-action px-4 py-2 font-semibold text-action"
        @click="isChoosingLayout = true"
      >
        Give this work its own page
      </button>
    </template>
    <template v-else>
      <TextField
        v-model="work.pageSlug"
        label="Its address"
        hint="After your page's address and /work/. Lower-case letters, numbers and dashes."
      />
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-md border border-panel-line px-4 py-2" @click="emit('preview')">
          Show it in the preview
        </button>
        <button type="button" class="rounded-md border border-danger px-4 py-2 text-danger" @click="removePage">
          Remove its page
        </button>
      </div>
      <p class="text-sm text-panel-muted">
        The title, picture, description and links above sit at the top of the page; these blocks follow.
      </p>
      <PageBlocksEditor v-model="work.pageBlocks" />
    </template>
  </section>
</template>
