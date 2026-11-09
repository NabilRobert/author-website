import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ImageCropper from '@/editor/fields/ImageCropper.vue'
import FramedImage from '@/components/ui/FramedImage.vue'
import type { ImageCrop } from '@shared/fields'

const KEY = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'

function mountCropper(crop: ImageCrop = { x: 50, y: 50, zoom: 1 }) {
  const updates: ImageCrop[] = []
  const cropper = mount(ImageCropper, {
    props: {
      imageKey: KEY,
      shape: 'cover',
      modelValue: crop,
      'onUpdate:modelValue': (next: ImageCrop) => updates.push(next),
    },
  })
  const frame = cropper.find('[role="application"]')
  // jsdom has no layout: give the frame a size to drag across.
  frame.element.getBoundingClientRect = () => ({ width: 200, height: 300 }) as DOMRect
  return { cropper, frame, updates }
}

// jsdom's synthetic pointer events can't carry coordinates; real ones can.
function pointer(frame: ReturnType<typeof mountCropper>['frame'], type: string, clientX: number, clientY: number) {
  frame.element.dispatchEvent(new MouseEvent(type, { clientX, clientY, bubbles: true }))
  return nextTick()
}

describe('FramedImage', () => {
  it('keeps the focus point in view and zooms around it', () => {
    const image = mount(FramedImage, { props: { imageKey: KEY, crop: { x: 20, y: 70, zoom: 1.5 }, alt: 'Cover' } })
    const img = image.find('img')
    expect(img.attributes('style')).toContain('--focus: 20% 70%')
    expect(img.attributes('style')).toContain('--zoom: 1.5')
    expect(img.classes()).toEqual(expect.arrayContaining(['object-(--focus)', 'origin-(--focus)', 'scale-(--zoom)']))
  })
})

describe('ImageCropper', () => {
  it('shows the frame in the shape the picture has on the site', () => {
    const { frame } = mountCropper()
    expect(frame.classes()).toContain('aspect-[2/3]')
  })

  it('moves the focus point the other way when the picture is dragged', async () => {
    const { frame, updates } = mountCropper()
    await pointer(frame, 'pointerdown', 100, 100)
    // 50 px right on a 200 px frame is 25%: the focus moves 25% left.
    await pointer(frame, 'pointermove', 150, 100)
    expect(updates.at(-1)).toEqual({ x: 25, y: 50, zoom: 1 })
  })

  it('keeps the focus point inside the picture', async () => {
    const { frame, updates } = mountCropper({ x: 5, y: 50, zoom: 1 })
    await pointer(frame, 'pointerdown', 0, 0)
    await pointer(frame, 'pointermove', 190, 0)
    expect(updates.at(-1)?.x).toBe(0)
  })

  it('moves the picture with the arrow keys, like a short drag', async () => {
    const { frame, updates } = mountCropper()
    await frame.trigger('keydown', { key: 'ArrowRight' })
    expect(updates.at(-1)).toEqual({ x: 48, y: 50, zoom: 1 })
  })

  it('zooms with the slider and resets to centred', async () => {
    const { cropper, updates } = mountCropper({ x: 30, y: 40, zoom: 1 })
    await cropper.find('input[type="range"]').setValue('2')
    expect(updates.at(-1)).toEqual({ x: 30, y: 40, zoom: 2 })
    await cropper
      .findAll('button')
      .find((button) => button.text() === 'Reset')!
      .trigger('click')
    expect(updates.at(-1)).toEqual({ x: 50, y: 50, zoom: 1 })
  })
})
