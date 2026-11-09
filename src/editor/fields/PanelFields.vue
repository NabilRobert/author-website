<script setup lang="ts">
import { CORNERS, PANEL_WIDTHS } from '@shared/theme'
import type { Corners, Panel, PanelWidth } from '@shared/theme'
import ColourField from '@/editor/fields/ColourField.vue'
import RangeField from '@/editor/fields/RangeField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'

// The content box that sits over a background picture or a pattern in your
// own colours: its colour, opacity, corners and width.
const panel = defineModel<Panel>({ required: true })

const CORNER_OPTIONS = (Object.keys(CORNERS) as Corners[]).map((key) => ({ value: key, label: CORNERS[key] }))
const WIDTH_OPTIONS = (Object.keys(PANEL_WIDTHS) as PanelWidth[]).map((key) => ({
  value: key,
  label: PANEL_WIDTHS[key],
}))
</script>

<template>
  <fieldset class="space-y-4 rounded-md border border-panel-line p-4">
    <legend class="px-1 font-semibold">Content box</legend>
    <p class="text-sm text-panel-muted">
      Appears over a background picture, or over a pattern in your own colours, so the text stays readable.
    </p>
    <ColourField v-model="panel.colour" label="Box colour" can-be-empty can-be-none empty-name="the page background" />
    <RangeField v-model="panel.opacity" label="Box opacity" hint="Lower lets more of the background show through." />
    <ChoiceField v-model="panel.width" label="Width" :options="WIDTH_OPTIONS" />
    <ChoiceField v-model="panel.corners" label="Corners" :options="CORNER_OPTIONS" />
  </fieldset>
</template>
