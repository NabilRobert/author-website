<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import type { Profile } from '@shared/schema'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'

// How to reach the profile, from the "About you" tab: email, social links and
// the newsletter.
defineProps<{ block: BlockOf<'contact'>; profile: Profile }>()
</script>

<template>
  <BlockHeading :text="block.heading" />
  <div class="space-y-10">
    <section v-if="profile.contactEmail">
      <h3 class="mb-2 text-2xl font-semibold">Email</h3>
      <a :href="`mailto:${profile.contactEmail}`" class="text-xl text-accent underline">{{ profile.contactEmail }}</a>
    </section>
    <section v-if="profile.socialLinks.length">
      <h3 class="mb-3 text-2xl font-semibold">Elsewhere</h3>
      <LinkButtons :links="profile.socialLinks" :label="`${profile.name} online`" />
    </section>
    <section v-if="profile.newsletterUrl">
      <h3 class="mb-2 text-2xl font-semibold">Newsletter</h3>
      <p class="prose-text mb-3">News about new work and events, straight to your inbox.</p>
      <LinkButtons :links="[{ label: 'Sign up to the newsletter', url: profile.newsletterUrl }]" label="Newsletter" />
    </section>
  </div>
</template>
