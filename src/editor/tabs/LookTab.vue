<script setup lang="ts">
import { computed } from 'vue'
import { contrastRatio, DEFAULT_THEME, FONTS, MIN_READABLE_CONTRAST } from '@shared/theme'
import type { FontKey } from '@shared/theme'
import { useDraft } from '@/editor/useEditor'
import ColourField from '@/editor/fields/ColourField.vue'
import ChoiceField from '@/editor/fields/ChoiceField.vue'
import PatternField from '@/editor/fields/PatternField.vue'
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
    <PatternField v-model="draft.theme" />
    <ImageField
      v-model="draft.theme.backgroundImageKey"
      label="Background picture"
      hint="Optional. It replaces the pattern; the text sits on a light panel over it so it stays readable."
    />
    <ChoiceField v-model="draft.theme.headingFont" label="Font for headings" :options="FONT_OPTIONS" />
    <ChoiceField v-model="draft.theme.bodyFont" label="Font for text" :options="FONT_OPTIONS" />
    <button type="button" class="rounded-md border border-panel-line bg-panel px-4 py-2" @click="resetTheme">
      Back to the original look
    </button>
  </div>
</template>
