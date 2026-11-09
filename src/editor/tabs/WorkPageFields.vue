<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Work } from '@shared/schema'
import { useDraft } from '@/editor/useEditor'
import { uniqueSlug } from '@/editor/newItems'
import { WORK_PAGE_TEMPLATES } from '@/editor/pageTemplates'
import type { LayoutTemplate } from '@/editor/pageTemplates'
import { removeSavedLayout, savedLayoutChoices } from '@/editor/savedLayouts'
import TemplatePicker from '@/editor/tabs/TemplatePicker.vue'

// In the Work tab: give a work its own page (picking a layout), or go and
// edit the page it has. The page itself is edited in the Pages tab
// (WorkPageEditor), like every other page.
const work = defineModel<Work>({ required: true })
const emit = defineEmits<{ editPage: [] }>()
const draft = useDraft()
const isChoosingLayout = ref(false)
const layoutChoices = computed(() => [...WORK_PAGE_TEMPLATES, ...savedLayoutChoices(draft.value.savedLayouts)])

function givePage(template: LayoutTemplate) {
  const takenSlugs = draft.value.works.filter((other) => other.id !== work.value.id).map((other) => other.pageSlug)
  work.value.pageSlug = uniqueSlug(work.value.title, takenSlugs, 'work')
  work.value.pageBlocks = template.blocks()
  isChoosingLayout.value = false
  emit('editPage')
}
</script>

<template>
  <section class="space-y-3 rounded-md border border-panel-line p-3">
    <h3 class="font-semibold">Its own page</h3>
    <template v-if="work.pageSlug">
      <p class="text-sm">It has its own page at /work/{{ work.pageSlug }}.</p>
      <button
        type="button"
        class="rounded-md border-2 border-action px-4 py-2 font-semibold text-action"
        @click="emit('editPage')"
      >
        Edit its page
      </button>
    </template>
    <template v-else>
      <p class="text-sm text-panel-muted">
        Optional: a page just for this work, with more pictures and its story. Lists of your work then link to it.
      </p>
      <TemplatePicker
        v-if="isChoosingLayout"
        title="Choose a layout for its page"
        :templates="layoutChoices"
        @pick="givePage"
        @remove="(layoutId) => removeSavedLayout(draft, layoutId)"
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
  </section>
</template>
