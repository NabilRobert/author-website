/**
 * Undo and Redo for the editor's draft.
 *
 * A pause in editing (UNDO_PAUSE_MS) closes one step, so Undo takes back a
 * typed word or a colour drag rather than one letter or pixel. Steps are
 * kept as JSON copies of the whole draft, which is small.
 *
 * The history starts again when the draft is loaded or saved (`startFrom`):
 * undoing past a save would bring back the old `updatedAt`, and the next
 * save would then be refused as coming from an older copy.
 *
 * VueUse's useRefHistory was the first choice, but its debounced commit
 * lands after a reset, so loading and saving became undo steps. Comparing
 * each step with the current copy (below) makes late commits harmless.
 */
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { SiteContent } from '@shared/schema'

export const UNDO_PAUSE_MS = 400
const MAX_UNDO_STEPS = 100

export function useUndoHistory(draft: Ref<SiteContent>) {
  const past = ref<string[]>([])
  const future = ref<string[]>([])
  const current = ref(JSON.stringify(draft.value))

  // Records the draft as a new step, unless nothing changed since the last.
  function recordStep() {
    const now = JSON.stringify(draft.value)
    if (now === current.value) return
    past.value.push(current.value)
    if (past.value.length > MAX_UNDO_STEPS) past.value.shift()
    future.value = []
    current.value = now
  }

  function moveTo(from: Ref<string[]>, to: Ref<string[]>) {
    recordStep() // an edit still inside its pause is a step too
    const target = from.value.pop()
    if (target === undefined) return
    to.value.push(current.value)
    current.value = target
    draft.value = JSON.parse(target) as SiteContent
  }

  function startFrom(content: SiteContent) {
    current.value = JSON.stringify(content)
    past.value = []
    future.value = []
  }

  watchDebounced(draft, recordStep, { deep: true, debounce: UNDO_PAUSE_MS })

  return {
    // An edit still inside its pause can be undone too.
    canUndo: computed(() => past.value.length > 0 || JSON.stringify(draft.value) !== current.value),
    canRedo: computed(() => future.value.length > 0),
    undo: () => moveTo(past, future),
    redo: () => moveTo(future, past),
    startFrom,
  }
}
