<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { useDraft } from '@/editor/useEditor'
import TextField from '@/editor/fields/TextField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import { SHAPE_OPTIONS } from '@/editor/fields/shapeOptions'

// Which works the block shows (all, the newest, or the ones ticked here)
// and the shape of their pictures.
const block = defineModel<BlockOf<'works'>>({ required: true })
const draft = useDraft()
const SHOW = [
  { value: 'all' as const, label: 'All of it, in the order of the Work tab' },
  { value: 'newest' as const, label: 'Only the newest (by date)' },
  { value: 'picked' as const, label: 'Only the ones I tick' },
]
const SHAPES = [{ value: '' as const, label: 'Same as the Look tab' }, ...SHAPE_OPTIONS]
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-panel-muted">Shows your work from the Work tab.</p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <ChoiceField v-model="block.show" label="Which works" :options="SHOW" />
    <fieldset v-if="block.show === 'picked'" class="rounded-md border border-panel-line p-3">
      <legend class="px-1 font-semibold">Works to show</legend>
      <p v-if="!draft.works.length" class="text-sm">Add works in the Work tab first.</p>
      <p v-else-if="!block.pickedWorkIds.length" class="mb-2 rounded-md bg-notice p-2 text-sm">
        Nothing is ticked, so this block shows no work yet.
      </p>
      <label v-for="work in draft.works" :key="work.id" class="flex items-center gap-2 py-1">
        <input v-model="block.pickedWorkIds" type="checkbox" :value="work.id" class="size-5" />
        {{ work.title || 'Untitled' }}
      </label>
    </fieldset>
    <ChoiceField v-model="block.shape" label="Shape of the pictures" :options="SHAPES" />
  </div>
</template>
