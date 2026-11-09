<script setup lang="ts">
import { FRAME_CLASSES } from '@/content/frames'
import { useDraft } from '@/editor/useEditor'
import AccountSection from '@/editor/tabs/AccountSection.vue'
import TextField from '@/editor/fields/TextField.vue'
import LinkListField from '@/editor/fields/LinkListField.vue'
import ImageField from '@/editor/fields/ImageField.vue'

// The profile's details, shown by the contact and press-kit blocks and used
// as the site's name and description.
const draft = useDraft()
defineProps<{ site: string }>()
</script>

<template>
  <div class="space-y-5">
    <TextField v-model="draft.profile.name" label="Your name" hint="Shown at the top of every page." />
    <TextField
      v-model="draft.profile.bioShort"
      label="Short bio"
      hint="Two or three sentences. Used in the press kit and by search engines."
      multiline
    />
    <ImageField
      v-model="draft.profile.photoKey"
      v-model:crop="draft.profile.photoCrop"
      :frame-class="FRAME_CLASSES.photo"
      label="Profile photo"
      hint="Offered for download in the press kit. Use a photo you have the rights to share."
    />
    <TextField v-model="draft.profile.contactEmail" label="Contact email" type="email" hint="Shown on the site." />
    <TextField
      v-model="draft.profile.newsletterUrl"
      label="Newsletter sign-up address"
      hint="The sign-up page from your mailing-list service. Leave empty if you have none."
    />
    <LinkListField
      v-model="draft.profile.socialLinks"
      label="Social links"
      add-label="Add a link"
      url-hint="The full address, starting with https://"
    />
    <AccountSection :site="site" />
  </div>
</template>
