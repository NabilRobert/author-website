<script setup lang="ts">
import { computed } from 'vue'
import { BACKGROUND_PATTERNS, PATTERN_BASE_COLOUR, PATTERN_COLOUR_ROLES } from '@shared/theme'
import type { BackgroundPattern, Theme } from '@shared/theme'
import { backgroundVariables } from '@/content/backgroundStyle'
import ColourField from '@/editor/fields/ColourField.vue'

// The background patterns as tiles, each drawn in the draft's own colours,
// then a colour picker for each part of the chosen pattern (up to three)
// and one for what shows behind it. Colours left automatic are a faint mix
// of the text colour, which suits any theme.
const theme = defineModel<Theme>({ required: true })

const tiles = computed(() =>
  (Object.keys(BACKGROUND_PATTERNS) as BackgroundPattern[]).map((key) => ({
    key,
    name: BACKGROUND_PATTERNS[key],
    variables: {
      ...backgroundVariables({ ...theme.value, backgroundPattern: key, backgroundImageKey: null }),
      '--color-paper': theme.value.backgroundColour,
    },
  })),
)
const roles = computed(() => PATTERN_COLOUR_ROLES[theme.value.backgroundPattern])
</script>

<template>
  <fieldset>
    <legend class="font-semibold">Background pattern</legend>
    <p v-if="theme.backgroundImageKey" class="mt-2 rounded-md bg-notice p-3 text-sm">
      Your background picture (below) is showing instead of the pattern. Remove the picture to use a pattern.
    </p>
    <div class="mt-2 grid grid-cols-3 gap-3">
      <label
        v-for="tile in tiles"
        :key="tile.key"
        class="cursor-pointer rounded-md border-2 border-panel-line bg-panel p-1 text-center text-sm has-checked:border-action has-focus-visible:outline-3"
      >
        <input
          v-model="theme.backgroundPattern"
          type="radio"
          name="background-pattern"
          :value="tile.key"
          class="sr-only"
        />
        <span class="site-background block h-14 rounded" :style="tile.variables" aria-hidden="true" />
        <span class="mt-1 block">{{ tile.name }}</span>
      </label>
    </div>
  </fieldset>
  <fieldset v-if="roles.length" class="space-y-4">
    <legend class="font-semibold">Pattern colours</legend>
    <p class="text-sm text-panel-muted">Soft colours keep the text easy to read.</p>
    <div class="grid gap-4 sm:grid-cols-2">
      <ColourField
        v-for="(role, index) in roles"
        :key="role"
        v-model="theme.patternColours[index]!"
        :label="role"
        can-be-empty
        empty-name="automatic"
      />
      <ColourField
        v-model="theme.patternColours[PATTERN_BASE_COLOUR]!"
        label="Behind the pattern"
        can-be-empty
        empty-name="the page background"
      />
    </div>
  </fieldset>
</template>
