<script setup lang="ts">
import { computed } from 'vue'
import { BACKGROUND_PATTERNS } from '@shared/theme'
import type { BackgroundPattern, Theme } from '@shared/theme'
import { backgroundVariables } from '@/content/backgroundStyle'

// The background patterns as tiles, each drawn in the draft's own colours,
// so the owner sees what each will look like before picking it.
const props = defineProps<{ theme: Theme }>()
const pattern = defineModel<BackgroundPattern>({ required: true })

const tiles = computed(() =>
  (Object.keys(BACKGROUND_PATTERNS) as BackgroundPattern[]).map((key) => ({
    key,
    name: BACKGROUND_PATTERNS[key],
    style: {
      ...backgroundVariables({ ...props.theme, backgroundPattern: key, backgroundImageKey: null }),
      backgroundColor: props.theme.backgroundColour,
    },
  })),
)
</script>

<template>
  <fieldset>
    <legend class="font-semibold">Background pattern</legend>
    <div class="mt-2 grid grid-cols-3 gap-3">
      <label
        v-for="tile in tiles"
        :key="tile.key"
        class="cursor-pointer rounded-md border-2 border-panel-line bg-panel p-1 text-center text-sm has-[:checked]:border-action has-[:focus-visible]:outline has-[:focus-visible]:outline-3"
      >
        <input v-model="pattern" type="radio" name="background-pattern" :value="tile.key" class="sr-only" />
        <span class="site-background block h-14 rounded" :style="tile.style" aria-hidden="true" />
        <span class="mt-1 block">{{ tile.name }}</span>
      </label>
    </div>
  </fieldset>
</template>
