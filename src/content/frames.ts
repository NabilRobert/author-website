/**
 * The shape of each kind of picture frame on the site, as Tailwind classes,
 * shared by the public components and the editor's cropper so both show the
 * same crop.
 */
export const FRAME_CLASSES = {
  cover: 'aspect-[2/3]',
  photo: 'aspect-[4/5]',
  picture: 'aspect-[4/5]',
  // The banner's real shape depends on the screen; this is a typical one.
  banner: 'aspect-[16/7]',
} as const

export type FrameShape = keyof typeof FRAME_CLASSES
