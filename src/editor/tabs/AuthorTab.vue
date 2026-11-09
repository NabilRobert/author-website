<script setup lang="ts">
import { useDraft } from '@/editor/useEditor'
import TextField from '@/editor/fields/TextField.vue'
import LinkListField from '@/editor/fields/LinkListField.vue'

// The author's details, shown by the contact and press-kit blocks and used
// as the site's name and description.
const draft = useDraft()
</script>

<template>
  <div class="space-y-5">
    <TextField v-model="draft.author.name" label="Your name" hint="Shown at the top of every page." />
    <TextField
      v-model="draft.author.bioShort"
      label="Short bio"
      hint="Two or three sentences. Used in the press kit and by search engines."
      multiline
    />
    <TextField v-model="draft.author.contactEmail" label="Contact email" type="email" hint="Shown on the site." />
    <TextField
      v-model="draft.author.newsletterUrl"
      label="Newsletter sign-up address"
      hint="The sign-up page from your mailing-list service. Leave empty if you have none."
    />
    <LinkListField
      v-model="draft.author.socialLinks"
      label="Social links"
      add-label="Add a link"
      url-hint="The full address, starting with https://"
    />
  </div>
</template>
