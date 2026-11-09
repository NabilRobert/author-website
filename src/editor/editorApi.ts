/**
 * The editor's calls to the API (server/me-routes.ts), turned into
 * results the editor can show: every failure becomes a sentence saying what
 * happened and what to do.
 */
import { siteContentSchema } from '@shared/schema'
import type { SiteContent } from '@shared/schema'
import { fetchMe } from '@/auth/account'
import { describeLocation } from '@/editor/problems'
import type { SaveProblem } from '@/editor/problems'

const API = '/api/me/content'
const NO_CONNECTION =
  "Couldn't reach the site. Check your internet connection and try again. Your changes are still here."
const SIGNED_OUT =
  'Your login has expired. Log in again at framed.my.id/login in a new tab, then save here: your changes are kept on this computer.'

export type LoadResult =
  | { kind: 'loaded'; content: SiteContent }
  | { kind: 'not-yours'; ownName: string | null }
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

/** The site to edit, if it belongs to whoever is logged in. */
export async function fetchDraft(site: string): Promise<LoadResult> {
  const refusal = await checkOwner(site)
  return refusal ?? fetchOwnContent()
}

/** Why this person can't edit `site`, or null if it is theirs. */
async function checkOwner(site: string): Promise<LoadResult | null> {
  const me = await fetchMe().catch(() => undefined)
  if (me === undefined) return { kind: 'failed', message: NO_CONNECTION }
  if (me === null) return { kind: 'signed-out' }
  if (me.site?.name !== site) return { kind: 'not-yours', ownName: me.site?.name ?? null }
  return null
}

async function fetchOwnContent(): Promise<LoadResult> {
  const response = await fetch(API, { cache: 'no-store' }).catch(() => null)
  if (!response) return { kind: 'failed', message: NO_CONNECTION }
  if (response.status === 401) return { kind: 'signed-out' }
  if (response.status === 404) return { kind: 'empty' }
  if (!response.ok) return { kind: 'failed', message: (await readError(response)).error ?? NO_CONNECTION }
  return { kind: 'loaded', content: (await response.json()) as SiteContent }
}

/** Checks the draft with the schema first (listing problems right away), then saves it. */
export async function saveDraft(draft: SiteContent): Promise<SaveResult> {
  const checked = siteContentSchema.safeParse(draft)
  if (!checked.success) return problemsResult('Some fields need fixing first:', checked.error.issues, draft)
  return sendDraft(checked.data)
}

async function sendDraft(content: SiteContent): Promise<SaveResult> {
  const headers = { 'Content-Type': 'application/json' }
  const response = await fetch(API, { method: 'PUT', body: JSON.stringify(content), headers }).catch(() => null)
  if (!response) return { isSaved: false, text: NO_CONNECTION, problems: [] }
  if (response.status === 401) return { isSaved: false, text: SIGNED_OUT, problems: [] }
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
export function uploadImage(file: File): Promise<UploadResult> {
  return upload('/api/me/images', 'image', file)
}

/** Sends one PDF to R2 through the API; the key goes into the draft. */
export function uploadFile(file: File): Promise<UploadResult> {
  return upload('/api/me/files', 'file', file)
}

async function upload(path: string, field: string, file: File): Promise<UploadResult> {
  const form = new FormData()
  form.set(field, file)
  const response = await fetch(path, { method: 'POST', body: form }).catch(() => null)
  if (!response) return { isUploaded: false, message: NO_CONNECTION }
  if (response.status === 401) return { isUploaded: false, message: SIGNED_OUT }
  if (!response.ok) {
    const message = (await readError(response)).error ?? 'The upload failed. Try again in a minute.'
    return { isUploaded: false, message }
  }
  return { isUploaded: true, key: ((await response.json()) as { key: string }).key }
}
