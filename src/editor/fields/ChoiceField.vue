<script setup lang="ts" generic="Value extends string">
import { useId } from 'vue'

// A labelled drop-down list of choices.
defineProps<{ label: string; options: { value: Value; label: string }[] }>()
const value = defineModel<Value>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <select :id="id" v-model="value" class="mt-1 rounded-md border border-panel-line bg-panel p-3 text-base">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </div>
</template>
