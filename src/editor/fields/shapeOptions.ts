/** The picture shapes as drop-down choices, for the Look tab and the blocks with pictures. */
import { WORK_SHAPES } from '@shared/theme'
import type { WorkShape } from '@shared/theme'

export const SHAPE_OPTIONS = (Object.keys(WORK_SHAPES) as WorkShape[]).map((key) => ({
  value: key,
  label: WORK_SHAPES[key],
}))
