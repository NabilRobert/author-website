<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import { fileUrl } from '@shared/files'
import BlockHeading from '@/components/ui/BlockHeading.vue'

// PDFs to download, like a CV or a portfolio: one link each, saved under
// the label the owner gave it.
defineProps<{ block: BlockOf<'downloads'> }>()
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <ul class="space-y-3 font-sans">
      <template v-for="file in block.files" :key="file.fileKey ?? file.label">
        <li v-if="file.fileKey">
          <a
            :href="fileUrl(file.fileKey, file.label)"
            download
            class="inline-flex items-center gap-3 rounded-md border border-line px-4 py-3 text-accent hover:underline"
          >
            <span aria-hidden="true" class="rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold text-paper"
              >PDF</span
            >
            {{ file.label }}
          </a>
        </li>
      </template>
    </ul>
  </section>
</template>
