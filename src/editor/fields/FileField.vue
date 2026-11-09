<script setup lang="ts">
import { ref } from 'vue'
import { FILE_TOO_BIG_MESSAGE, FILE_TYPE, FILE_WRONG_TYPE_MESSAGE, MAX_FILE_BYTES } from '@shared/files'
import { uploadFile } from '@/editor/editorApi'
import { UPLOADS_OFF_NOTE, useUploadsOn } from '@/editor/uploads'

// Upload a PDF and keep its key. The file is checked here first for a
// quick answer, and again by the API (server/file-routes.ts).
const fileKey = defineModel<string | null>({ required: true })
const isUploading = ref(false)
const problem = ref('')
const areUploadsOn = useUploadsOn()

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  problem.value = checkFile(file)
  if (problem.value) return
  isUploading.value = true
  const result = await uploadFile(file)
  isUploading.value = false
  if (result.isUploaded) fileKey.value = result.key
  else problem.value = result.message
}

function checkFile(file: File): string {
  if (file.type !== FILE_TYPE) return FILE_WRONG_TYPE_MESSAGE
  if (file.size > MAX_FILE_BYTES) return FILE_TOO_BIG_MESSAGE
  return ''
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <span v-if="fileKey" class="text-sm">PDF uploaded ✓</span>
    <p v-if="!areUploadsOn" class="rounded-md bg-notice px-3 py-2 text-sm">{{ UPLOADS_OFF_NOTE }}</p>
    <label
      v-else
      class="cursor-pointer rounded-md border border-action px-4 py-2 font-semibold text-action focus-within:ring-2 focus-within:ring-action"
    >
      {{ isUploading ? 'Uploading…' : fileKey ? 'Replace the PDF' : 'Upload a PDF' }}
      <input type="file" accept="application/pdf" class="sr-only" :disabled="isUploading" @change="onFileChosen" />
    </label>
    <p v-if="problem" role="alert" class="w-full text-sm font-semibold text-danger">{{ problem }}</p>
  </div>
</template>
