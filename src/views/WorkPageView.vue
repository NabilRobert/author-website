<script setup lang="ts">
import { computed } from 'vue'
import { useSiteContent } from '@/content/useSiteContent'
import { usePageHead } from '@/composables/usePageHead'
import WorkPage from '@/components/works/WorkPage.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// /<name>/work/<address>: a work's own page, if the owner gave it one.
const props = defineProps<{ workSlug: string }>()
const { content } = useSiteContent()

const work = computed(() => content.value.works.find((candidate) => candidate.pageSlug === props.workSlug))
usePageHead(() => work.value?.title)
</script>

<template>
  <NotFoundView v-if="!work" />
  <WorkPage v-else :work="work" :content="content" />
</template>
