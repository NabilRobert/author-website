<script setup lang="ts">
// A labelled text box for the login page. Other attributes (type,
// autocomplete, required, inputmode, class…) go to the box itself.
defineOptions({ inheritAttrs: false })
defineProps<{ id: string; label: string; hint?: string }>()
const value = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label class="block font-semibold" :for="id">{{ label }}</label>
    <p v-if="hint" :id="`${id}-hint`" class="text-sm text-panel-muted">{{ hint }}</p>
    <input
      :id="id"
      v-model="value"
      v-bind="$attrs"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      class="mt-1 w-full rounded-md border border-panel-line p-3 text-base"
    />
  </div>
</template>
