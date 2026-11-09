<script setup lang="ts">
import { useId } from 'vue'

// A colour picker. With `canBeEmpty`, the colour can be cleared ('') to
// fall back to something automatic; `emptyName` says what that is.
withDefaults(defineProps<{ label: string; canBeEmpty?: boolean; emptyName?: string }>(), {
  canBeEmpty: false,
  emptyName: "the site's colour",
})
const value = defineModel<string>({ required: true })
const id = useId()
// The picker needs a colour to show while the value is empty.
const PICKER_PLACEHOLDER = '#888888'
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <div class="mt-1 flex items-center gap-3">
      <input
        :id="id"
        type="color"
        :value="value || PICKER_PLACEHOLDER"
        class="h-12 w-16 cursor-pointer rounded-md border border-panel-line bg-panel"
        @input="value = ($event.target as HTMLInputElement).value"
      />
      <span class="font-mono text-sm text-panel-muted">{{ value || `Using ${emptyName}` }}</span>
      <button
        v-if="canBeEmpty && value"
        type="button"
        class="rounded-md border border-panel-line px-3 py-2 text-sm"
        @click="value = ''"
      >
        Use {{ emptyName }}
      </button>
    </div>
  </div>
</template>
