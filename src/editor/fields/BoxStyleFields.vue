<script setup lang="ts">
import { CORNERS, plainBox } from '@shared/theme'
import type { BoxStyle, Corners } from '@shared/theme'
import { useDraft } from '@/editor/useEditor'
import ColourField from '@/editor/fields/ColourField.vue'
import RangeField from '@/editor/fields/RangeField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import PatternField from '@/editor/fields/PatternField.vue'

// A block's box: fill colour, pattern, how see-through the fill is, text
// colour and corners. With no fill and no pattern there is no box.
const box = defineModel<BoxStyle>({ required: true })
const draft = useDraft()

const CORNER_OPTIONS = (Object.keys(CORNERS) as Corners[]).map((key) => ({ value: key, label: CORNERS[key] }))
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <ColourField v-model="box.background" label="Box colour" can-be-empty empty-name="no box" />
      <ColourField v-model="box.text" label="Text colour" can-be-empty empty-name="the site's text colour" />
    </div>
    <PatternField
      v-model:pattern="box.pattern"
      v-model:colours="box.patternColours"
      label="Box pattern"
      :preview-background="box.background || draft.theme.backgroundColour"
      :preview-ink="box.text || draft.theme.textColour"
      behind-name="the box colour"
    />
    <RangeField
      v-model="box.opacity"
      label="Box opacity"
      hint="How solid the box's colour and pattern are. The text always stays solid."
    />
    <ChoiceField v-model="box.corners" label="Corners" :options="CORNER_OPTIONS" />
    <button type="button" class="rounded-md border border-panel-line bg-panel px-4 py-2" @click="box = plainBox()">
      Remove the box
    </button>
  </div>
</template>
