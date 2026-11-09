/**
 * The editor's state: the draft the owner is changing, whether it differs
 * from what is saved, and loading and saving it (src/editor/editorApi.ts).
 * EditView creates it once and shares the draft with the tabs through
 * provide/inject (useDraft).
 */
import { computed, inject, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import { siteContentSchema } from '@shared/schema'
import type { SiteContent } from '@shared/schema'
import { demoContent } from '@shared/demo-content'
import { fetchDraft, problemsResult, sendDraft } from '@/editor/editorApi'
import type { SaveResult } from '@/editor/editorApi'

export type EditorStatus = 'loading' | 'ready' | 'signed-out' | 'failed'

export const DRAFT_KEY: InjectionKey<Ref<SiteContent>> = Symbol('draft')

/** The draft, for the editor's tabs and forms. */
export function useDraft(): Ref<SiteContent> {
  const draft = inject(DRAFT_KEY)
  if (!draft) throw new Error('useDraft() is only for components inside the editor.')
  return draft
}

export function createEditor() {
  const draft = ref<SiteContent>(structuredClone(demoContent))
  const savedCopy = ref('')
  const status = ref<EditorStatus>('loading')
  const loadError = ref('')
  // True while showing the example content of a site never saved before.
  const isStarter = ref(false)
  const isSaving = ref(false)
  const lastSave = ref<SaveResult | null>(null)
  const isDirty = computed(() => JSON.stringify(draft.value) !== savedCopy.value)

  function keepAsSaved(content: SiteContent) {
    draft.value = content
    savedCopy.value = JSON.stringify(content)
  }

  async function load(): Promise<void> {
    const result = await fetchDraft()
    if (result.kind === 'loaded') keepAsSaved(result.content)
    if (result.kind === 'empty') isStarter.value = true
    if (result.kind === 'failed') loadError.value = result.message
    status.value = result.kind === 'loaded' || result.kind === 'empty' ? 'ready' : result.kind
  }

  async function save(): Promise<void> {
    const checked = siteContentSchema.safeParse(draft.value)
    if (!checked.success) {
      lastSave.value = problemsResult('Some fields need fixing first:', checked.error.issues, draft.value)
      return
    }
    isSaving.value = true
    lastSave.value = await sendDraft(checked.data)
    isSaving.value = false
    if (lastSave.value.isSaved) {
      keepAsSaved(lastSave.value.content)
      isStarter.value = false
    }
  }

  return { draft, status, loadError, isStarter, isSaving, isDirty, lastSave, load, save }
}

export type Editor = ReturnType<typeof createEditor>
