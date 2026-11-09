import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEditor } from '@/editor/useEditor'
import { demoContent } from '@shared/demo-content'

function answerWith(...responses: (Response | Error)[]) {
  const fetchStub = vi.fn(async () => {
    const next = responses.shift()
    if (!next || next instanceof Error) throw next ?? new Error('no more responses')
    return next
  })
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

const savedContent = { ...demoContent, updatedAt: '2026-11-09T10:00:00.000Z' }

async function loadedEditor() {
  answerWith(Response.json(savedContent))
  const editor = createEditor()
  await editor.load()
  return editor
}

afterEach(() => vi.unstubAllGlobals())

describe('loading the editor', () => {
  it('starts from the example content, unsaved, when the site is new', async () => {
    answerWith(Response.json({ error: 'empty' }, { status: 404 }))
    const editor = createEditor()
    await editor.load()
    expect(editor.status.value).toBe('ready')
    expect(editor.isStarter.value).toBe(true)
    expect(editor.isDirty.value).toBe(true)
  })

  it('asks the owner to sign in again when the sign-in has expired', async () => {
    answerWith(Response.json({ error: 'x' }, { status: 401 }))
    const editor = createEditor()
    await editor.load()
    expect(editor.status.value).toBe('signed-out')
  })

  it('shows the server message when editing is not set up', async () => {
    answerWith(Response.json({ error: 'Editing is not set up yet.' }, { status: 503 }))
    const editor = createEditor()
    await editor.load()
    expect(editor.status.value).toBe('failed')
    expect(editor.loadError.value).toBe('Editing is not set up yet.')
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
    const fetchStub = answerWith()
    editor.draft.value.books[0]!.buyLinks[0]!.url = 'amazon.com/book'
    await editor.save()
    expect(fetchStub).not.toHaveBeenCalled()
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
    answerWith(Response.json(newer))
    await editor.save()
    expect(editor.lastSave.value?.isSaved).toBe(true)
    expect(editor.draft.value.updatedAt).toBe('later')
    expect(editor.isDirty.value).toBe(false)
  })

  it('explains a save refused because the site changed in another tab', async () => {
    const editor = await loadedEditor()
    editor.draft.value.author.name = 'New Name'
    answerWith(Response.json({ error: 'The site was changed in another tab.' }, { status: 409 }))
    await editor.save()
    expect(editor.lastSave.value).toMatchObject({ isSaved: false, text: 'The site was changed in another tab.' })
    expect(editor.isDirty.value).toBe(true)
  })

  it('keeps the changes and says so when the connection drops', async () => {
    const editor = await loadedEditor()
    editor.draft.value.author.name = 'New Name'
    answerWith(new TypeError('Failed to fetch'))
    await editor.save()
    expect(editor.lastSave.value?.text).toContain('Your changes are still here.')
    expect(editor.draft.value.author.name).toBe('New Name')
  })
})
