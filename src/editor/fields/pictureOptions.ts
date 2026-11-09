/** Picture shapes and corners as drop-down choices, for the Look tab and the blocks with pictures. */
import { PICTURE_CORNERS, WORK_SHAPES } from '@shared/theme'
import type { PictureCorners, WorkShape } from '@shared/theme'

export const SHAPE_OPTIONS = (Object.keys(WORK_SHAPES) as WorkShape[]).map((key) => ({
  value: key,
  label: WORK_SHAPES[key],
}))

/** For pictures of work, which can also follow the Look tab. */
export const WORK_SHAPE_OPTIONS = [{ value: '' as const, label: 'Same as the Look tab' }, ...SHAPE_OPTIONS]

export const CORNER_OPTIONS = (Object.keys(PICTURE_CORNERS) as PictureCorners[]).map((key) => ({
  value: key,
  label: PICTURE_CORNERS[key],
}))
