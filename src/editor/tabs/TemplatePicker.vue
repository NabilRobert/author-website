<script setup lang="ts" generic="Template extends LayoutTemplate">
import { computed } from 'vue'
import type { LayoutTemplate } from '@/editor/pageTemplates'
import BlockThumbnail from '@/editor/tabs/BlockThumbnail.vue'

// "Choose a layout": a card per template, with sketches of the blocks it
// starts with, top to bottom. Picking one hands it back; Cancel closes.
// The owner's saved layouts also have a Remove button.
const props = defineProps<{ title: string; templates: Template[] }>()
const emit = defineEmits<{ pick: [template: Template]; cancel: []; remove: [savedLayoutId: string] }>()

// Sketched once: building a template's blocks makes new ids each time.
const sketches = computed(() =>
  props.templates.map((template) => ({ template, types: template.blocks().map((block) => block.type) })),
)
</script>

<template>
  <fieldset class="@container space-y-3 rounded-md border-2 border-action bg-panel p-4">
    <legend class="px-1 text-lg font-semibold">{{ title }}</legend>
    <p class="text-sm text-panel-muted">A starting point: change, add or remove any block afterwards.</p>
    <div class="grid gap-3 @lg:grid-cols-2">
      <div v-for="{ template, types } in sketches" :key="template.key" class="relative">
        <button
          type="button"
          class="flex h-full w-full gap-3 rounded-md border-2 border-panel-line p-3 text-left hover:border-action"
          @click="emit('pick', template)"
        >
          <span class="flex w-20 shrink-0 flex-col gap-1" aria-hidden="true">
            <BlockThumbnail v-for="(type, index) in types.slice(0, 4)" :key="index" :type="type" />
            <span v-if="!types.length" class="h-12 w-20 rounded border border-dashed border-panel-line" />
          </span>
          <span>
            <span class="block font-semibold">{{ template.name }}</span>
            <span class="block text-sm text-panel-muted">{{ template.description }}</span>
          </span>
        </button>
        <button
          v-if="template.savedLayoutId"
          type="button"
          class="absolute top-2 right-2 rounded-md bg-panel px-2 py-1 text-sm text-danger underline"
          :aria-label="`Remove the layout ${template.name}`"
          @click="emit('remove', template.savedLayoutId)"
        >
          Remove
        </button>
      </div>
    </div>
    <button type="button" class="rounded-md border border-panel-line px-4 py-2" @click="emit('cancel')">Cancel</button>
  </fieldset>
</template>
