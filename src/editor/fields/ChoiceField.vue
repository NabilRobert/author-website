<script setup lang="ts" generic="Value extends string | number">
import { useId } from 'vue'

// A labelled drop-down list of choices. It takes the width of its column,
// not of its longest choice: in a grid (min-w-0) a long choice used to push
// the box over its neighbour and past the editor's edge.
defineProps<{ label: string; options: { value: Value; label: string }[] }>()
const value = defineModel<Value>({ required: true })
const id = useId()
</script>

<template>
  <div class="min-w-0">
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <select :id="id" v-model="value" class="mt-1 w-full rounded-md border border-panel-line bg-panel p-3 text-base">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </div>
</template>
