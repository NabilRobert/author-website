<script setup lang="ts">
import { ref, watch } from 'vue'
import { useBlockSelection } from '@/editor/blockSelection'
import PagesTab from '@/editor/tabs/PagesTab.vue'
import WorksTab from '@/editor/tabs/WorksTab.vue'
import NewsTab from '@/editor/tabs/NewsTab.vue'
import ProfileTab from '@/editor/tabs/ProfileTab.vue'
import LookTab from '@/editor/tabs/LookTab.vue'
import HelpTab from '@/editor/tabs/HelpTab.vue'
import VisitsTab from '@/editor/tabs/VisitsTab.vue'

// The editing side: the tabs and the active tab's forms. The page picked in
// the Pages tab is the one the preview shows.
const previewPageId = defineModel<string>('previewPageId', { required: true })
defineProps<{ site: string }>()

const TABS = [
  { key: 'pages', label: 'Pages' },
  { key: 'works', label: 'Work' },
  { key: 'news', label: 'News' },
  { key: 'profile', label: 'About you' },
  { key: 'look', label: 'Look' },
  { key: 'visits', label: 'Visits' },
  { key: 'help', label: 'Help' },
] as const
const activeTab = ref<(typeof TABS)[number]['key']>('pages')

// A block clicked in the preview is edited in the Pages tab, which holds
// every page, works' own pages included.
watch(useBlockSelection(), (picked) => {
  if (picked?.source === 'preview') activeTab.value = 'pages'
})

// "Open" in the Work tab: that work and its page, in the Pages tab.
function openWork(workId: string) {
  previewPageId.value = workId
  activeTab.value = 'pages'
}
</script>

<template>
  <section aria-label="Edit" class="p-4">
    <div role="tablist" class="mb-6 flex flex-wrap gap-2">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        role="tab"
        type="button"
        :aria-selected="activeTab === tab.key"
        class="rounded-md border-2 border-panel-line bg-panel px-4 py-2 text-lg font-semibold aria-selected:border-action aria-selected:bg-action aria-selected:text-panel"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <PagesTab v-if="activeTab === 'pages'" v-model:page-id="previewPageId" />
    <WorksTab v-else-if="activeTab === 'works'" @open-work="openWork" />
    <NewsTab v-else-if="activeTab === 'news'" />
    <ProfileTab v-else-if="activeTab === 'profile'" :site="site" />
    <LookTab v-else-if="activeTab === 'look'" />
    <VisitsTab v-else-if="activeTab === 'visits'" />
    <HelpTab v-else />
  </section>
</template>
