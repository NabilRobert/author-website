/**
 * Pages the owner saved as layouts (shared/schema.ts: savedLayoutSchema):
 * saving one, offering them in the layout pickers, and removing one.
 */
import type { Block } from '@shared/blocks'
import type { SavedLayout, SiteContent } from '@shared/schema'
import type { PageTemplate } from '@/editor/pageTemplates'

/**
 * Copies of `blocks` with new ids. Every block id is one row of the blocks
 * table, so a saved layout and the pages made from it never share one.
 */
export function copyBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => ({ ...(JSON.parse(JSON.stringify(block)) as Block), id: crypto.randomUUID() }))
}

export function saveLayout(content: SiteContent, name: string, blocks: Block[]): void {
  content.savedLayouts.push({ id: crypto.randomUUID(), name, blocks: copyBlocks(blocks) })
}

/** The owner's layouts, for the pickers next to the ready-made ones. */
export function savedLayoutChoices(layouts: SavedLayout[]): PageTemplate[] {
  return layouts.map((layout) => ({
    key: `saved-${layout.id}`,
    name: layout.name,
    description: `Your own layout, ${layout.blocks.length} ${layout.blocks.length === 1 ? 'block' : 'blocks'}`,
    title: layout.name,
    savedLayoutId: layout.id,
    blocks: () => copyBlocks(layout.blocks),
  }))
}

/** Removes a saved layout after asking; pages made from it stay as they are. */
export function removeSavedLayout(content: SiteContent, layoutId: string): void {
  const index = content.savedLayouts.findIndex((layout) => layout.id === layoutId)
  const layout = content.savedLayouts[index]
  if (!layout) return
  if (!window.confirm(`Remove the layout “${layout.name}”? Pages made from it stay as they are.`)) return
  content.savedLayouts.splice(index, 1)
}
