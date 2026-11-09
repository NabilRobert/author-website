/**
 * Files to download (a CV, a portfolio, a price list): PDFs only, shared by
 * the editor (a quick check before uploading) and the API (which checks
 * again, including the file's first bytes). They are stored next to the
 * pictures in R2 and count towards the same allowance (server/image-limits.ts).
 */
import { z } from 'zod'

export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const FILE_TYPE = 'application/pdf'
export const FILE_WRONG_TYPE_MESSAGE = 'The file must be a PDF.'
export const FILE_TOO_BIG_MESSAGE = 'The file must be under 10 MB. Try saving a smaller copy of the PDF.'

/** A stored file, by its key (`files/<uuid>.pdf`), or none yet. */
export const fileKey = z
  .string()
  .regex(/^files\/[a-z0-9-]+\.pdf$/, 'That file could not be found. Upload it again.')
  .nullable()

/**
 * Where a stored file is downloaded from: `files/<id>.pdf` is served at
 * `/api/files/<id>.pdf` (server/file-routes.ts), saved under `label`.
 */
export function fileUrl(key: string, label: string): string {
  return `/api/${key}?as=${encodeURIComponent(label)}`
}
