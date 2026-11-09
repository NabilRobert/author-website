<script setup lang="ts">
import { useId } from 'vue'

// A labelled slider for a whole number, showing its value: used for opacity.
withDefaults(defineProps<{ label: string; hint?: string; min?: number; max?: number; unit?: string }>(), {
  hint: '',
  min: 0,
  max: 100,
  unit: '%',
})
const value = defineModel<number>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}: {{ value }}{{ unit }}</label>
    <p v-if="hint" class="text-sm text-panel-muted">{{ hint }}</p>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :value="value"
      class="mt-1 w-full max-w-xs"
      @input="value = Number(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
