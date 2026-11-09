/**
 * The rules for uploaded pictures, shared by the editor (which checks
 * before uploading, to give a quick answer) and the API (which checks
 * again, and also looks at the file's first bytes).
 *
 * SVG is not allowed: an SVG file can carry script.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export type ImageType = keyof typeof IMAGE_TYPES

export const WRONG_TYPE_MESSAGE = 'The picture must be a JPG, PNG or WebP file.'
export const TOO_BIG_MESSAGE = 'The picture must be under 5 MB. Try a smaller copy of it.'

export function isImageType(type: string): type is ImageType {
  return type in IMAGE_TYPES
}

/**
 * Where the browser loads a stored image from: the key `images/<id>.png`
 * is served at `/api/images/<id>.png` (server/image-routes.ts).
 */
export function imageUrl(key: string): string {
  return `/api/${key}`
}
