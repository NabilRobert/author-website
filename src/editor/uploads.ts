/**
 * Whether this deployment can store uploads (GET /api/features,
 * server/storage.ts). Asked once and shared by every picture and file
 * field. Until the answer comes, or if it can't be fetched, uploads count
 * as on: the server refuses them anyway when they're off, with a clear message.
 */
import { ref } from 'vue'
import type { Ref } from 'vue'

const areUploadsOn = ref(true)
let asked = false

export const UPLOADS_OFF_NOTE = 'Uploading pictures and PDFs is switched off for now.'

export function useUploadsOn(): Ref<boolean> {
  if (!asked) {
    asked = true
    void fetch('/api/features')
      .then(async (response) => {
        // Only an explicit `false` turns them off; any other answer leaves them on.
        if (response.ok) areUploadsOn.value = ((await response.json()) as { uploads?: unknown }).uploads !== false
      })
      .catch(() => undefined)
  }
  return areUploadsOn
}
