import { describe, expect, it, vi } from 'vitest'
import { demoContent } from '@shared/demo-content'
import { clickButton, openEditor, startEachTestFresh } from './open-editor'
import type { Editor } from './open-editor'

// Saved layouts, and works with their pages, in the editor.
startEachTestFresh()

describe('saving a page as a layout', () => {
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
  async function addProject(editor: Editor, layout: string) {
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
  const addressBox = (editor: Editor) => editor.findAll('label').find((label) => label.text() === 'Its address')!

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
