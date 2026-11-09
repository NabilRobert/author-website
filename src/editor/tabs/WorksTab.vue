<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { useDraft } from '@/editor/useEditor'
import { moveItem, newWork } from '@/editor/newItems'
import ItemControls from '@/editor/fields/ItemControls.vue'

// Your works in order: the order every list and the press kit use. Drag a
// work by its handle or use Up and Down. "Open" edits a work and its page
// in the Pages tab (WorkEditor).
const draft = useDraft()
const emit = defineEmits<{ openWork: [workId: string] }>()

function addWork() {
  const work = newWork(
    'New work',
    draft.value.works.map((existing) => existing.pageSlug),
  )
  draft.value.works.unshift(work)
  emit('openWork', work.id)
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-panel-muted">
      Your projects, books, pieces or buildings, each with its own page. The site shows them in this order: drag one by
      its handle (⠿) or use Up and Down. Ones with the same group placed next to each other share a heading.
    </p>
    <button type="button" class="rounded-md bg-action px-5 py-3 font-semibold text-panel" @click="addWork">
      + Add work
    </button>
    <VueDraggable v-model="draft.works" handle=".drag-handle" :animation="150" class="space-y-3">
      <div
        v-for="(work, index) in draft.works"
        :key="work.id"
        class="flex flex-wrap items-center gap-3 rounded-md border border-panel-line bg-panel p-3"
      >
        <span class="drag-handle cursor-grab px-1 text-panel-muted" title="Drag to reorder" aria-hidden="true">⠿</span>
        <span class="min-w-0 grow">
          <span class="block font-semibold" data-work-title>{{ work.title || 'Untitled' }}</span>
          <span class="block text-sm text-panel-muted">
            {{ work.group ? `${work.group} · ` : '' }}{{ work.showPage ? `/work/${work.pageSlug}` : 'No page' }}
          </span>
        </span>
        <button
          type="button"
          class="rounded-md border-2 border-action px-4 py-2 font-semibold text-action"
          @click="emit('openWork', work.id)"
        >
          Open
        </button>
        <ItemControls
          :item-name="`“${work.title}”`"
          :is-first="index === 0"
          :is-last="index === draft.works.length - 1"
          @move="(offset) => moveItem(draft.works, index, offset)"
          @remove="draft.works.splice(index, 1)"
        />
      </div>
    </VueDraggable>
  </div>
</template>
