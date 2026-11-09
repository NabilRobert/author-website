/**
 * The editor's two calls to its API (server/admin-routes.ts), turned into
 * results the editor can show: every failure becomes a sentence saying what
 * happened and what to do.
 */
import type { SiteContent } from '@shared/schema'
import { describeLocation } from '@/editor/problems'
import type { SaveProblem } from '@/editor/problems'

const API = '/api/admin/content'
const NO_CONNECTION =
  "Couldn't reach the site. Check your internet connection and try again. Your changes are still here."

export type LoadResult =
  | { kind: 'loaded'; content: SiteContent }
  | { kind: 'empty' }
  | { kind: 'signed-out' }
  | { kind: 'failed'; message: string }

export type SaveResult =
  { isSaved: true; text: string; content: SiteContent } | { isSaved: false; text: string; problems: SaveProblem[] }

interface Issue {
  path: readonly PropertyKey[]
  message: string
}
interface ErrorBody {
  error?: string
  issues?: Issue[]
}

export async function fetchDraft(): Promise<LoadResult> {
  const response = await fetch(API, { cache: 'no-store' }).catch(() => null)
  if (!response) return { kind: 'failed', message: NO_CONNECTION }
  if (response.status === 401) return { kind: 'signed-out' }
  if (response.status === 404) return { kind: 'empty' }
  if (!response.ok) return { kind: 'failed', message: (await readError(response)).error ?? NO_CONNECTION }
  return { kind: 'loaded', content: (await response.json()) as SiteContent }
}

export async function sendDraft(content: SiteContent): Promise<SaveResult> {
  const request = { method: 'PUT', body: JSON.stringify(content), headers: { 'Content-Type': 'application/json' } }
  const response = await fetch(API, request).catch(() => null)
  if (!response) return { isSaved: false, text: NO_CONNECTION, problems: [] }
  if (!response.ok) {
    const error = await readError(response)
    return problemsResult(error.error ?? 'Saving failed. Try again in a minute.', error.issues ?? [], content)
  }
  const saved = (await response.json()) as SiteContent
  return { isSaved: true, text: 'Saved. Visitors will see the changes within a minute.', content: saved }
}

/** A failed save that lists each field to fix and where it is. */
export function problemsResult(text: string, issues: Issue[], content: SiteContent): SaveResult {
  const problems = issues.map((issue) => ({ location: describeLocation(issue.path, content), message: issue.message }))
  return { isSaved: false, text, problems }
}

async function readError(response: Response): Promise<ErrorBody> {
  return ((await response.json().catch(() => null)) ?? {}) as ErrorBody
}

export type UploadResult = { isUploaded: true; key: string } | { isUploaded: false; message: string }

/** Sends one picture to R2 through the API; the key goes into the draft. */
export async function uploadImage(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.set('image', file)
  const response = await fetch('/api/admin/images', { method: 'POST', body: form }).catch(() => null)
  if (!response) return { isUploaded: false, message: NO_CONNECTION }
  if (!response.ok) {
    const message = (await readError(response)).error ?? 'The upload failed. Try again in a minute.'
    return { isUploaded: false, message }
  }
  return { isUploaded: true, key: ((await response.json()) as { key: string }).key }
}
