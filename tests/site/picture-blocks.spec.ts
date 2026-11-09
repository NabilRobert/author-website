import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import WorksBlock from '@/components/blocks/WorksBlock.vue'
import ImageTextBlock from '@/components/blocks/ImageTextBlock.vue'
import HeroBlock from '@/components/blocks/HeroBlock.vue'
import PressKitBlock from '@/components/blocks/PressKitBlock.vue'
import GalleryBlock from '@/components/blocks/GalleryBlock.vue'
import DownloadsBlock from '@/components/blocks/DownloadsBlock.vue'
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

describe('a gallery', () => {
  const picture = (description: string) => ({ imageKey: IMAGE, imageCrop: centredCrop(), description })
  const gallery = (fields: object) =>
    blockOf('gallery', { heading: 'Photos', columns: 3, imageShape: 'square', ...fields })

  it('shows every picture in its shape, with its caption, in the chosen number of columns', () => {
    const block = gallery({ pictures: [picture('Front door'), picture('')], columns: 4, pictureCorners: 'round' })
    const shown = mount(GalleryBlock, { props: { block } })
    expect(shown.find('ul').classes()).toContain('@2xl:grid-cols-4')
    expect(shown.findAll('.aspect-square.rounded-full')).toHaveLength(2)
    expect(shown.findAll('figcaption').map((caption) => caption.text())).toEqual(['Front door'])
  })

  it('refuses to save a picture that was never uploaded', () => {
    const empty = { imageKey: null, imageCrop: centredCrop(), description: '' }
    const result = blockSchema.safeParse({ ...gallery({ pictures: [] }), pictures: [empty] })
    expect(result.error?.issues[0]?.message).toBe('Upload a picture, or remove this one.')
  })
})

describe("a gallery's full-size view", () => {
  // jsdom has no modal dialogs; these stand in for the browser's.
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false
      this.dispatchEvent(new Event('close'))
    })
  })

  const KEYS = ['images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.jpg', 'images/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e02.jpg']
  function mountGallery() {
    const pictures = KEYS.map((imageKey, index) => ({
      imageKey,
      imageCrop: centredCrop(),
      description: `Room ${index + 1}`,
    }))
    const block = blockOf('gallery', { heading: '', pictures, columns: 3, imageShape: 'square' })
    return mount(GalleryBlock, { props: { block } })
  }
  const shownPicture = (gallery: ReturnType<typeof mountGallery>) => gallery.find('dialog img').attributes('src')

  it('opens the clicked picture whole, uncropped, with its caption', async () => {
    const gallery = mountGallery()
    await gallery.find('button[aria-label="Open Room 2 full size"]').trigger('click')
    expect((gallery.find('dialog').element as HTMLDialogElement).open).toBe(true)
    expect(shownPicture(gallery)).toBe(`/api/${KEYS[1]}`)
    expect(gallery.find('dialog figcaption').text()).toBe('Room 2')
    expect(gallery.find('dialog').text()).toContain('2 of 2')
  })

  it('steps through the pictures with the buttons and the arrow keys, wrapping around', async () => {
    const gallery = mountGallery()
    await gallery.find('button[aria-label="Open Room 2 full size"]').trigger('click')
    await gallery
      .findAll('dialog button')
      .find((button) => button.text() === 'Next →')!
      .trigger('click')
    expect(shownPicture(gallery)).toBe(`/api/${KEYS[0]}`)
    await gallery.find('dialog').trigger('keydown', { key: 'ArrowLeft' })
    expect(shownPicture(gallery)).toBe(`/api/${KEYS[1]}`)
  })

  it('closes with the Close button', async () => {
    const gallery = mountGallery()
    await gallery.find('button[aria-label="Open Room 1 full size"]').trigger('click')
    await gallery
      .findAll('dialog button')
      .find((button) => button.text().startsWith('Close'))!
      .trigger('click')
    expect((gallery.find('dialog').element as HTMLDialogElement).open).toBe(false)
  })

  it("stays shut for a click that arrives already prevented, as in the editor's preview", async () => {
    const gallery = mountGallery()
    const button = gallery.find('button[aria-label="Open Room 1 full size"]').element
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    click.preventDefault()
    button.dispatchEvent(click)
    await gallery.vm.$nextTick()
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled()
  })
})

describe('a downloads block', () => {
  const KEY = 'files/0b8e2f4c-3a1d-4c6b-8e7f-2d9a5c1b3e01.pdf'

  it('links each file for download under its label', () => {
    const block = blockOf('downloads', { heading: 'Downloads', files: [{ fileKey: KEY, label: 'My CV' }] })
    const link = mount(DownloadsBlock, { props: { block } }).find('a')
    expect(link.attributes('href')).toBe(`/api/${KEY}?as=My%20CV`)
    expect(link.attributes('download')).toBeDefined()
    expect(link.text()).toContain('My CV')
  })

  it('refuses to save a file that was never uploaded', () => {
    const result = blockSchema.safeParse({
      ...blockOf('downloads', { heading: '', files: [] }),
      files: [{ fileKey: null, label: 'My CV' }],
    })
    expect(result.error?.issues[0]?.message).toBe('Upload a PDF, or remove this one.')
  })
})
