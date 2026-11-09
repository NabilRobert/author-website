<script setup lang="ts">
import { computed, useId } from 'vue'
import { BACKGROUND_PATTERNS, PATTERN_BASE_COLOUR, PATTERN_COLOUR_ROLES } from '@shared/theme'
import type { BackgroundPattern, PatternColours } from '@shared/theme'
import { patternCss, resolvePaints } from '@/content/backgroundStyle'
import ColourField from '@/editor/fields/ColourField.vue'

// A pattern picker: tiles drawing each pattern in the colours it would
// have, then a colour picker for each part of the chosen pattern and one
// for what shows behind it. Used for the site background and for every
// block's box. Colours left automatic are a faint mix of the text colour.
const props = defineProps<{ label: string; previewBackground: string; previewInk: string; behindName: string }>()
const pattern = defineModel<BackgroundPattern>('pattern', { required: true })
const colours = defineModel<PatternColours>('colours', { required: true })
// Each picker on the page needs its own radio group.
const groupName = useId()

const tiles = computed(() =>
  (Object.keys(BACKGROUND_PATTERNS) as BackgroundPattern[]).map((key) => {
    const css = patternCss(key, resolvePaints(key, colours.value, props.previewInk))
    return {
      key,
      name: BACKGROUND_PATTERNS[key],
      variables: {
        '--site-background-image': css.image,
        '--site-background-size': css.size,
        '--site-background-position': css.position,
        '--site-pattern-base': colours.value[PATTERN_BASE_COLOUR] || 'transparent',
        '--color-paper': props.previewBackground,
      },
    }
  }),
)
const roles = computed(() => PATTERN_COLOUR_ROLES[pattern.value])
</script>

<template>
  <fieldset>
    <legend class="font-semibold">{{ label }}</legend>
    <slot />
    <div class="mt-2 grid grid-cols-3 gap-3">
      <label
        v-for="tile in tiles"
        :key="tile.key"
        class="cursor-pointer rounded-md border-2 border-panel-line bg-panel p-1 text-center text-sm has-checked:border-action has-focus-visible:outline-3"
      >
        <input v-model="pattern" type="radio" :name="groupName" :value="tile.key" class="sr-only" />
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
        v-model="colours[index]!"
        :label="role"
        can-be-empty
        can-be-none
        empty-name="automatic"
      />
      <ColourField
        v-model="colours[PATTERN_BASE_COLOUR]!"
        label="Behind the pattern"
        can-be-empty
        :empty-name="behindName"
      />
    </div>
  </fieldset>
</template>
