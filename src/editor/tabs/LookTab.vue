<script setup lang="ts">
import { computed } from 'vue'
import { contrastRatio, DEFAULT_THEME, FONTS, MIN_READABLE_CONTRAST } from '@shared/theme'
import type { FontKey } from '@shared/theme'
import { useDraft } from '@/editor/useEditor'
import ColourField from '@/editor/fields/ColourField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import PatternField from '@/editor/fields/PatternField.vue'
import PanelFields from '@/editor/fields/PanelFields.vue'
import { SHAPE_OPTIONS } from '@/editor/fields/pictureOptions'
import ImageField from '@/editor/fields/ImageField.vue'

// The site's colours and fonts, with a warning when text would be hard to
// read on its background.
const draft = useDraft()

const FONT_OPTIONS = (Object.keys(FONTS) as FontKey[]).map((key) => ({ value: key, label: FONTS[key].name }))

const hardToRead = computed(() => {
  const theme = draft.value.theme
  const pairs = [
    { name: 'Text on the background', text: theme.textColour, back: theme.backgroundColour },
    { name: 'Links on the background', text: theme.accentColour, back: theme.backgroundColour },
    { name: 'Button text on the buttons', text: theme.buttonTextColour, back: theme.buttonColour },
  ]
  return pairs.filter((pair) => contrastRatio(pair.text, pair.back) < MIN_READABLE_CONTRAST).map((pair) => pair.name)
})

function resetTheme() {
  if (window.confirm('Go back to the original colours and fonts?')) draft.value.theme = { ...DEFAULT_THEME }
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-5 sm:grid-cols-2">
      <ColourField v-model="draft.theme.backgroundColour" label="Background" />
      <ColourField v-model="draft.theme.textColour" label="Text" />
      <ColourField v-model="draft.theme.accentColour" label="Links and highlights" />
      <ColourField v-model="draft.theme.buttonColour" label="Buttons" />
      <ColourField v-model="draft.theme.buttonTextColour" label="Button text" />
    </div>
    <div role="status">
      <p v-if="hardToRead.length" class="rounded-md bg-notice p-4">
        Hard to read: {{ hardToRead.join(', ') }}. Pick colours further apart (one darker, one lighter).
      </p>
    </div>
    <PatternField
      v-model:pattern="draft.theme.backgroundPattern"
      v-model:colours="draft.theme.patternColours"
      label="Background pattern"
      :preview-background="draft.theme.backgroundColour"
      :preview-ink="draft.theme.textColour"
      behind-name="the page background"
    >
      <p v-if="draft.theme.backgroundImageKey" class="mt-2 rounded-md bg-notice p-3 text-sm">
        Your background picture (below) is showing instead of the pattern. Remove the picture to use a pattern.
      </p>
    </PatternField>
    <ImageField
      v-model="draft.theme.backgroundImageKey"
      label="Background picture"
      hint="Optional. It replaces the pattern; the content sits in the content box over it (set below) so it stays readable."
    />
    <PanelFields v-model="draft.theme.panel" />
    <ChoiceField v-model="draft.theme.workShape" label="Shape of pictures of your work" :options="SHAPE_OPTIONS" />
    <ChoiceField v-model="draft.theme.headingFont" label="Font for headings" :options="FONT_OPTIONS" />
    <ChoiceField v-model="draft.theme.bodyFont" label="Font for text" :options="FONT_OPTIONS" />
    <button type="button" class="rounded-md border border-panel-line bg-panel px-4 py-2" @click="resetTheme">
      Back to the original look
    </button>
  </div>
</template>
