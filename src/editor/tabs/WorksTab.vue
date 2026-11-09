<script setup lang="ts">
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useDraft } from '@/editor/useEditor'
import { moveItem, newWork } from '@/editor/newItems'
import ItemControls from '@/editor/fields/ItemControls.vue'
import WorkForm from '@/editor/tabs/WorkForm.vue'

// The works, kept once and shown by any "Your works" block and the press
// kit, in the order arranged here: drag a work by its handle, or use Up and
// Down. Each opens to its form.
const draft = useDraft()
const emit = defineEmits<{ editPage: [workId: string] }>()

// Which works are open, so a newly added one opens at once.
const openWorkIds = ref(new Set<string>())
function noteToggle(workId: string, event: Event) {
  if ((event.target as HTMLDetailsElement).open) openWorkIds.value.add(workId)
  else openWorkIds.value.delete(workId)
}

function addWork() {
  const work = newWork()
  draft.value.works.unshift(work)
  openWorkIds.value.add(work.id)
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-panel-muted">
      Your projects, books, pieces or buildings. The site shows them in this order: drag one by its handle (⠿) or use Up
      and Down. Ones with the same group placed next to each other share a heading. Open one to change it.
    </p>
    <button type="button" class="rounded-md bg-action px-5 py-3 font-semibold text-panel" @click="addWork">
      + Add work
    </button>
    <VueDraggable v-model="draft.works" handle=".drag-handle" :animation="150" class="space-y-4">
      <details
        v-for="(work, index) in draft.works"
        :key="work.id"
        class="rounded-md border border-panel-line bg-panel p-4"
        :open="openWorkIds.has(work.id)"
        @toggle="noteToggle(work.id, $event)"
      >
        <summary class="flex cursor-pointer items-center gap-3 text-lg font-semibold">
          <span class="drag-handle cursor-grab px-1 text-panel-muted" title="Drag to reorder" aria-hidden="true"
            >⠿</span
          >
          {{ work.title || 'Untitled' }}
        </summary>
        <div class="mt-4 space-y-4">
          <WorkForm v-model="draft.works[index]!" @edit-page="emit('editPage', work.id)" />
          <ItemControls
            :item-name="`“${work.title}”`"
            :is-first="index === 0"
            :is-last="index === draft.works.length - 1"
            @move="(offset) => moveItem(draft.works, index, offset)"
            @remove="draft.works.splice(index, 1)"
          />
        </div>
      </details>
    </VueDraggable>
  </div>
</template>
