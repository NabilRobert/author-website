import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEditor } from '@/editor/useEditor'
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
    editor.draft.value.author.name = 'Someone Else'
    expect(editor.isDirty.value).toBe(true)
  })
})

describe('saving', () => {
  it('lists each field to fix, with where it is, and sends nothing', async () => {
    const editor = await loadedEditor()
    editor.draft.value.books[0]!.buyLinks[0]!.url = 'amazon.com/book'
    await editor.save()
    expect(editor.lastSave.value).toMatchObject({
      isSaved: false,
      problems: [
        {
          location: 'Books › The Lantern Year › Where to buy › no. 1 › Web address',
          message: 'Enter a full web address starting with https://',
        },
      ],
    })
  })

  it('keeps the saved version and clears the unsaved flag', async () => {
    const editor = await loadedEditor()
    editor.draft.value.author.name = 'New Name'
    const newer = { ...savedContent, author: { ...savedContent.author, name: 'New Name' }, updatedAt: 'later' }
    api({ 'PUT /api/me/content': json(newer) })
    await editor.save()
    expect(editor.lastSave.value?.isSaved).toBe(true)
    expect(editor.draft.value.updatedAt).toBe('later')
    expect(editor.isDirty.value).toBe(false)
  })

  it('explains a save refused because the site changed in another tab', async () => {
    const editor = await loadedEditor()
    editor.draft.value.author.name = 'New Name'
    api({ 'PUT /api/me/content': json({ error: 'The site was changed in another tab.' }, 409) })
    await editor.save()
    expect(editor.lastSave.value).toMatchObject({ isSaved: false, text: 'The site was changed in another tab.' })
  })

  it('keeps the changes and says so when the connection drops', async () => {
    const editor = await loadedEditor()
    editor.draft.value.author.name = 'New Name'
    api({ 'PUT /api/me/content': offline })
    await editor.save()
    expect(editor.lastSave.value?.text).toContain('Your changes are still here.')
    expect(editor.draft.value.author.name).toBe('New Name')
  })
})
