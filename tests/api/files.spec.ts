// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_FILE_BYTES } from '../../shared/files'
import { usedImageKeys } from '../../server/image-limits'
import { blockSchema } from '../../shared/blocks'
import { plainBox } from '../../shared/theme'
import { demoContent } from '../../shared/demo-content'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

// "%PDF-1.7", the start of a real PDF, padded out.
const PDF_START = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]

let api: TestApp
let cookie: string

beforeEach(async () => {
  api = await createTestApp()
  cookie = await api.signUp('mara@example.com', 'mara')
})
afterEach(async () => {
  await api.dispose()
})

function pdfOf(size = 1024, start = PDF_START, type = 'application/pdf') {
  const bytes = new Uint8Array(size)
  bytes.set(start)
  return new File([bytes], 'cv.pdf', { type })
}

function upload(file: File) {
  const form = new FormData()
  form.set('file', file)
  return api.request('/api/me/files', { method: 'POST', body: form }, cookie)
}

describe('POST /api/me/files', () => {
  it('stores a PDF under a fresh key', async () => {
    const response = await upload(pdfOf())
    expect(response.status).toBe(201)
    expect(((await response.json()) as { key: string }).key).toMatch(/^files\/[0-9a-f-]{36}\.pdf$/)
  })

  it('refuses a file that calls itself a PDF but is not one', async () => {
    const response = await upload(pdfOf(1024, [0x3c, 0x68, 0x74, 0x6d, 0x6c]))
    expect(response.status).toBe(415)
    expect(await response.json()).toEqual({ error: 'The file must be a PDF.' })
  })

  it('refuses a PDF over 10 MB', async () => {
    expect((await upload(pdfOf(MAX_FILE_BYTES + 1))).status).toBe(413)
  })

  it('refuses an upload without a login', async () => {
    const form = new FormData()
    form.set('file', pdfOf())
    expect((await api.request('/api/me/files', { method: 'POST', body: form })).status).toBe(401)
  })
})

describe('GET /api/files/<name>', () => {
  it('always downloads, sandboxed, under a safe version of its label', async () => {
    const { key } = (await (await upload(pdfOf())).json()) as { key: string }
    const response = await api.request(`/api/${key}?as=${encodeURIComponent('My CV "2026"/../x')}`)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="My CV 2026x.pdf"')
    expect(response.headers.get('Content-Security-Policy')).toBe('sandbox')
  })

  it('answers 404 for a name that is not a stored file', async () => {
    expect((await api.request('/api/files/..%2Fimages%2Fx.pdf')).status).toBe(404)
    expect((await api.request('/api/files/nothing-here.pdf')).status).toBe(404)
  })
})

describe('which files are in use', () => {
  it("counts a downloads block's files, so tidying up never deletes them", () => {
    const key = 'files/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.pdf'
    const downloads = blockSchema.parse({
      id: demoContent.works[0]!.id,
      style: plainBox(),
      type: 'downloads',
      heading: '',
      files: [{ fileKey: key, label: 'My CV' }],
    })
    const content = { ...demoContent, pages: [{ ...demoContent.pages[0]!, blocks: [downloads] }] }
    expect(usedImageKeys(content).has(key)).toBe(true)
  })
})
