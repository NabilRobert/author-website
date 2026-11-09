/**
 * The shape of each kind of picture frame on the site, as Tailwind classes,
 * shared by the public components and the editor's cropper so both show the
 * same crop.
 */
export const FRAME_CLASSES = {
  photo: 'aspect-[4/5]',
  picture: 'aspect-[4/5]',
  // The banner's real shape depends on the screen; this is a typical one.
  banner: 'aspect-[16/7]',
} as const

export type FrameShape = keyof typeof FRAME_CLASSES

/** The shapes on offer for pictures of work (shared/theme.ts: workShape). */
export const WORK_SHAPE_CLASSES = {
  portrait: 'aspect-[2/3]',
  landscape: 'aspect-[4/3]',
  square: 'aspect-square',
  wide: 'aspect-video',
} as const

/** How wide the picture column is beside a work's text, per shape. */
export const WORK_COLUMN_CLASSES = {
  portrait: '@2xl:grid-cols-[12rem_1fr]',
  landscape: '@2xl:grid-cols-[20rem_1fr]',
  square: '@2xl:grid-cols-[14rem_1fr]',
  wide: '@2xl:grid-cols-[22rem_1fr]',
} as const
