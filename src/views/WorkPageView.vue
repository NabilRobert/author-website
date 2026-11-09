<script setup lang="ts">
import { computed } from 'vue'
import { useSiteContent } from '@/content/useSiteContent'
import { usePageHead } from '@/composables/usePageHead'
import { useCountVisit } from '@/content/countVisit'
import WorkPage from '@/components/works/WorkPage.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// /<name>/work/<address>: a work's own page, unless the owner switched it off.
const props = defineProps<{ workSlug: string }>()
const { content } = useSiteContent()

const work = computed(() =>
  content.value.works.find((candidate) => candidate.showPage && candidate.pageSlug === props.workSlug),
)
usePageHead(() => work.value?.title)
useCountVisit(() => work.value !== undefined)
</script>

<template>
  <NotFoundView v-if="!work" />
  <WorkPage v-else :work="work" :content="content" />
</template>
