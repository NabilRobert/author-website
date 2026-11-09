import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import WorksBlock from '@/components/blocks/WorksBlock.vue'
import ImageTextBlock from '@/components/blocks/ImageTextBlock.vue'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import PressKitBlock from '@/components/blocks/PressKitBlock.vue'
import WorksForm from '@/editor/block-forms/WorksForm.vue'
import { DRAFT_KEY } from '@/editor/useEditor'
import { blockSchema } from '@shared/blocks'
import type { BlockOf, BlockType } from '@shared/blocks'
import { demoContent } from '@shared/demo-content'
import { centredCrop } from '@shared/fields'
import { plainBox } from '@shared/theme'

const [lantern, harbour, tidewater] = demoContent.works
const IMAGE = 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg'

// A block as saved before any picture options, plus `changes`; the schema
// fills in the defaults.
function blockOf<T extends BlockType>(type: T, fields: object): BlockOf<T> {
  return blockSchema.parse({ id: lantern!.id, style: plainBox(), type, ...fields }) as BlockOf<T>
}

function worksBlock(changes: Partial<BlockOf<'works'>>): BlockOf<'works'> {
  return blockOf('works', { heading: '', show: 'all', ...changes })
}

function mountWorks(block: BlockOf<'works'>) {
  const router = createAppRouter(createMemoryHistory())
  return mount(WorksBlock, { props: { block, content: demoContent }, global: { plugins: [router] } })
}

function imageTextBlock(changes: Partial<BlockOf<'imageText'>>): BlockOf<'imageText'> {
  const picture = { imageKey: IMAGE, imageCrop: centredCrop(), imageDescription: '' }
  return blockOf('imageText', { heading: '', body: 'Words', ...picture, imageSide: 'left', ...changes })
}

describe('a works block', () => {
  it('shows only the ticked works, in the order of the Work tab', () => {
    const block = mountWorks(worksBlock({ show: 'picked', pickedWorkIds: [tidewater!.id, lantern!.id] }))
    const titles = block.findAll('h3').map((heading) => heading.text())
    expect(titles).toEqual([lantern!.title, tidewater!.title])
  })

  it('draws its pictures in its own shape instead of the Look tab’s', () => {
    const block = mountWorks(worksBlock({ pictureShape: 'square', pictureCorners: 'round' }))
    expect(block.find('.aspect-square').classes()).toContain('rounded-full')
    expect(block.find('.aspect-\\[4\\/3\\]').exists()).toBe(false)
  })

  it('loads a block saved before picking and shapes existed', () => {
    expect(worksBlock({})).toMatchObject({ pickedWorkIds: [], pictureShape: '', pictureCorners: 'soft' })
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

  it('draws the picture with the chosen corners', () => {
    const block = mount(ImageTextBlock, { props: { block: imageTextBlock({ pictureCorners: 'sharp' }) } })
    expect(block.find('.aspect-\\[2\\/3\\]').classes()).toContain('rounded-none')
  })

  it('loads a block saved before shapes existed as a portrait picture with slightly rounded corners', () => {
    expect(imageTextBlock({})).toMatchObject({ imageShape: 'portrait', pictureCorners: 'soft' })
  })
})

describe('a banner', () => {
  const words = { heading: 'Hi', subheading: '', buttonLabel: '', buttonUrl: '', backgroundColour: '', textColour: '' }
  const banner = { ...words, imageKey: null, imageCrop: centredCrop() }

  it('fits its words unless the owner gives it a shape', () => {
    const fitted = mount(HeroBlock, { props: { block: blockOf('hero', banner), isPageTitle: true } })
    expect(fitted.find('section').classes().join(' ')).not.toContain('aspect-')
    const wide = blockOf('hero', { ...banner, bannerShape: 'wide', pictureCorners: 'rounded' })
    const shaped = mount(HeroBlock, { props: { block: wide, isPageTitle: true } })
    expect(shaped.find('section').classes()).toEqual(expect.arrayContaining(['aspect-video', 'rounded-3xl']))
  })
})

describe('a press kit', () => {
  it('frames the photo and the pictures of work in their own shapes', () => {
    const content = { ...demoContent, profile: { ...demoContent.profile, photoKey: IMAGE } }
    const block = blockOf('pressKit', { heading: '', photoShape: 'square', pictureShape: 'wide' })
    const kit = mount(PressKitBlock, { props: { block, content } })
    expect(kit.find('a[download] .aspect-square').exists()).toBe(true)
    expect(kit.findAll('li .aspect-video')).toHaveLength(demoContent.works.length)
  })
})
