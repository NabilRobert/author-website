<script setup lang="ts">
import { computed } from 'vue'
import { useSiteContent } from '@/content/useSiteContent'
import { usePageHead } from '@/composables/usePageHead'
import { useCountVisit } from '@/content/countVisit'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import PageBlocks from '@/components/blocks/PageBlocks.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// Any page the owner built, found by its address: '' is the front page.
const props = defineProps<{ slug: string }>()
const { content } = useSiteContent()

const page = computed(() => content.value.pages.find((candidate) => candidate.slug === props.slug))
// A page that starts with a big banner uses the banner's heading as its title.
const startsWithBanner = computed(() => page.value?.blocks[0]?.type === 'hero')

usePageHead(() => (page.value && page.value.slug ? page.value.title : undefined))
useCountVisit(() => page.value !== undefined)
</script>

<template>
  <NotFoundView v-if="!page" />
  <template v-else>
    <SectionHeading v-if="!startsWithBanner" :title="page.title" />
    <PageBlocks :blocks="page.blocks" :content="content" />
  </template>
</template>
