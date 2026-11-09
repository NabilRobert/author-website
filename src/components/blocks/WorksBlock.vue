<script setup lang="ts">
import { computed } from 'vue'
import type { BlockOf } from '@shared/blocks'
import type { SiteContent } from '@shared/schema'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import WorkEntry from '@/components/works/WorkEntry.vue'
import WorkList from '@/components/works/WorkList.vue'
import { useSitePath } from '@/content/sitePath'

// The owner's work, from the Work tab: all of it, or only the newest.
const props = defineProps<{ block: BlockOf<'works'>; content: SiteContent }>()
const sitePath = useSitePath()

// The newest by date; an undated work counts as oldest.
const newestWork = computed(() => [...props.content.works].sort((a, b) => b.date.localeCompare(a.date)).at(0))

// "See all" goes to whichever page shows all the work, if one does.
const allWorkPage = computed(() =>
  props.content.pages.find((page) => page.blocks.some((block) => block.type === 'works' && block.show === 'all')),
)
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <template v-if="block.show === 'newest'">
      <WorkEntry
        v-if="newestWork"
        :work="newestWork"
        :owner-name="content.profile.name"
        :shape="content.theme.workShape"
      />
      <RouterLink
        v-if="allWorkPage"
        :to="sitePath(`/${allWorkPage.slug}`)"
        class="mt-8 inline-block font-sans text-accent underline"
        >See all</RouterLink
      >
    </template>
    <WorkList v-else :works="content.works" :owner-name="content.profile.name" :shape="content.theme.workShape" />
  </section>
</template>
