<script setup lang="ts">
// A labelled tick box.
defineProps<{ label: string }>()
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="flex items-center gap-3 font-semibold">
    <input v-model="checked" type="checkbox" class="size-5" />
    {{ label }}
  </label>
</template>
