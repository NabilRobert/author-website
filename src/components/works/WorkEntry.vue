<script setup lang="ts">
import { computed } from 'vue'
import type { Work } from '@shared/schema'
import type { PictureCorners, WorkShape } from '@shared/theme'
import { formatDate } from '@/content/format'
import { paragraphs } from '@shared/text'
import { WORK_COLUMN_CLASSES } from '@/content/frames'
import WorkPicture from '@/components/works/WorkPicture.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'
import { useSitePath } from '@/content/sitePath'

// One work in full: picture, title and the line under it, date,
// description, its links and what people said about it. In a list, a work
// with its own page links to it; on that page (isPageTitle) its title is
// the page's heading.
const props = defineProps<{
  work: Work
  ownerName: string
  shape: WorkShape
  corners: PictureCorners
  isPageTitle?: boolean
}>()
const sitePath = useSitePath()
const pageLink = computed(() =>
  props.work.showPage && !props.isPageTitle ? sitePath(`/work/${props.work.pageSlug}`) : null,
)
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
        :corners="corners"
      />
    </div>
    <div>
      <component :is="isPageTitle ? 'h1' : 'h3'" class="font-semibold" :class="isPageTitle ? 'text-5xl' : 'text-3xl'">
        <RouterLink v-if="pageLink" :to="pageLink" class="hover:underline">{{ work.title }}</RouterLink>
        <template v-else>{{ work.title }}</template>
      </component>
      <p v-if="work.subtitle || work.date" class="mt-1 font-sans text-sm text-muted">
        {{ [work.subtitle, formatDate(work.date)].filter(Boolean).join(' · ') }}
      </p>
      <div class="prose-text mt-4">
        <p v-for="(paragraph, index) in paragraphs(work.description)" :key="index">{{ paragraph }}</p>
      </div>
      <div class="mt-5">
        <LinkButtons :links="work.links" :label="`Links for ${work.title}`" />
      </div>
      <RouterLink v-if="pageLink" :to="pageLink" class="mt-5 inline-block font-sans text-accent underline">
        See the whole project
      </RouterLink>
      <figure v-for="quote in work.quotes" :key="quote.quote" class="mt-6 border-l-2 border-accent pl-4">
        <blockquote class="text-lg italic">“{{ quote.quote }}”</blockquote>
        <figcaption class="mt-1 font-sans text-sm text-muted">{{ quote.source }}</figcaption>
      </figure>
    </div>
  </article>
</template>
