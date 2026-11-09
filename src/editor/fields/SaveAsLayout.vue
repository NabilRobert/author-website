<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Block } from '@shared/blocks'
import { MAX_SAVED_LAYOUTS } from '@shared/schema'
import { useDraft } from '@/editor/useEditor'
import { saveLayout } from '@/editor/savedLayouts'
import TextField from '@/editor/fields/TextField.vue'

// "Save as a layout": names a copy of these blocks and keeps it with the
// site, so it is offered whenever a page (or a work's page) is added.
const props = defineProps<{ blocks: Block[]; defaultName: string }>()
const draft = useDraft()
const isNaming = ref(false)
const name = ref('')
const savedName = ref('')
const isFull = computed(() => draft.value.savedLayouts.length >= MAX_SAVED_LAYOUTS)

function startNaming() {
  name.value = props.defaultName
  savedName.value = ''
  isNaming.value = true
}

function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  saveLayout(draft.value, trimmed, props.blocks)
  savedName.value = trimmed
  isNaming.value = false
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="isNaming" class="flex flex-wrap items-end gap-2">
      <div class="grow"><TextField v-model="name" label="Name of the layout" /></div>
      <button type="button" class="rounded-md bg-action px-4 py-3 font-semibold text-panel" @click="save">
        Save layout
      </button>
      <button type="button" class="rounded-md border border-panel-line px-4 py-3" @click="isNaming = false">
        Cancel
      </button>
    </div>
    <button
      v-else
      type="button"
      class="rounded-md border border-panel-line px-4 py-2 disabled:opacity-50"
      :disabled="!blocks.length || isFull"
      @click="startNaming"
    >
      Save as a layout
    </button>
    <p v-if="savedName" role="status" class="text-sm">
      Saved “{{ savedName }}”. It's offered with the other layouts when you add a page or give a work its own page.
      Press <strong>Save changes</strong> to keep it.
    </p>
    <p v-else-if="isFull" class="text-sm text-panel-muted">
      You have {{ MAX_SAVED_LAYOUTS }} layouts, the most a site keeps. Remove one in the layout picker first.
    </p>
  </div>
</template>
