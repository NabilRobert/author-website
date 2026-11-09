import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createEditor } from '@/editor/useEditor'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'

const saved = { ...demoContent, updatedAt: '2026-11-09T10:00:00.000Z' }
const MARA = { email: 'mara@example.com', site: { name: 'mara' } }

async function openEditor(content = saved, site = 'mara') {
  fakeApi({ 'GET /api/me': json({ ...MARA, site: { name: site } }), 'GET /api/me/content': json(content) })
  const editor = createEditor(site)
  await editor.load()
  return editor
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('an expired login while editing', () => {
  it('says so, and that the changes are kept', async () => {
    const editor = await openEditor()
    editor.draft.value.profile.name = 'Changed'
    fakeApi({ 'PUT /api/me/content': json({ error: 'expired' }, 401) })
    await editor.save()
    expect(editor.lastSave.value?.text).toContain('Your login has expired.')
    expect(editor.lastSave.value?.text).toContain('kept on this computer')
  })

  it('brings the unsaved changes back on the next visit', async () => {
    const first = await openEditor()
    first.draft.value.profile.name = 'Typed before the login expired'
    await nextTick()
    const second = await openEditor()
    expect(second.draft.value.profile.name).toBe('Typed before the login expired')
    expect(second.isRestored.value).toBe(true)
    expect(second.isDirty.value).toBe(true)
  })

  it('does not bring back changes made from an older version of the site', async () => {
    const first = await openEditor()
    first.draft.value.profile.name = 'Old change'
    await nextTick()
    const second = await openEditor({ ...saved, updatedAt: '2026-11-10T09:00:00.000Z' })
    expect(second.draft.value.profile.name).toBe(saved.profile.name)
    expect(second.isRestored.value).toBe(false)
  })

  it("keeps each site's unsaved changes apart in one browser", async () => {
    const mara = await openEditor()
    mara.draft.value.profile.name = 'Mara change'
    await nextTick()
    const other = await openEditor(saved, 'other')
    expect(other.isRestored.value).toBe(false)
  })

  it('forgets the backup once everything is saved', async () => {
    const first = await openEditor()
    first.draft.value.profile.name = 'Changed'
    await nextTick()
    const after = { ...saved, profile: { ...saved.profile, name: 'Changed' }, updatedAt: 'later' }
    fakeApi({ 'PUT /api/me/content': json(after) })
    await first.save()
    await nextTick()
    const second = await openEditor(after)
    expect(second.isRestored.value).toBe(false)
  })
})
