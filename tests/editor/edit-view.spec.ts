import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import EditView from '@/views/EditView.vue'
import { demoContent } from '@shared/demo-content'
import { fakeApi, json } from '../fake-api'

// Each test starts without the draft backup an earlier one left (src/editor/draftBackup.ts).
beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

function pretendScreenIsWide() {
  const query = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  )
}

async function openEditor() {
  fakeApi({
    'GET /api/me': json({ email: 'mara@example.com', site: { name: 'mara' } }),
    'GET /api/me/content': json({ ...demoContent, updatedAt: 'saved' }),
  })
  const router = createAppRouter(createMemoryHistory())
  await router.push('/mara/edit')
  const wrapper = mount(EditView, {
    props: { site: 'mara' },
    global: { plugins: [router, createHead()] },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('the editor page', () => {
  it('shows the change in the preview as the owner types', async () => {
    const editor = await openEditor()
    const headingBox = editor.find('section[aria-label^="Block 1"] input[type="text"]')
    await headingBox.setValue('A new banner heading')
    expect(editor.find('section[aria-label="Preview"] h1').text()).toBe('A new banner heading')
    expect(editor.text()).toContain('You have changes that are not saved yet.')
    editor.unmount()
  })

  it('adds a block to the page from the block picker', async () => {
    const editor = await openEditor()
    const addQuote = editor.findAll('button').find((button) => button.text().startsWith('+ Quote'))
    await addQuote!.trigger('click')
    expect(editor.find('section[aria-label="Preview"] blockquote').exists()).toBe(true)
    editor.unmount()
  })

  // Opens "+ Add a page" and picks the layout whose card starts with `name`.
  async function addPageFromLayout(editor: Awaited<ReturnType<typeof openEditor>>, name: string) {
    const buttons = () => editor.findAll('button')
    await buttons()
      .find((button) => button.text() === '+ Add a page')!
      .trigger('click')
    await buttons()
      .find((button) => button.text().startsWith(name))!
      .trigger('click')
  }

  it('adds a blank page, shows it in the menu preview, and selects it', async () => {
    const editor = await openEditor()
    await addPageFromLayout(editor, 'Blank')
    expect(editor.find('section[aria-label="Preview"] nav').text()).toContain('New page')
    expect(editor.text()).toContain('This page is empty.')
    editor.unmount()
  })

  it("adds a page from a layout, with that layout's blocks", async () => {
    const editor = await openEditor()
    await addPageFromLayout(editor, 'Project')
    const blockNames = editor.findAll('section[aria-label^="Block "]').map((block) => block.attributes('aria-label'))
    expect(blockNames).toEqual([
      'Block 1: Big banner',
      'Block 2: Text',
      'Block 3: Picture gallery',
      'Block 4: Text',
      'Block 5: Quote',
      'Block 6: Buttons',
    ])
    expect(editor.find('section[aria-label="Preview"] nav').text()).toContain('Project')
    editor.unmount()
  })

  it('switches to the Look tab and warns about hard-to-read colours', async () => {
    const editor = await openEditor()
    await editor
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Look')!
      .trigger('click')
    const colourInputs = editor.findAll('input[type="color"]')
    // Text the same colour as the background.
    await colourInputs[1]!.setValue('#f7f2e8')
    expect(editor.text()).toContain('Hard to read: Text on the background')
    editor.unmount()
  })

  it('puts the forms and preview side by side on a wide screen, with a divider', async () => {
    pretendScreenIsWide()
    const editor = await openEditor()
    expect(editor.find('.splitpanes__splitter').exists()).toBe(true)
    expect(editor.find('section[aria-label="Edit"]').exists()).toBe(true)
    editor.unmount()
  })

  it('switches to preview only with the layout buttons', async () => {
    pretendScreenIsWide()
    const editor = await openEditor()
    const previewOnly = editor.findAll('button').find((button) => button.text() === 'Preview only')!
    await previewOnly.trigger('click')
    expect(previewOnly.attributes('aria-pressed')).toBe('true')
    editor.unmount()
  })
})

describe('the Works tab', () => {
  it('opens a work in the Pages tab, with its details, pictures and page together', async () => {
    const editor = await openEditor()
    await editor
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Work')!
      .trigger('click')
    const harbourRow = editor.findAll('[data-work-title]').find((title) => title.text() === 'Harbour Library')!
    await harbourRow.element.closest('div')!.querySelector<HTMLButtonElement>('button')!.click()
    await flushPromises()
    expect(editor.find('[role="tab"][aria-selected="true"]').text()).toBe('Pages')
    const headings = editor.findAll('section[aria-label="Edit"] h2').map((heading) => heading.text())
    expect(headings).toEqual(expect.arrayContaining(['“Harbour Library”', 'More pictures', 'Its page']))
    expect(editor.find('section[aria-label="Preview"] h1').text()).toBe('Harbour Library')
    editor.unmount()
  })

  it('gives every work a drag handle and keeps Up and Down', async () => {
    const editor = await openEditor()
    await editor
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Work')!
      .trigger('click')
    expect(editor.findAll('.drag-handle')).toHaveLength(4)
    const moveDown = editor.find('button[aria-label="Move “Lantern” down"]')
    await moveDown.trigger('click')
    const titles = editor.findAll('[data-work-title]').map((title) => title.text())
    expect(titles).toEqual(['Harbour Library', 'Lantern', 'Tidewater Market', 'Ferry Posters'])
    editor.unmount()
  })
})

describe('saving a page as a layout', () => {
  const clickButton = async (editor: Awaited<ReturnType<typeof openEditor>>, text: string) =>
    editor
      .findAll('button')
      .find((button) => button.text().startsWith(text))!
      .trigger('click')

  it('offers the saved layout when adding a page, with copies of its blocks', async () => {
    const editor = await openEditor()
    const homeBlockIds = demoContent.pages[0]!.blocks.map((block) => block.id)
    await clickButton(editor, 'Save as a layout')
    await clickButton(editor, 'Save layout')
    expect(editor.text()).toContain('Saved “Home layout”')
    await clickButton(editor, '+ Add a page')
    await clickButton(editor, 'Home layout')
    const newBlocks = editor.findAll('section[aria-label^="Block "]')
    expect(newBlocks).toHaveLength(homeBlockIds.length)
    const newIds = newBlocks.map((block) => block.attributes('data-block-form'))
    expect(newIds.some((id) => homeBlockIds.includes(id!))).toBe(false)
    editor.unmount()
  })

  it('removes a saved layout from the picker after asking', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const editor = await openEditor()
    await clickButton(editor, 'Save as a layout')
    await clickButton(editor, 'Save layout')
    await clickButton(editor, '+ Add a page')
    await editor.find('button[aria-label="Remove the layout Home layout"]').trigger('click')
    expect(editor.find('button[aria-label="Remove the layout Home layout"]').exists()).toBe(false)
    vi.restoreAllMocks()
    editor.unmount()
  })
})

describe('adding a project in the Pages tab', () => {
  async function addProject(editor: Awaited<ReturnType<typeof openEditor>>, layout: string) {
    const button = (text: string) => editor.findAll('button').find((candidate) => candidate.text().startsWith(text))!
    await button('+ Add a project').trigger('click')
    await button(layout).trigger('click')
  }

  it('makes a new work with a page from the layout, and opens it', async () => {
    const editor = await openEditor()
    await addProject(editor, 'Case study')
    expect(editor.find('section[aria-label="Edit"] h2').text()).toBe('Your pages')
    expect(editor.text()).toContain('“New project”')
    expect(editor.findAll('section[aria-label^="Block "]')).toHaveLength(3)
    expect(editor.find('section[aria-label="Preview"] h1').text()).toBe('New project')
    editor.unmount()
  })

  it("gives a new project's address its title, until the address is changed", async () => {
    const editor = await openEditor()
    await addProject(editor, 'Just the details')
    const field = (label: string) =>
      editor.find(
        `#${editor
          .findAll('label')
          .find((candidate) => candidate.text() === label)!
          .attributes('for')}`,
      )
    await field('Title').setValue('Harbour Ferry')
    expect((field('Its address').element as HTMLInputElement).value).toBe('harbour-ferry')
    editor.unmount()
  })
})

describe('editing a work in the Pages tab', () => {
  async function openLantern() {
    const editor = await openEditor()
    await editor
      .findAll('button')
      .find((button) => button.text().includes('/work/lantern'))!
      .trigger('click')
    return editor
  }
  const addressBox = (editor: Awaited<ReturnType<typeof openEditor>>) =>
    editor.findAll('label').find((label) => label.text() === 'Its address')!

  it('keeps the address when it is emptied, so the work never has none', async () => {
    const editor = await openLantern()
    const input = editor.find(`#${addressBox(editor).attributes('for')}`)
    await input.setValue('')
    expect(editor.text()).toContain('/work/lantern')
    await input.setValue('lantern-app')
    expect(editor.text()).toContain('/work/lantern-app')
    editor.unmount()
  })

  it('turns its page off, which the preview says and the list shows', async () => {
    const editor = await openLantern()
    const showPage = editor.findAll('label').find((label) => label.text().startsWith('Show a page'))!
    const checkbox = showPage.find('input[type="checkbox"]')
    await checkbox.setValue(false)
    expect(editor.find('section[aria-label="Preview"]').text()).toContain("Visitors can't see this page")
    expect(editor.text()).toContain('Lantern (no page)')
    editor.unmount()
  })

  it('removes the work after asking, and goes back to the front page', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const editor = await openLantern()
    await editor
      .findAll('button')
      .find((button) => button.text() === 'Remove this work')!
      .trigger('click')
    expect(editor.text()).not.toContain('/work/lantern')
    expect(editor.find('button[aria-pressed="true"]').text()).toContain('Home')
    vi.restoreAllMocks()
    editor.unmount()
  })
})

describe('click to edit', () => {
  // jsdom has no layout, so it has no scrollIntoView; record the calls instead.
  const scrollIntoView = vi.fn()
  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView
    scrollIntoView.mockClear()
  })
  const [, worksBlock, newsBlock] = demoContent.pages[0]!.blocks

  it('opens a block clicked in the preview in the Pages tab and scrolls to its form', async () => {
    const editor = await openEditor()
    await editor
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Look')!
      .trigger('click')
    await editor.find(`[data-block-id="${worksBlock!.id}"] h2`).trigger('click')
    await flushPromises()
    expect(editor.find('[role="tab"][aria-selected="true"]').text()).toBe('Pages')
    const form = editor.find('section[aria-label="Block 2: Your work"]')
    expect(form.attributes('data-selected')).toBeDefined()
    expect(scrollIntoView.mock.contexts).toContain(form.element)
    editor.unmount()
  })

  it("opens a work's own page in the Pages tab for a block clicked on it", async () => {
    const editor = await openEditor()
    const lantern = demoContent.works[0]!
    await editor.find('section[aria-label="Preview"] select').setValue(lantern.id)
    await editor
      .findAll('[role="tab"]')
      .find((tab) => tab.text() === 'Look')!
      .trigger('click')
    await editor.find(`[data-block-id="${lantern.pageBlocks[1]!.id}"] p`).trigger('click')
    await flushPromises()
    expect(editor.find('[role="tab"][aria-selected="true"]').text()).toBe('Pages')
    expect(editor.text()).toContain('“Lantern”')
    expect(editor.find(`[data-block-form="${lantern.pageBlocks[1]!.id}"]`).attributes('data-selected')).toBeDefined()
    editor.unmount()
  })

  it('outlines the block in the preview when the owner works in its form', async () => {
    const editor = await openEditor()
    await editor.find('section[aria-label="Block 3: News and events"] input').trigger('focusin')
    expect(editor.find(`[data-block-id="${newsBlock!.id}"]`).attributes('data-selected')).toBeDefined()
    expect(editor.findAll('[data-block-id][data-selected]')).toHaveLength(1)
    editor.unmount()
  })
})
