<script setup lang="ts">
import { computed } from 'vue'
import type { Work } from '@shared/schema'
import type { WorkShape } from '@shared/theme'
import { groupWorks } from '@/content/format'
import WorkEntry from '@/components/works/WorkEntry.vue'

// Every work, in the order the owner arranged them; neighbouring works of
// one group (a series, collection or client) share its name as a heading.
const props = defineProps<{ works: Work[]; ownerName: string; shape: WorkShape }>()
const groups = computed(() => groupWorks(props.works))
</script>

<template>
  <p v-if="!works.length" class="text-lg text-muted">Nothing here yet.</p>
  <section v-for="group in groups" :key="group.works[0]?.id" class="mb-16">
    <h2 v-if="group.group" class="mb-8 text-2xl font-semibold">{{ group.group }}</h2>
    <div class="space-y-14">
      <WorkEntry v-for="work in group.works" :key="work.id" :work="work" :owner-name="ownerName" :shape="shape" />
    </div>
  </section>
</template>
