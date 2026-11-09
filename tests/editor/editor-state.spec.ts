import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createEditor } from '@/editor/useEditor'
import { UNDO_PAUSE_MS } from '@/editor/undoHistory'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json, offline } from '../fake-api'
import type { FakeAnswer } from '../fake-api'

const savedContent = { ...demoContent, updatedAt: '2026-11-09T10:00:00.000Z' }
const MARA = { email: 'mara@example.com', site: { name: 'mara' } }

function api(answers: Record<string, FakeAnswer> = {}) {
  return fakeApi({ 'GET /api/me': json(MARA), 'GET /api/me/content': json(savedContent), ...answers })
}

async function loadedEditor() {
  api()
  const editor = createEditor('mara')
  await editor.load()
  return editor
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('opening the editor', () => {
  it('starts from the example content, unsaved, when the site is new', async () => {
    api({ 'GET /api/me/content': json({ error: 'empty' }, 404) })
    const editor = createEditor('mara')
    await editor.load()
    expect(editor.status.value).toBe('ready')
    expect(editor.isStarter.value).toBe(true)
    expect(editor.isDirty.value).toBe(true)
  })

  it('asks to log in when nobody is logged in', async () => {
    api({ 'GET /api/me': json({ error: 'x' }, 401) })
    const editor = createEditor('mara')
    await editor.load()
    expect(editor.status.value).toBe('signed-out')
  })

  it("refuses someone else's page and points to the person's own", async () => {
    api({ 'GET /api/me': json({ email: 'b@example.com', site: { name: 'bob' } }) })
    const editor = createEditor('mara')
    await editor.load()
    expect(editor.status.value).toBe('not-yours')
    expect(editor.ownName.value).toBe('bob')
  })

  it('says so when Framed cannot be reached', async () => {
    api({ 'GET /api/me': offline })
    const editor = createEditor('mara')
    await editor.load()
    expect(editor.status.value).toBe('failed')
    expect(editor.loadError.value).toContain("Couldn't reach the site.")
  })

  it('has nothing unsaved right after loading the saved site', async () => {
    const editor = await loadedEditor()
    expect(editor.isDirty.value).toBe(false)
    editor.draft.value.profile.name = 'Someone Else'
    expect(editor.isDirty.value).toBe(true)
  })
})

describe('saving', () => {
  it('lists each field to fix, with where it is, and sends nothing', async () => {
    const editor = await loadedEditor()
    editor.draft.value.works[0]!.links[0]!.url = 'amazon.com/work'
    await editor.save()
    expect(editor.lastSave.value).toMatchObject({
      isSaved: false,
      problems: [
        {
          location: 'Work › Lantern › Links › no. 1 › Web address',
          message: 'Enter a full web address starting with https://',
        },
      ],
    })
  })

  it('keeps the saved version and clears the unsaved flag', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    const newer = { ...savedContent, profile: { ...savedContent.profile, name: 'New Name' }, updatedAt: 'later' }
    api({ 'PUT /api/me/content': json(newer) })
    await editor.save()
    expect(editor.lastSave.value?.isSaved).toBe(true)
    expect(editor.draft.value.updatedAt).toBe('later')
    expect(editor.isDirty.value).toBe(false)
  })

  it('explains a save refused because the site changed in another tab', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    api({ 'PUT /api/me/content': json({ error: 'The site was changed in another tab.' }, 409) })
    await editor.save()
    expect(editor.lastSave.value).toMatchObject({ isSaved: false, text: 'The site was changed in another tab.' })
  })

  it('keeps the changes and says so when the connection drops', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    api({ 'PUT /api/me/content': offline })
    await editor.save()
    expect(editor.lastSave.value?.text).toContain('Your changes are still here.')
    expect(editor.draft.value.profile.name).toBe('New Name')
  })
})

describe('undo and redo', () => {
  const originalName = savedContent.profile.name
  // Lets the editor close the current step, as a pause in typing does.
  const pause = () => new Promise((resolve) => setTimeout(resolve, UNDO_PAUSE_MS + 50))

  it('takes back a change and puts it back again', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    await nextTick()
    expect(editor.history.canUndo.value).toBe(true)
    editor.history.undo()
    expect(editor.draft.value.profile.name).toBe(originalName)
    expect(editor.history.canRedo.value).toBe(true)
    editor.history.redo()
    expect(editor.draft.value.profile.name).toBe('New Name')
  })

  it('undoes one pause-separated step at a time', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'First'
    await pause()
    editor.draft.value.profile.name = 'Second'
    await pause()
    editor.history.undo()
    expect(editor.draft.value.profile.name).toBe('First')
  })

  it('does not count loading the site as something to undo', async () => {
    const editor = await loadedEditor()
    await pause()
    expect(editor.history.canUndo.value).toBe(false)
  })

  it('starts again after saving, so the saved version is never undone', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    const newer = { ...savedContent, profile: { ...savedContent.profile, name: 'New Name' }, updatedAt: 'later' }
    api({ 'PUT /api/me/content': json(newer) })
    await editor.save()
    await pause()
    expect(editor.history.canUndo.value).toBe(false)
  })

  it('forgets what was undone once something new is changed', async () => {
    const editor = await loadedEditor()
    editor.draft.value.profile.name = 'New Name'
    editor.history.undo()
    editor.draft.value.profile.bioShort = 'Another change'
    await pause()
    expect(editor.history.canRedo.value).toBe(false)
  })
})
