<script setup lang="ts">
import { computed } from 'vue'
import { imageUrl } from '@/content/format'

// A book's cover: the uploaded image, or, until there is one, a plain
// typeset cover (title and author on a colour block) so the page never
// shows a broken or empty box.
const props = defineProps<{ title: string; authorName: string; coverKey: string | null }>()

const TYPESET_COLOURS = ['bg-cover-1', 'bg-cover-2', 'bg-cover-3', 'bg-cover-4']

// The same title always gets the same colour.
const typesetColour = computed(() => {
  let hash = 0
  for (const character of props.title) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return TYPESET_COLOURS[hash % TYPESET_COLOURS.length]
})
</script>

<template>
  <img
    v-if="coverKey"
    :src="imageUrl(coverKey)"
    :alt="`Cover of ${title}`"
    class="aspect-[2/3] w-full rounded-sm object-cover shadow-md"
    loading="lazy"
  />
  <div
    v-else
    role="img"
    :aria-label="`Cover of ${title}`"
    :class="typesetColour"
    class="flex aspect-[2/3] w-full flex-col justify-between rounded-sm p-[10%] text-cream shadow-md"
  >
    <span class="text-[clamp(1rem,2.4cqw,1.6rem)] leading-tight font-semibold">{{ title }}</span>
    <span class="small-caps opacity-90">{{ authorName }}</span>
  </div>
</template>
