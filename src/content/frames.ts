/**
 * The shape of each kind of picture frame on the site, as Tailwind classes,
 * shared by the public components and the editor's cropper so both show the
 * same crop.
 */
export const FRAME_CLASSES = {
  photo: 'aspect-[4/5]',
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

/** Picture (and banner) corners, per choice (shared/theme.ts: PICTURE_CORNERS). */
export const PICTURE_CORNER_CLASSES = {
  sharp: 'rounded-none',
  soft: 'rounded-sm',
  rounded: 'rounded-3xl',
  round: 'rounded-full',
} as const

/**
 * A banner given a shape: tall shapes are kept narrow and centred, or they
 * would be taller than the screen. Words that don't fit make it taller.
 */
export const BANNER_SHAPE_CLASSES = {
  portrait: 'mx-auto max-w-md aspect-[2/3]',
  square: 'mx-auto max-w-xl aspect-square',
  landscape: 'aspect-[4/3]',
  wide: 'aspect-video',
} as const

/**
 * The picture-and-text block: how wide the picture's column is, per shape,
 * with the picture on the left or the right of the text.
 */
export const PICTURE_BESIDE_TEXT_CLASSES = {
  portrait: { left: '@3xl:grid-cols-[18rem_1fr]', right: '@3xl:grid-cols-[1fr_18rem]' },
  square: { left: '@3xl:grid-cols-[20rem_1fr]', right: '@3xl:grid-cols-[1fr_20rem]' },
  landscape: { left: '@3xl:grid-cols-[24rem_1fr]', right: '@3xl:grid-cols-[1fr_24rem]' },
  wide: { left: '@3xl:grid-cols-[26rem_1fr]', right: '@3xl:grid-cols-[1fr_26rem]' },
} as const

/** How wide the picture column is beside a work's text, per shape. */
export const WORK_COLUMN_CLASSES = {
  portrait: '@2xl:grid-cols-[12rem_1fr]',
  landscape: '@2xl:grid-cols-[20rem_1fr]',
  square: '@2xl:grid-cols-[14rem_1fr]',
  wide: '@2xl:grid-cols-[22rem_1fr]',
} as const
