// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadContent } from '../../server/content-read'
import { saveContent, StaleSaveError } from '../../server/content-write'
import { findSiteByName } from '../../server/sites'
import { demoContent } from '../../shared/demo-content'
import type { SiteContent } from '../../shared/schema'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

const SAVED_AT = new Date('2026-11-09T10:00:00Z')

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
})
afterEach(async () => {
  await api.dispose()
})

async function siteId(name: string): Promise<string> {
  const site = await findSiteByName(api.db, name)
  if (!site) throw new Error(`no site ${name}`)
  return site.id
}

function putContent(content: SiteContent, cookie: string) {
  const init = { method: 'PUT', body: JSON.stringify(content), headers: { 'Content-Type': 'application/json' } }
  return api.request('/api/me/content', init, cookie)
}

describe('content store', () => {
  it('reads back exactly what was saved, in the same order', async () => {
    await api.signUp('mara@example.com', 'mara')
    const id = await siteId('mara')
    const saved = await saveContent(api.db, id, demoContent, SAVED_AT)
    expect(await loadContent(api.db, id)).toEqual(saved)
  })

  it("keeps a block's box style and the content-box settings", async () => {
    await api.signUp('alex@example.com', 'alex')
    const id = await siteId('alex')
    const [home, ...rest] = demoContent.pages
    const style = {
      ...home!.blocks[0]!.style,
      background: '#123456',
      opacity: 40,
      corners: 'sharp' as const,
      pattern: 'argyle' as const,
    }
    const pages = [{ ...home!, blocks: [{ ...home!.blocks[0]!, style }, ...home!.blocks.slice(1)] }, ...rest]
    const panel = { colour: '#ffffff', opacity: 70, corners: 'sharp' as const, width: 'full' as const }
    await saveContent(api.db, id, { ...demoContent, pages, theme: { ...demoContent.theme, panel } }, SAVED_AT)
    const stored = await loadContent(api.db, id)
    expect(stored?.pages[0]?.blocks[0]?.style).toEqual(style)
    expect(stored?.theme.panel).toEqual(panel)
  })

  it('keeps two sites apart, even with the same ids inside', async () => {
    await api.signUp('a@example.com', 'site-a')
    await api.signUp('b@example.com', 'site-b')
    await saveContent(api.db, await siteId('site-a'), demoContent, SAVED_AT)
    const renamed = { ...demoContent, profile: { ...demoContent.profile, name: 'Someone Else' } }
    await saveContent(api.db, await siteId('site-b'), renamed, SAVED_AT)
    expect((await loadContent(api.db, await siteId('site-a')))?.profile.name).toBe(demoContent.profile.name)
    expect((await loadContent(api.db, await siteId('site-b')))?.profile.name).toBe('Someone Else')
  })

  it('refuses a save made from an older copy', async () => {
    await api.signUp('mara@example.com', 'mara')
    const id = await siteId('mara')
    await saveContent(api.db, id, demoContent, SAVED_AT)
    await expect(saveContent(api.db, id, demoContent, new Date())).rejects.toBeInstanceOf(StaleSaveError)
  })

  it('leaves the old content when a save fails part-way', async () => {
    await api.signUp('mara@example.com', 'mara')
    const id = await siteId('mara')
    const first = await saveContent(api.db, id, demoContent, SAVED_AT)
    const broken = { ...first, works: [first.works[0]!, first.works[0]!] }
    await expect(saveContent(api.db, id, broken, new Date())).rejects.toThrow()
    expect(await loadContent(api.db, id)).toEqual(first)
  })

  it('still loads a block saved before a newer field existed', async () => {
    await api.signUp('mara@example.com', 'mara')
    const id = await siteId('mara')
    await saveContent(api.db, id, demoContent, SAVED_AT)
    await api.db
      .prepare(
        "UPDATE blocks SET fields_json = json_remove(fields_json, '$.imageDescription') WHERE type = 'imageText'",
      )
      .run()
    const about = (await loadContent(api.db, id))?.pages.find((page) => page.slug === 'about')
    expect(about?.blocks[0]).toMatchObject({ type: 'imageText', imageDescription: '' })
  })
})

describe('GET /api/sites/<name>/content', () => {
  it("returns someone's site with a one-minute public cache", async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    await putContent(demoContent, cookie)
    const response = await api.request('/api/sites/mara/content')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
  })

  it('says there is no such page for an unknown name', async () => {
    const response = await api.request('/api/sites/nobody/content')
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ reason: 'no-site' })
  })

  it('says a claimed but unsaved site is being set up', async () => {
    await api.signUp('mara@example.com', 'mara')
    expect(await (await api.request('/api/sites/mara/content')).json()).toMatchObject({ reason: 'not-set-up' })
  })

  it('hides a site taken down by Arthur', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    await putContent(demoContent, cookie)
    await api.db.prepare("UPDATE sites SET is_hidden = 1 WHERE name = 'mara'").run()
    expect((await api.request('/api/sites/mara/content')).status).toBe(404)
  })

  it('answers a stored row that breaks the schema with a plain 500, not the details', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    await putContent(demoContent, cookie)
    await api.db.prepare("UPDATE works SET image_key = '../../etc/passwd'").run()
    const response = await api.request('/api/sites/mara/content')
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('passwd')
  })
})

describe('/api/me/content', () => {
  it('saves my site and reads it back, never cached', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    const saved = (await (await putContent(demoContent, cookie)).json()) as SiteContent
    const response = await api.request('/api/me/content', {}, cookie)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual(saved)
  })

  it("only ever writes the logged-in person's own site", async () => {
    const maraCookie = await api.signUp('mara@example.com', 'mara')
    await putContent(demoContent, maraCookie)
    const otherCookie = await api.signUp('other@example.com', 'other')
    const takeover = { ...demoContent, profile: { ...demoContent.profile, name: 'Hacked' } }
    await putContent(takeover, otherCookie)
    const mara = (await (await api.request('/api/sites/mara/content')).json()) as SiteContent
    expect(mara.profile.name).toBe(demoContent.profile.name)
  })

  it('lists the fields to fix when the content is invalid', async () => {
    const cookie = await api.signUp('mara@example.com', 'mara')
    const profile = { ...demoContent.profile, contactEmail: 'not an email' }
    const response = await putContent({ ...demoContent, profile }, cookie)
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({
      issues: [{ path: ['profile', 'contactEmail'], message: 'Enter an email address like name@example.com.' }],
    })
  })

  it('refuses a save without a login', async () => {
    expect((await putContent(demoContent, '')).status).toBe(401)
  })

  it('asks a logged-in person without a site to pick a name first', async () => {
    const cookie = await api.logIn('mara@example.com')
    expect((await api.request('/api/me/content', {}, cookie)).status).toBe(404)
  })
})

describe('reporting a page', () => {
  it('records the report for Arthur', async () => {
    await api.signUp('mara@example.com', 'mara')
    const response = await api.postJson('/api/sites/mara/report', { reason: 'This page copies my work.' })
    expect(response.status).toBe(201)
    const row = await api.db.prepare('SELECT reason FROM reports').first<{ reason: string }>()
    expect(row?.reason).toBe('This page copies my work.')
  })

  it('asks for a reason', async () => {
    await api.signUp('mara@example.com', 'mara')
    expect((await api.postJson('/api/sites/mara/report', { reason: '' })).status).toBe(400)
  })
})
