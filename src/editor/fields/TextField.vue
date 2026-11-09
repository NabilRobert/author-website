<script setup lang="ts">
import { useId } from 'vue'

// A labelled text box. `multiline` gives a taller box for paragraphs; a
// blank line in it starts a new paragraph on the site.
withDefaults(
  defineProps<{ label: string; hint?: string; multiline?: boolean; type?: 'text' | 'email' | 'url' | 'date' }>(),
  { hint: '', multiline: false, type: 'text' },
)
const value = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block font-semibold">{{ label }}</label>
    <p v-if="hint" :id="`${id}-hint`" class="text-sm text-panel-muted">{{ hint }}</p>
    <textarea
      v-if="multiline"
      :id="id"
      v-model="value"
      rows="6"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      class="mt-1 w-full rounded-md border border-panel-line bg-panel p-3 text-base"
    />
    <input
      v-else
      :id="id"
      v-model="value"
      :type="type"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      class="mt-1 w-full rounded-md border border-panel-line bg-panel p-3 text-base"
    />
  </div>
</template>
