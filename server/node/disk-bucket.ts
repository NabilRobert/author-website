/**
 * A folder on disk behind the small part of Cloudflare R2's API that Framed
 * uses: put, get and delete. It lets the Node version (server/node/main.ts)
 * store uploaded pictures and PDFs without a cloud bucket, beside the SQLite
 * file in the same Docker volume, so one backup covers both.
 *
 * Keys look like `images/<random id>.png` or `files/<random id>.pdf`. Each is
 * checked before it becomes a path, so a key can never reach outside the
 * folder. Writes go to a temporary file first and are then renamed into
 * place, so a reader never sees half a file, even after a crash.
 */
import { createReadStream } from 'node:fs'
import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'

export const DEFAULT_FILES_PATH = '/data/files'

// A top folder, then one name with one lowercase extension: no slashes,
// no "..", nothing hidden. The upload routes only ever make such keys.
const SAFE_KEY = /^(images|files)\/[a-z0-9-]+\.[a-z0-9]+$/
// Unfinished writes; on the same disk as the files, so rename is atomic.
const TEMP_FOLDER = '.tmp'
const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

type PutValue = Uint8Array | ArrayBuffer | string | ReadableStream

interface StoredFile {
  body: ReadableStream
  httpMetadata: { contentType: string }
}

export class DiskBucket {
  constructor(private readonly root: string) {}

  async put(key: string, value: PutValue): Promise<void> {
    const finalPath = this.pathOf(key)
    const tempFolder = join(this.root, TEMP_FOLDER)
    await mkdir(tempFolder, { recursive: true })
    await mkdir(dirname(finalPath), { recursive: true })
    const tempPath = join(tempFolder, crypto.randomUUID())
    try {
      await writeFile(tempPath, dataOf(value))
      await rename(tempPath, finalPath)
    } catch (error) {
      await rm(tempPath, { force: true })
      throw error
    }
  }

  /** The stored file, streamed from disk, or null when there is none. */
  async get(key: string): Promise<StoredFile | null> {
    if (!SAFE_KEY.test(key)) return null
    const handle = await open(this.pathOf(key)).catch(nullIfMissing)
    if (!handle) return null
    // Node's web stream type and the Workers one Hono expects differ only on paper.
    const stream = Readable.toWeb(createReadStream('', { fd: handle })) as unknown as ReadableStream
    const extension = key.slice(key.lastIndexOf('.') + 1)
    return { body: stream, httpMetadata: { contentType: CONTENT_TYPES[extension] ?? 'application/octet-stream' } }
  }

  /** Deletes the files; ones already gone are skipped. */
  async delete(keys: string | string[]): Promise<void> {
    const paths = (Array.isArray(keys) ? keys : [keys]).map((key) => this.pathOf(key))
    await Promise.all(paths.map((path) => rm(path, { force: true })))
  }

  private pathOf(key: string): string {
    if (!SAFE_KEY.test(key)) throw new Error(`Refusing the storage key "${key}": it is not a picture or file name.`)
    return join(this.root, key)
  }
}

/** The disk folder as the IMAGES binding the API expects (server/env.ts). */
export function asR2Bucket(bucket: DiskBucket): R2Bucket {
  return bucket as unknown as R2Bucket
}

// writeFile reads a web stream as it arrives (it is async-iterable), so a
// stream is never held whole in memory.
function dataOf(value: PutValue): Uint8Array | string | AsyncIterable<Uint8Array> {
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (value instanceof ReadableStream) return value as unknown as AsyncIterable<Uint8Array>
  return value
}

function nullIfMissing(error: NodeJS.ErrnoException): null {
  if (error.code === 'ENOENT') return null
  throw error
}
