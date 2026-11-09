<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import type { NewsItem } from '@shared/schema'
import { formatDate, newestFirst, paragraphs } from '@/content/format'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import { useSitePath } from '@/content/sitePath'

// News posts and events from the News tab, newest first; the block's limit
// shows only the latest few.
const props = defineProps<{ block: BlockOf<'news'>; items: NewsItem[] }>()
const sitePath = useSitePath()
const shown = computed(() => newestFirst(props.items).slice(0, props.block.limit ?? undefined))
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <p v-if="!items.length" class="text-lg text-muted">No news yet.</p>
    <ol class="space-y-10">
      <li v-for="item in shown" :key="item.id">
        <article>
          <p class="small-caps text-muted">
            <span :class="item.kind === 'event' ? 'text-accent' : ''">{{
              item.kind === 'event' ? 'Event' : 'News'
            }}</span>
            · <time :datetime="item.happensOn">{{ formatDate(item.happensOn) }}</time>
            <template v-if="item.place"> · {{ item.place }}</template>
          </p>
          <h3 class="mt-1 text-2xl font-semibold">{{ item.title }}</h3>
          <div class="prose-text mt-2">
            <p v-for="(paragraph, index) in paragraphs(item.body)" :key="index">{{ paragraph }}</p>
          </div>
          <a
            v-if="item.linkUrl"
            :href="item.linkUrl"
            rel="noopener"
            class="mt-2 inline-block font-sans text-accent underline"
            >More details</a
          >
        </article>
      </li>
    </ol>
    <RouterLink
      v-if="block.limit && items.length > block.limit"
      :to="sitePath('/news')"
      class="mt-8 inline-block font-sans text-accent underline"
      >All news and events</RouterLink
    >
  </section>
</template>
