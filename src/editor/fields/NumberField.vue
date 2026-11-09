<script setup lang="ts">
import { computed, useId } from 'vue'

// A labelled box for a whole number that may be left empty (null).
defineProps<{ label: string; hint?: string }>()
const value = defineModel<number | null>({ required: true })
const id = useId()

const text = computed({
  get: () => (value.value === null ? '' : String(value.value)),
  set: (typed: string) => {
    const number = Number.parseInt(typed, 10)
    value.value = Number.isNaN(number) ? null : number
  },
})
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <p v-if="hint" class="text-sm text-panel-muted">{{ hint }}</p>
    <input
      :id="id"
      v-model="text"
      type="number"
      min="1"
      class="mt-1 w-32 rounded-md border border-panel-line bg-panel p-3 text-base"
    />
  </div>
</template>
