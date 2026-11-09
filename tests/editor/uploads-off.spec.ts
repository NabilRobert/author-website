import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ImageField from '@/editor/fields/ImageField.vue'
import FileField from '@/editor/fields/FileField.vue'
import { fakeApi, json } from '../fake-api'

// Its own file: whether uploads are on is asked once per page load.
afterEach(() => vi.unstubAllGlobals())

describe('when this deployment has no picture storage', () => {
  it('shows a note instead of the upload buttons', async () => {
    fakeApi({ 'GET /api/features': json({ uploads: false }) })
    const picture = mount(ImageField, { props: { label: 'Cover picture', modelValue: null } })
    const file = mount(FileField, { props: { modelValue: null } })
    await flushPromises()
    for (const field of [picture, file]) {
      expect(field.text()).toContain('switched off for now')
      expect(field.find('input[type="file"]').exists()).toBe(false)
    }
  })
})
