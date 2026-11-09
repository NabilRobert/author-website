<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import { parseVideoUrl } from '@shared/videos'
import TextField from '@/editor/fields/TextField.vue'

// A video: its YouTube or Vimeo link, a heading and a caption. A link the
// site can't play is pointed out as it is typed, not only on saving.
const block = defineModel<BlockOf<'video'>>({ required: true })
const isUnplayable = computed(() => block.value.url.trim() !== '' && parseVideoUrl(block.value.url) === null)
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <TextField
      v-model="block.url"
      label="Video link"
      type="url"
      hint="Copy it from the address bar or the Share button on YouTube or Vimeo."
    />
    <p v-if="isUnplayable" role="alert" class="text-sm font-semibold text-danger">
      That isn't a YouTube or Vimeo video link. It looks like https://www.youtube.com/watch?v=… or
      https://vimeo.com/123….
    </p>
    <TextField v-model="block.caption" label="Caption" hint="Optional. Shown under the video." />
  </div>
</template>
