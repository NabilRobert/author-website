import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import WorksBlock from '@/components/blocks/WorksBlock.vue'
import ImageTextBlock from '@/components/blocks/ImageTextBlock.vue'
import WorksForm from '@/editor/block-forms/WorksForm.vue'
import { DRAFT_KEY } from '@/editor/useEditor'
import { blockSchema } from '@shared/blocks'
import type { BlockOf } from '@shared/blocks'
import { demoContent } from '@shared/demo-content'
import { centredCrop } from '@shared/fields'
import { plainBox } from '@shared/theme'

const [lantern, harbour, tidewater] = demoContent.works
const IMAGE = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'

function worksBlock(changes: Partial<BlockOf<'works'>>): BlockOf<'works'> {
  const base = { id: lantern!.id, style: plainBox(), type: 'works' as const, heading: '', show: 'all' as const }
  return { ...base, pickedWorkIds: [], shape: '', ...changes }
}

function mountWorks(block: BlockOf<'works'>) {
  const router = createAppRouter(createMemoryHistory())
  return mount(WorksBlock, { props: { block, content: demoContent }, global: { plugins: [router] } })
}

function imageTextBlock(changes: Partial<BlockOf<'imageText'>>): BlockOf<'imageText'> {
  const base = { id: lantern!.id, style: plainBox(), type: 'imageText' as const, heading: '', body: 'Words' }
  const picture = { imageKey: IMAGE, imageCrop: centredCrop(), imageDescription: '' }
  return { ...base, ...picture, imageSide: 'left', imageShape: 'portrait', ...changes }
}

describe('a works block', () => {
  it('shows only the ticked works, in the order of the Work tab', () => {
    const block = mountWorks(worksBlock({ show: 'picked', pickedWorkIds: [tidewater!.id, lantern!.id] }))
    const titles = block.findAll('h3').map((heading) => heading.text())
    expect(titles).toEqual([lantern!.title, tidewater!.title])
  })

  it('draws its pictures in its own shape instead of the Look tab’s', () => {
    const block = mountWorks(worksBlock({ shape: 'square' }))
    expect(block.find('.aspect-square').exists()).toBe(true)
    expect(block.find('.aspect-\\[4\\/3\\]').exists()).toBe(false)
  })

  it('loads a block saved before picking and shapes existed', () => {
    const saved = { id: harbour!.id, style: plainBox(), type: 'works', heading: '', show: 'all' }
    expect(blockSchema.parse(saved)).toMatchObject({ pickedWorkIds: [], shape: '' })
  })
})

describe('the works block form', () => {
  it('lists every work with a tick box once "Only the ones I tick" is chosen', async () => {
    const block = ref(worksBlock({ show: 'picked' }))
    const form = mount(WorksForm, {
      props: { modelValue: block.value, 'onUpdate:modelValue': (next: BlockOf<'works'>) => (block.value = next) },
      global: { provide: { [DRAFT_KEY as symbol]: ref(demoContent) } },
    })
    const boxes = form.findAll('input[type="checkbox"]')
    expect(boxes).toHaveLength(demoContent.works.length)
    await boxes[1]!.setValue(true)
    expect(block.value.pickedWorkIds).toEqual([harbour!.id])
  })
})

describe('a picture and text block', () => {
  it('draws the picture in the chosen shape', () => {
    const block = mount(ImageTextBlock, { props: { block: imageTextBlock({ imageShape: 'landscape' }) } })
    expect(block.find('.aspect-\\[4\\/3\\]').exists()).toBe(true)
  })

  it('gives the picture the narrow column when it is on the right', () => {
    const block = mount(ImageTextBlock, { props: { block: imageTextBlock({ imageSide: 'right' }) } })
    expect(block.find('section').classes()).toContain('@3xl:grid-cols-[1fr_18rem]')
  })

  it('loads a block saved before shapes existed as a portrait picture', () => {
    const { imageShape, ...saved } = imageTextBlock({})
    expect(imageShape).toBe('portrait')
    expect(blockSchema.parse(saved)).toMatchObject({ imageShape: 'portrait' })
  })
})
