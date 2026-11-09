import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ImageField from '@/editor/fields/ImageField.vue'
import { MAX_IMAGE_BYTES } from '@shared/images'

afterEach(() => vi.unstubAllGlobals())

function mountField(imageKey: string | null = null) {
  const updates: (string | null)[] = []
  const wrapper = mount(ImageField, {
    props: { label: 'Cover', modelValue: imageKey, 'onUpdate:modelValue': (key: string | null) => updates.push(key) },
  })
  return { wrapper, updates }
}

async function choose(wrapper: ReturnType<typeof mountField>['wrapper'], file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('ImageField', () => {
  it('uploads a chosen picture and keeps its key', async () => {
    const fetchStub = vi.fn(async () => Response.json({ key: 'images/new.png' }, { status: 201 }))
    vi.stubGlobal('fetch', fetchStub)
    const { wrapper, updates } = mountField()
    await choose(wrapper, new File(['png'], 'cover.png', { type: 'image/png' }))
    expect(fetchStub).toHaveBeenCalledWith('/api/me/images', expect.objectContaining({ method: 'POST' }))
    expect(updates).toEqual(['images/new.png'])
  })

  it('refuses a GIF before uploading, saying which files work', async () => {
    const fetchStub = vi.fn()
    vi.stubGlobal('fetch', fetchStub)
    const { wrapper } = mountField()
    await choose(wrapper, new File(['gif'], 'cover.gif', { type: 'image/gif' }))
    expect(fetchStub).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toBe('The picture must be a JPG, PNG or WebP file.')
  })

  it('refuses a picture over 5 MB before uploading', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { wrapper } = mountField()
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.jpg', { type: 'image/jpeg' })
    await choose(wrapper, big)
    expect(wrapper.find('[role="alert"]').text()).toContain('under 5 MB')
  })

  it("shows the server's reason when the upload is refused", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'The picture must be a JPG, PNG or WebP file.' }, { status: 415 })),
    )
    const { wrapper, updates } = mountField()
    await choose(wrapper, new File(['x'], 'fake.jpg', { type: 'image/jpeg' }))
    expect(updates).toEqual([])
    expect(wrapper.find('[role="alert"]').text()).toBe('The picture must be a JPG, PNG or WebP file.')
  })

  it('removes the picture', async () => {
    const { wrapper, updates } = mountField('images/old.png')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Remove the picture')!
      .trigger('click')
    expect(updates).toEqual([null])
  })
})
