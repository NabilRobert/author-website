import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createEditor } from '@/editor/useEditor'
import { uploadImage } from '@/editor/editorApi'
import { demoContent } from '@shared/demo-content'

const saved = { ...demoContent, updatedAt: '2026-11-09T10:00:00.000Z' }

function answerWith(...responses: Response[]) {
  const fetchStub = vi.fn(async () => responses.shift() ?? Response.json({}, { status: 500 }))
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

async function openEditor(content = saved) {
  answerWith(Response.json(content))
  const editor = createEditor()
  await editor.load()
  return editor
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('requests from the editor', () => {
  it('mark themselves as coming from the page, so Access answers 401 instead of redirecting', async () => {
    const fetchStub = answerWith(Response.json(saved), Response.json(saved), Response.json({ key: 'images/a.png' }))
    const editor = createEditor()
    await editor.load()
    editor.draft.value.author.name = 'Changed'
    await editor.save()
    await uploadImage(new File(['x'], 'a.png', { type: 'image/png' }))
    for (const call of fetchStub.mock.calls as unknown as [string, RequestInit][]) {
      expect(call[1].headers).toMatchObject({ 'X-Requested-With': 'XMLHttpRequest' })
    }
    expect(fetchStub).toHaveBeenCalledTimes(3)
  })
})

describe('an expired sign-in while editing', () => {
  it('says so, and that the changes are kept', async () => {
    const editor = await openEditor()
    editor.draft.value.author.name = 'Changed'
    answerWith(Response.json({ error: 'expired' }, { status: 401 }))
    await editor.save()
    expect(editor.lastSave.value?.text).toContain('Your sign-in has expired.')
    expect(editor.lastSave.value?.text).toContain('kept on this computer')
  })

  it('brings the unsaved changes back on the next visit', async () => {
    const first = await openEditor()
    first.draft.value.author.name = 'Typed before the sign-in expired'
    await nextTick()
    const second = await openEditor()
    expect(second.draft.value.author.name).toBe('Typed before the sign-in expired')
    expect(second.isRestored.value).toBe(true)
    expect(second.isDirty.value).toBe(true)
  })

  it('does not bring back changes made from an older version of the site', async () => {
    const first = await openEditor()
    first.draft.value.author.name = 'Old change'
    await nextTick()
    const second = await openEditor({ ...saved, updatedAt: '2026-11-10T09:00:00.000Z' })
    expect(second.draft.value.author.name).toBe(saved.author.name)
    expect(second.isRestored.value).toBe(false)
  })

  it('forgets the backup once everything is saved', async () => {
    const first = await openEditor()
    first.draft.value.author.name = 'Changed'
    await nextTick()
    answerWith(Response.json({ ...saved, author: { ...saved.author, name: 'Changed' }, updatedAt: 'later' }))
    await first.save()
    await nextTick()
    const second = await openEditor({ ...saved, author: { ...saved.author, name: 'Changed' }, updatedAt: 'later' })
    expect(second.isRestored.value).toBe(false)
  })
})
