<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import type { SiteContent } from '@shared/schema'
import { imageUrl } from '@shared/images'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import WorkPicture from '@/components/works/WorkPicture.vue'
import FramedImage from '@/components/ui/FramedImage.vue'
import { PICTURE_CORNER_CLASSES, WORK_SHAPE_CLASSES } from '@/content/frames'

// For journalists, clients and event organisers: a photo and pictures of
// the work to download (the whole original files, not the crops), and a
// short bio to copy. The photo and the pictures of work each take the
// block's shapes; both take its corners.
defineProps<{ block: BlockOf<'pressKit'>; content: SiteContent }>()
</script>

<template>
  <BlockHeading :text="block.heading" />
  <div class="space-y-12">
    <section>
      <h3 class="mb-3 text-2xl font-semibold">Short bio</h3>
      <p class="prose-text rounded-sm bg-paper-deep p-5">{{ content.profile.bioShort }}</p>
    </section>
    <section v-if="content.profile.photoKey">
      <h3 class="mb-3 text-2xl font-semibold">Profile photo</h3>
      <a :href="imageUrl(content.profile.photoKey)" download class="inline-block">
        <span
          class="block w-48 overflow-hidden shadow-md"
          :class="[WORK_SHAPE_CLASSES[block.photoShape], PICTURE_CORNER_CLASSES[block.pictureCorners]]"
        >
          <FramedImage
            :image-key="content.profile.photoKey"
            :crop="content.profile.photoCrop"
            :alt="`Photo of ${content.profile.name}`"
          />
        </span>
        <span class="mt-2 block font-sans text-accent underline">Download photo</span>
      </a>
    </section>
    <section v-if="content.works.length">
      <h3 class="mb-3 text-2xl font-semibold">Pictures of my work</h3>
      <ul class="grid grid-cols-2 gap-6 @2xl:grid-cols-4">
        <li v-for="work in content.works" :key="work.id">
          <WorkPicture
            :title="work.title"
            :owner-name="content.profile.name"
            :image-key="work.imageKey"
            :image-crop="work.imageCrop"
            :shape="block.pictureShape || content.theme.workShape"
            :corners="block.pictureCorners"
          />
          <a
            v-if="work.imageKey"
            :href="imageUrl(work.imageKey)"
            download
            class="mt-2 block font-sans text-accent underline"
            >Download picture</a
          >
          <p v-else class="mt-2 font-sans text-sm text-muted">Picture coming soon</p>
        </li>
      </ul>
    </section>
  </div>
</template>
