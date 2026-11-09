<script setup lang="ts">
import type { Work } from '@shared/schema'
import { WORK_SHAPE_CLASSES } from '@/content/frames'
import { useDraft } from '@/editor/useEditor'
import TextField from '@/editor/fields/TextField.vue'
import ImageField from '@/editor/fields/ImageField.vue'
import LinkListField from '@/editor/fields/LinkListField.vue'
import QuoteListField from '@/editor/tabs/QuoteListField.vue'

// The details of one piece of work (a book, a building, a painting, an
// app): what lists show and what tops its page. The cover's shape is
// chosen for all work in the Look tab. Part of WorkEditor.
const work = defineModel<Work>({ required: true })
const draft = useDraft()
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="work.title" label="Title" />
    <TextField
      v-model="work.subtitle"
      label="Line under the title"
      hint='Optional, like "House, Jakarta", "Novel" or "Oil on canvas".'
    />
    <ImageField
      v-model="work.imageKey"
      v-model:crop="work.imageCrop"
      :frame-class="WORK_SHAPE_CLASSES[draft.theme.workShape]"
      label="Cover picture"
      hint="Shown in lists of your work and at the top of its page. Until you add one, the site shows a plain card with the title. Its shape is set in the Look tab."
    />
    <TextField
      v-model="work.group"
      label="Group"
      hint="Optional: a series, collection or client. Works with the same group placed next to each other share a heading."
    />
    <TextField v-model="work.date" label="Date" type="date" hint="Optional." />
    <TextField
      v-model="work.description"
      label="Description"
      hint="Leave a blank line to start a new paragraph."
      multiline
    />
    <LinkListField
      v-model="work.links"
      label="Links"
      add-label="Add a link"
      url-hint="Like where to buy it, the live site, a video or the code, starting with https://"
    />
    <QuoteListField v-model="work.quotes" />
  </div>
</template>
