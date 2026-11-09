<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BlockOf } from '@shared/blocks'
import { parseVideoUrl, playerUrl } from '@shared/videos'
import BlockHeading from '@/components/ui/BlockHeading.vue'

// A YouTube or Vimeo video. Until the visitor presses play it is only a
// button on this site: nothing loads from YouTube or Vimeo (no cookies, no
// tracking), and pages stay fast. Then the player takes its place.
const props = defineProps<{ block: BlockOf<'video'> }>()
const video = computed(() => parseVideoUrl(props.block.url))
const isPlaying = ref(false)
const PROVIDER_NAMES = { youtube: 'YouTube', vimeo: 'Vimeo' } as const

// In the editor's preview, clicks are taken for selecting the block and
// arrive already prevented (src/editor/SitePreview.vue), so it stays a button.
function play(event: MouseEvent) {
  if (!event.defaultPrevented) isPlaying.value = true
}
</script>

<template>
  <section v-if="video">
    <BlockHeading :text="block.heading" />
    <figure>
      <div class="aspect-video w-full overflow-hidden rounded-sm bg-ink shadow-md">
        <iframe
          v-if="isPlaying"
          :src="playerUrl(video)"
          :title="block.caption || block.heading || 'Video'"
          class="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowfullscreen
        />
        <button
          v-else
          type="button"
          class="flex h-full w-full flex-col items-center justify-center gap-3 font-sans text-cream"
          :aria-label="`Play the video${block.caption ? `: ${block.caption}` : ''}`"
          @click="play"
        >
          <span aria-hidden="true" class="flex size-16 items-center justify-center rounded-full bg-cream/20 text-3xl"
            >▶</span
          >
          <span class="text-sm opacity-80">Plays from {{ PROVIDER_NAMES[video.provider] }}</span>
        </button>
      </div>
      <figcaption v-if="block.caption" class="mt-2 font-sans text-sm text-muted">{{ block.caption }}</figcaption>
    </figure>
  </section>
</template>
