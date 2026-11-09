<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Work } from '@shared/schema'
import { uniqueSlug } from '@shared/addresses'
import { WORK_SHAPE_CLASSES } from '@/content/frames'
import { useDraft } from '@/editor/useEditor'
import WorkForm from '@/editor/tabs/WorkForm.vue'
import PictureListField from '@/editor/fields/PictureListField.vue'
import CheckboxField from '@/editor/fields/CheckboxField.vue'
import TextField from '@/editor/fields/TextField.vue'
import SaveAsLayout from '@/editor/fields/SaveAsLayout.vue'
import PageBlocksEditor from '@/editor/tabs/PageBlocksEditor.vue'

// Everything about one work in one place, in the Pages tab: its details,
// its more pictures, its page (on or off, and its address) and the blocks
// below the pictures. The preview shows its page alongside.
const work = defineModel<Work>({ required: true })
const emit = defineEmits<{ removed: [] }>()
const draft = useDraft()

const otherSlugs = () => draft.value.works.filter((other) => other.id !== work.value.id).map((other) => other.pageSlug)

// A new work's address follows its title ("New work" → /work/harbour-library)
// until the owner changes the address themself. Saved addresses never
// change on their own, so links to them keep working.
const PLACEHOLDER_ADDRESS = /^new-(work|project)(-\d+)?$/
watch(
  () => work.value.title,
  (title) => {
    if (PLACEHOLDER_ADDRESS.test(work.value.pageSlug)) work.value.pageSlug = uniqueSlug(title, otherSlugs(), 'work')
  },
)

// Emptying the address would leave the work without one, so the last
// character can't be deleted; typing over it works.
const address = computed({
  get: () => work.value.pageSlug,
  set: (value: string) => {
    if (value.trim() !== '') work.value.pageSlug = value
  },
})

function removeWork() {
  if (!window.confirm(`Remove “${work.value.title}” and its page? Undo brings it back until you save.`)) return
  draft.value.works = draft.value.works.filter((other) => other.id !== work.value.id)
  emit('removed')
}
</script>

<template>
  <section class="space-y-4 rounded-md border border-panel-line bg-panel p-4">
    <h2 class="text-xl font-semibold">“{{ work.title || 'Untitled' }}”</h2>
    <WorkForm v-model="work" />
  </section>
  <section class="space-y-4 rounded-md border border-panel-line bg-panel p-4">
    <h2 class="text-xl font-semibold">More pictures</h2>
    <p class="text-sm text-panel-muted">
      Shown as a gallery on its page, below the details. Click one there to enlarge it.
    </p>
    <PictureListField
      v-model="work.morePictures"
      :frame-class="WORK_SHAPE_CLASSES[draft.theme.workShape]"
      empty-hint="No more pictures yet. The page shows just the cover until you add some."
    />
  </section>
  <section class="space-y-4 rounded-md border border-panel-line bg-panel p-4">
    <h2 class="text-xl font-semibold">Its page</h2>
    <CheckboxField v-model="work.showPage" label="Show a page for this work (lists of your work link to it)" />
    <TextField
      v-model="address"
      label="Its address"
      hint="After your page's address and /work/. Lower-case letters, numbers and dashes."
    />
    <SaveAsLayout :blocks="work.pageBlocks" :default-name="`${work.title} layout`" />
    <button type="button" class="rounded-md border border-danger px-4 py-2 text-danger" @click="removeWork">
      Remove this work
    </button>
  </section>
  <section>
    <h2 class="mb-4 text-xl font-semibold">Blocks below the pictures</h2>
    <PageBlocksEditor v-model="work.pageBlocks" />
  </section>
</template>
