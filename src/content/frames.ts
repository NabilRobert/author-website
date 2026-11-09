/**
 * The shape of each kind of picture frame on the site, shared by the public
 * components and the editor's cropper so both show the same crop.
 */
export const FRAME_SHAPES = {
  cover: '2 / 3',
  photo: '4 / 5',
  picture: '4 / 5',
  // The banner's real shape depends on the screen; this is a typical one.
  banner: '16 / 7',
} as const

export type FrameShape = keyof typeof FRAME_SHAPES
