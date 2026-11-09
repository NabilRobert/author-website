/**
 * The editor's state: the draft the owner is changing, whether it differs
 * from what is saved, and loading and saving it (src/editor/editorApi.ts).
 * EditView creates it once and shares the draft with the tabs through
 * provide/inject (useDraft).
 */
import { computed, inject, ref, watch } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { SiteContent } from '@shared/schema'
import { demoContent } from '@shared/demo-content'
import { fetchDraft, saveDraft } from '@/editor/editorApi'
import type { SaveResult } from '@/editor/editorApi'
import { clearBackup, keepBackup, takeBackup } from '@/editor/draftBackup'

export type EditorStatus = 'loading' | 'ready' | 'signed-out' | 'not-yours' | 'failed'

export const DRAFT_KEY: InjectionKey<Ref<SiteContent>> = Symbol('draft')

/** The draft, for the editor's tabs and forms. */
export function useDraft(): Ref<SiteContent> {
  const draft = inject(DRAFT_KEY)
  if (!draft) throw new Error('useDraft() is only for components inside the editor.')
  return draft
}

/** The editor for framed.my.id/<site>, which must belong to whoever is logged in. */
export function createEditor(site: string) {
  const draft = ref<SiteContent>(structuredClone(demoContent))
  const savedCopy = ref('')
  const status = ref<EditorStatus>('loading')
  const loadError = ref('')
  // When the page belongs to someone else: the logged-in person's own page.
  const ownName = ref<string | null>(null)
  // True while showing the example content of a site never saved before.
  const isStarter = ref(false)
  const isSaving = ref(false)
  const lastSave = ref<SaveResult | null>(null)
  const isDirty = computed(() => JSON.stringify(draft.value) !== savedCopy.value)
  const backup = useDraftBackup(site, draft, isDirty, status)

  function keepAsSaved(content: SiteContent) {
    draft.value = content
    savedCopy.value = JSON.stringify(content)
  }

  async function load(): Promise<void> {
    const result = await fetchDraft(site)
    if (result.kind === 'loaded') keepAsSaved(result.content)
    if (result.kind === 'not-yours') ownName.value = result.ownName
    if (result.kind === 'empty') isStarter.value = true
    if (result.kind === 'failed') loadError.value = result.message
    const isReady = result.kind === 'loaded' || result.kind === 'empty'
    if (isReady) backup.restore(result.kind === 'loaded' ? result.content : null)
    status.value = isReady ? 'ready' : result.kind
  }

  async function save(): Promise<void> {
    isSaving.value = true
    lastSave.value = await saveDraft(draft.value)
    isSaving.value = false
    if (lastSave.value.isSaved) {
      keepAsSaved(lastSave.value.content)
      isStarter.value = false
    }
  }

  const { isRestored } = backup
  return { site, draft, status, loadError, ownName, isStarter, isRestored, isSaving, isDirty, lastSave, load, save }
}

/**
 * Keeps every unsaved change backed up in the browser and drops the backup
 * once all is saved (src/editor/draftBackup.ts). `restore` brings back a
 * backup from an earlier visit, if it was made from the same saved version.
 */
function useDraftBackup(site: string, draft: Ref<SiteContent>, isDirty: Ref<boolean>, status: Ref<EditorStatus>) {
  const isRestored = ref(false)

  function restore(saved: SiteContent | null) {
    const backup = takeBackup(site, saved)
    if (backup) draft.value = backup
    isRestored.value = backup !== null
  }

  watch(
    draft,
    () => {
      if (status.value !== 'ready') return
      if (isDirty.value) keepBackup(site, draft.value)
      else clearBackup(site)
    },
    { deep: true },
  )
  return { isRestored, restore }
}

export type Editor = ReturnType<typeof createEditor>
