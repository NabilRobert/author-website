<script setup lang="ts">
import type { Link } from '@shared/schema'
import { moveItem } from '@/editor/newItems'
import TextField from '@/editor/fields/TextField.vue'
import ItemControls from '@/editor/fields/ItemControls.vue'

// A list of links, each a name and an address: buy links, social links,
// buttons.
defineProps<{ label: string; hint?: string; addLabel: string; urlHint?: string }>()
const links = defineModel<Link[]>({ required: true })

function addLink() {
  links.value.push({ label: '', url: 'https://' })
}
</script>

<template>
  <fieldset class="rounded-md border border-panel-line p-4">
    <legend class="px-1 font-semibold">{{ label }}</legend>
    <p v-if="hint" class="mb-3 text-sm text-panel-muted">{{ hint }}</p>
    <div v-for="(link, index) in links" :key="index" class="mb-4 space-y-2 border-b border-panel-line pb-4">
      <TextField v-model="link.label" label="Name shown" />
      <TextField v-model="link.url" label="Web address" :hint="urlHint" type="url" />
      <ItemControls
        :item-name="`the link “${link.label || 'without a name'}”`"
        :is-first="index === 0"
        :is-last="index === links.length - 1"
        @move="(offset) => moveItem(links, index, offset)"
        @remove="links.splice(index, 1)"
      />
    </div>
    <button type="button" class="rounded-md border border-action px-4 py-2 font-semibold text-action" @click="addLink">
      + {{ addLabel }}
    </button>
  </fieldset>
</template>
