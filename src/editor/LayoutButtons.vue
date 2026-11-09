<script setup lang="ts">
// Quick layouts for the split between the forms and the preview, for those
// who'd rather click than drag the divider.
const editorShare = defineModel<number>({ required: true })

const LAYOUTS = [
  { label: 'Editor only', share: 100 },
  { label: 'Side by side', share: 45 },
  { label: 'Preview only', share: 0 },
]
</script>

<template>
  <div role="group" aria-label="Layout" class="flex gap-1 text-sm">
    <button
      v-for="layout in LAYOUTS"
      :key="layout.label"
      type="button"
      :aria-pressed="Math.round(editorShare) === layout.share"
      class="rounded-md border border-panel-line bg-panel px-3 py-1 aria-pressed:border-action aria-pressed:text-action"
      @click="editorShare = layout.share"
    >
      {{ layout.label }}
    </button>
  </div>
</template>
