// @vitest-environment node
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DiskBucket } from '../../server/node/disk-bucket'

let parent: string
let root: string
let bucket: DiskBucket
beforeEach(() => {
  parent = mkdtempSync(join(tmpdir(), 'framed-bucket-'))
  root = join(parent, 'files')
  bucket = new DiskBucket(root)
})
afterEach(() => rmSync(parent, { recursive: true, force: true }))

const textOf = async (key: string) => {
  const stored = await bucket.get(key)
  return stored ? new Response(stored.body).text() : null
}

/** A stream that sends some bytes, then fails, like an upload cut off half-way. */
function streamThatBreaks(): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('half a pic'))
      controller.error(new Error('connection lost'))
    },
  })
}

describe('files on disk (the Node version of the R2 bucket)', () => {
  it('stores a file and streams it back with the type its name says', async () => {
    await bucket.put('images/abc-123.png', new TextEncoder().encode('png bytes'))
    const stored = await bucket.get('images/abc-123.png')
    expect(stored?.httpMetadata.contentType).toBe('image/png')
    expect(await textOf('images/abc-123.png')).toBe('png bytes')
  })

  it('answers null for a file that is not there', async () => {
    expect(await bucket.get('files/missing.pdf')).toBeNull()
  })

  it('refuses keys that would reach outside its folder', async () => {
    const escapes = ['../outside.png', 'images/../../outside.png', '/etc/outside.png', 'images/a/b.png', 'other/x.png']
    for (const key of escapes) {
      await expect(bucket.put(key, 'x')).rejects.toThrow('Refusing the storage key')
      expect(await bucket.get(key)).toBeNull()
      await expect(bucket.delete([key])).rejects.toThrow('Refusing the storage key')
    }
    expect(readdirSync(parent)).toEqual([])
  })

  it('leaves nothing behind when a write fails half-way, and keeps the earlier file whole', async () => {
    await bucket.put('files/report.pdf', 'the whole earlier file')
    await expect(bucket.put('files/report.pdf', streamThatBreaks())).rejects.toThrow('connection lost')
    await expect(bucket.put('files/new.pdf', streamThatBreaks())).rejects.toThrow('connection lost')
    expect(await textOf('files/report.pdf')).toBe('the whole earlier file')
    expect(existsSync(join(root, 'files/new.pdf'))).toBe(false)
    expect(readdirSync(join(root, '.tmp'))).toEqual([])
  })

  it('deletes files, skipping ones already gone', async () => {
    await bucket.put('images/one.jpg', 'a')
    await bucket.put('files/two.pdf', 'b')
    await bucket.delete(['images/one.jpg', 'files/two.pdf', 'images/never-there.png'])
    expect(await bucket.get('images/one.jpg')).toBeNull()
    expect(await bucket.get('files/two.pdf')).toBeNull()
  })
})
