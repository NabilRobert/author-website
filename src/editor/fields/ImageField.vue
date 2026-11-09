<script setup lang="ts">
import { ref, useId } from 'vue'
import { isImageType, MAX_IMAGE_BYTES, TOO_BIG_MESSAGE, WRONG_TYPE_MESSAGE } from '@shared/images'
import { imageUrl } from '@/content/format'
import { uploadImage } from '@/editor/editorApi'
import { centredCrop } from '@shared/fields'
import type { ImageCrop } from '@shared/fields'
import type { FrameShape } from '@/content/frames'
import ImageCropper from '@/editor/fields/ImageCropper.vue'

// Pick a picture, upload it, and keep its key; or remove it. The file is
// checked here first for a quick answer, and again by the API. With a
// `shape` and a crop (v-model:crop), the picture can be cropped to its frame.
defineProps<{ label: string; hint?: string; shape?: FrameShape }>()
const imageKey = defineModel<string | null>({ required: true })
const crop = defineModel<ImageCrop>('crop')
const id = useId()
const isUploading = ref(false)
const problem = ref('')

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  problem.value = checkFile(file)
  if (problem.value) return
  isUploading.value = true
  const result = await uploadImage(file)
  isUploading.value = false
  if (!result.isUploaded) {
    problem.value = result.message
    return
  }
  imageKey.value = result.key
  // A new picture starts centred, not with the old picture's crop.
  if (crop.value) crop.value = centredCrop()
}

function checkFile(file: File): string {
  if (!isImageType(file.type)) return WRONG_TYPE_MESSAGE
  if (file.size > MAX_IMAGE_BYTES) return TOO_BIG_MESSAGE
  return ''
}
</script>

<template>
  <div>
    <p :id="`${id}-label`" class="font-semibold">{{ label }}</p>
    <p v-if="hint" class="text-sm text-panel-muted">{{ hint }}</p>
    <div v-if="imageKey && shape && crop" class="mt-2">
      <ImageCropper v-model="crop" :image-key="imageKey" :shape="shape" />
    </div>
    <img
      v-else-if="imageKey"
      :src="imageUrl(imageKey)"
      alt="The current picture"
      class="mt-2 max-h-40 rounded-md border border-panel-line"
    />
    <div class="mt-2 flex flex-wrap gap-2">
      <label
        :for="id"
        class="cursor-pointer rounded-md border border-action px-4 py-2 font-semibold text-action focus-within:outline focus-within:outline-3"
      >
        {{ isUploading ? 'Uploading…' : imageKey ? 'Replace the picture' : 'Upload a picture' }}
        <input
          :id="id"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          :disabled="isUploading"
          :aria-describedby="`${id}-label`"
          @change="onFileChosen"
        />
      </label>
      <button
        v-if="imageKey"
        type="button"
        class="rounded-md border border-danger px-4 py-2 text-danger"
        @click="imageKey = null"
      >
        Remove the picture
      </button>
    </div>
    <p v-if="problem" role="alert" class="mt-2 font-semibold text-danger">{{ problem }}</p>
  </div>
</template>
