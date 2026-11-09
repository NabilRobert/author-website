/**
 * Which block the owner is working on, shared by the preview and the forms.
 *
 * Clicking a block in the preview selects it (source 'preview'): the editor
 * opens the Pages tab (or the Work tab, for a block on a work's own page)
 * and scrolls to that block's form. Clicking into a
 * block's form selects it too (source 'form'), which outlines the block in
 * the preview. A new object is stored on every click, so clicking the same
 * block again still brings its form back after visiting another tab.
 */
import { inject, provide, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'
import type { SiteContent } from '@shared/schema'

export interface BlockSelection {
  blockId: string
  source: 'preview' | 'form'
}

const BLOCK_SELECTION_KEY: InjectionKey<Ref<BlockSelection | null>> = Symbol('block selection')

/** Called once by the editor page; its tabs and forms read it with useBlockSelection(). */
export function provideBlockSelection(): Ref<BlockSelection | null> {
  const selection = ref<BlockSelection | null>(null)
  provide(BLOCK_SELECTION_KEY, selection)
  return selection
}

/** The work whose own page holds `blockId`, if one does (otherwise it is on a site page). */
export function workHoldingBlock(content: SiteContent, blockId: string) {
  return content.works.find((work) => work.pageBlocks.some((block) => block.id === blockId))
}

export function useBlockSelection(): Ref<BlockSelection | null> {
  const selection = inject(BLOCK_SELECTION_KEY)
  if (!selection) throw new Error('useBlockSelection() is only for components inside the editor.')
  return selection
}
