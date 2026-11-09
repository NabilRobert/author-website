/**
 * Keeps a copy of unsaved changes in this browser (localStorage), so they
 * survive an expired sign-in, a reload or a closed tab. The editor brings
 * them back on the next visit, as long as the site hasn't been saved from
 * somewhere else in the meantime.
 *
 * Storage can be full or switched off (private windows); then the editor
 * simply works without a backup.
 */
import { siteContentSchema } from '@shared/schema'
import type { SiteContent } from '@shared/schema'

// One backup per site, in case one browser edits more than one.
const backupKey = (site: string) => `framed:unsaved-draft:${site}`

export function keepBackup(site: string, draft: SiteContent): void {
  try {
    localStorage.setItem(backupKey(site), JSON.stringify(draft))
  } catch {
    // No room or no storage: nothing to do but carry on without a backup.
  }
}

export function clearBackup(site: string): void {
  try {
    localStorage.removeItem(backupKey(site))
  } catch {
    // Storage switched off: there is no backup to clear.
  }
}

/**
 * The backed-up draft if it was made from the same saved version as
 * `saved` (so restoring it can't undo newer work), otherwise null. A backup
 * that no longer matches is thrown away.
 */
export function takeBackup(site: string, saved: SiteContent | null): SiteContent | null {
  const backup = readBackup(site)
  if (!backup) return null
  if (backup.updatedAt !== (saved?.updatedAt ?? '')) {
    clearBackup(site)
    return null
  }
  return backup
}

function readBackup(site: string): SiteContent | null {
  try {
    const parsed = siteContentSchema.safeParse(JSON.parse(localStorage.getItem(backupKey(site)) ?? 'null'))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
