<script setup lang="ts">
import { computed, useId } from 'vue'
import { NO_COLOUR } from '@shared/theme'

// A colour picker. With `canBeEmpty`, the colour can be cleared ('') to
// fall back to something automatic; `emptyName` says what that is. With
// `canBeNone`, a fill can have no colour at all (NO_COLOUR), so what is
// behind it shows through.
withDefaults(defineProps<{ label: string; canBeEmpty?: boolean; emptyName?: string; canBeNone?: boolean }>(), {
  canBeEmpty: false,
  emptyName: "the site's colour",
  canBeNone: false,
})
const value = defineModel<string>({ required: true })
const id = useId()
// The picker needs a colour to show while there is none.
const PICKER_PLACEHOLDER = '#888888'
const isPicked = computed(() => value.value.startsWith('#'))
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
      <input
        :id="id"
        type="color"
        :value="isPicked ? value : PICKER_PLACEHOLDER"
        class="h-12 w-16 cursor-pointer rounded-md border border-panel-line bg-panel"
        @input="value = ($event.target as HTMLInputElement).value"
      />
      <span class="font-mono text-sm text-panel-muted">
        {{ value === NO_COLOUR ? 'No colour (see-through)' : value || `Using ${emptyName}` }}
      </span>
      <button
        v-if="canBeEmpty && value"
        type="button"
        class="rounded-md border border-panel-line px-3 py-2 text-sm"
        @click="value = ''"
      >
        Use {{ emptyName }}
      </button>
      <button
        v-if="canBeNone && value !== NO_COLOUR"
        type="button"
        class="rounded-md border border-panel-line px-3 py-2 text-sm"
        @click="value = NO_COLOUR"
      >
        No colour
      </button>
    </div>
  </div>
</template>
