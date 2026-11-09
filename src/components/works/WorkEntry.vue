<script setup lang="ts">
import type { Work } from '@shared/schema'
import type { WorkShape } from '@shared/theme'
import { formatDate, paragraphs } from '@/content/format'
import { WORK_COLUMN_CLASSES } from '@/content/frames'
import WorkPicture from '@/components/works/WorkPicture.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'

// One work in full: picture, title and the line under it, date,
// description, its links and what people said about it.
defineProps<{ work: Work; ownerName: string; shape: WorkShape }>()
</script>

<template>
  <article :class="WORK_COLUMN_CLASSES[shape]" class="grid gap-6 @2xl:gap-10">
    <div class="max-w-72 @2xl:max-w-none">
      <WorkPicture
        :title="work.title"
        :owner-name="ownerName"
        :image-key="work.imageKey"
        :image-crop="work.imageCrop"
        :shape="shape"
      />
    </div>
    <div>
      <h3 class="text-3xl font-semibold">{{ work.title }}</h3>
      <p v-if="work.subtitle || work.date" class="mt-1 font-sans text-sm text-muted">
        {{ [work.subtitle, formatDate(work.date)].filter(Boolean).join(' · ') }}
      </p>
      <div class="prose-text mt-4">
        <p v-for="(paragraph, index) in paragraphs(work.description)" :key="index">{{ paragraph }}</p>
      </div>
      <div class="mt-5">
        <LinkButtons :links="work.links" :label="`Links for ${work.title}`" />
      </div>
      <figure v-for="quote in work.quotes" :key="quote.quote" class="mt-6 border-l-2 border-accent pl-4">
        <blockquote class="text-lg italic">“{{ quote.quote }}”</blockquote>
        <figcaption class="mt-1 font-sans text-sm text-muted">{{ quote.source }}</figcaption>
      </figure>
    </div>
  </article>
</template>
