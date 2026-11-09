<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import type { Author } from '@shared/schema'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import LinkButtons from '@/components/ui/LinkButtons.vue'

// How to reach the author, from the "About you" tab: email, social links and
// the newsletter.
defineProps<{ block: BlockOf<'contact'>; author: Author }>()
</script>

<template>
  <BlockHeading :text="block.heading" />
  <div class="space-y-10">
    <section v-if="author.contactEmail">
      <h3 class="mb-2 text-2xl font-semibold">Email</h3>
      <a :href="`mailto:${author.contactEmail}`" class="text-xl text-accent underline">{{ author.contactEmail }}</a>
    </section>
    <section v-if="author.socialLinks.length">
      <h3 class="mb-3 text-2xl font-semibold">Elsewhere</h3>
      <LinkButtons :links="author.socialLinks" :label="`${author.name} online`" />
    </section>
    <section v-if="author.newsletterUrl">
      <h3 class="mb-2 text-2xl font-semibold">Newsletter</h3>
      <p class="prose-text mb-3">News about new books and events, straight to your inbox.</p>
      <LinkButtons :links="[{ label: 'Sign up to the newsletter', url: author.newsletterUrl }]" label="Newsletter" />
    </section>
  </div>
</template>
