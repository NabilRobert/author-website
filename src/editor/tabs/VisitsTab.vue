<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchVisits } from '@/editor/editorApi'
import type { VisitStats } from '@/editor/editorApi'
import { useDraft } from '@/editor/useEditor'

// How many people looked at the site in the last 30 days (server/visits.ts):
// two totals, a bar per day with its number on hover, the numbers as a
// table, and the most-visited pages. Views by the owner aren't counted.
const draft = useDraft()
const stats = ref<VisitStats | null>(null)
const status = ref<'loading' | 'ready' | 'failed'>('loading')

onMounted(async () => {
  stats.value = await fetchVisits()
  status.value = stats.value ? 'ready' : 'failed'
})

const days = computed(() => stats.value?.days ?? [])
const total = (count: number) => days.value.slice(-count).reduce((sum, day) => sum + day.count, 0)
// The tallest bar fills the chart; at least 1, so a quiet month draws no bars.
const peak = computed(() => Math.max(1, ...days.value.map((day) => day.count)))

const formatDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const views = (count: number) => `${count} ${count === 1 ? 'view' : 'views'}`

// "/about" → "About", "/work/lantern" → "Lantern", from the draft's names.
function pageName(path: string): string {
  const [first = '', second] = path.split('/').filter(Boolean)
  if (first === 'work' && second) return draft.value.works.find((work) => work.pageSlug === second)?.title ?? path
  return draft.value.pages.find((page) => page.slug === first)?.title ?? path
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-semibold">Visits</h2>
      <p class="text-sm text-panel-muted">
        Views of your pages in the last 30 days, without cookies and without anything about who visited. Your own views
        aren't counted.
      </p>
    </div>
    <p v-if="status === 'loading'">Loading…</p>
    <p v-else-if="status === 'failed'" role="alert" class="text-danger">
      The visit counts couldn't be loaded. Check your connection and open this tab again.
    </p>
    <template v-else>
      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-md border border-panel-line bg-panel p-4">
          <p class="text-sm text-panel-muted">Last 7 days</p>
          <p class="text-3xl font-semibold" data-total="7">{{ total(7) }}</p>
        </div>
        <div class="rounded-md border border-panel-line bg-panel p-4">
          <p class="text-sm text-panel-muted">Last 30 days</p>
          <p class="text-3xl font-semibold" data-total="30">{{ total(30) }}</p>
        </div>
      </div>

      <figure class="rounded-md border border-panel-line bg-panel p-4">
        <figcaption class="mb-3 font-semibold">Views per day</figcaption>
        <div class="flex h-40 items-end gap-0.5 border-b border-panel-line" aria-hidden="true">
          <div v-for="day in days" :key="day.day" class="group relative flex h-full flex-1 items-end">
            <div
              v-if="day.count"
              class="h-(--bar-height) w-full rounded-t-[4px] bg-action"
              :style="{ '--bar-height': `${(day.count / peak) * 100}%` }"
            />
            <span
              class="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 rounded-md bg-panel-text px-2 py-1 text-xs whitespace-nowrap text-panel group-hover:block"
            >
              {{ formatDay(day.day) }}: {{ views(day.count) }}
            </span>
          </div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-panel-muted" aria-hidden="true">
          <span>{{ days[0] ? formatDay(days[0].day) : '' }}</span>
          <span>Today</span>
        </div>
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer">Show the numbers</summary>
          <table class="mt-2 w-full">
            <thead>
              <tr class="text-left text-panel-muted">
                <th class="font-normal">Day</th>
                <th class="text-right font-normal">Views</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in days" :key="day.day">
                <td>{{ formatDay(day.day) }}</td>
                <td class="text-right tabular-nums">{{ day.count }}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </figure>

      <section class="rounded-md border border-panel-line bg-panel p-4">
        <h3 class="mb-3 font-semibold">Most visited pages</h3>
        <p v-if="!stats?.pages.length" class="text-sm text-panel-muted">No visits yet. Share your page's link!</p>
        <ol v-else class="space-y-1">
          <li v-for="page in stats.pages" :key="page.path" class="flex justify-between gap-4" data-page-visits>
            <span class="min-w-0 truncate">
              {{ pageName(page.path) }} <span class="text-panel-muted">{{ page.path }}</span>
            </span>
            <span class="tabular-nums">{{ page.count }}</span>
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>
