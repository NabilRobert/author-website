<script setup lang="ts">
import { reactive, ref, useId } from 'vue'
import type { BlockOf } from '@shared/blocks'
import { contactMessageSchema } from '@shared/contact'
import { paragraphs } from '@shared/text'
import BlockHeading from '@/components/ui/BlockHeading.vue'
import { useSiteName } from '@/content/sitePath'

// A form visitors use to email the owner (server/contact-messages.ts). The
// hidden "website" field is a trap for bots: people never see or fill it.
// In the editor's preview there is no site name, so nothing is sent.
defineProps<{ block: BlockOf<'contactForm'> }>()
const siteName = useSiteName()
const id = useId()
const fields = reactive({ name: '', email: '', message: '', website: '' })
const state = ref<'writing' | 'sending' | 'sent'>('writing')
const problem = ref('')

async function send() {
  const checked = contactMessageSchema.safeParse(fields)
  if (!checked.success) return void (problem.value = checked.error.issues[0]?.message ?? '')
  if (!siteName) return void (problem.value = 'Messages are sent from your published page, not the preview.')
  problem.value = ''
  state.value = 'sending'
  const response = await fetch(`/api/sites/${siteName}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checked.data),
  }).catch(() => null)
  if (response?.ok) return void (state.value = 'sent')
  state.value = 'writing'
  const body = (await response?.json().catch(() => null)) as { error?: string } | null
  problem.value = body?.error ?? "The message couldn't be sent. Check your connection and try again."
}

const FIELD = 'mt-1 w-full rounded-sm border border-line bg-paper p-3 font-sans text-base text-ink'
</script>

<template>
  <section>
    <BlockHeading :text="block.heading" />
    <div class="prose-text mb-6">
      <p v-for="(paragraph, index) in paragraphs(block.intro)" :key="index">{{ paragraph }}</p>
    </div>
    <p v-if="state === 'sent'" role="status" class="font-sans text-lg">
      Thank you. Your message is on its way, and they can reply to your email.
    </p>
    <form v-else class="max-w-xl space-y-4 font-sans" novalidate @submit.prevent="send">
      <div>
        <label :for="`${id}-name`" class="block font-semibold">Your name</label>
        <input :id="`${id}-name`" v-model="fields.name" autocomplete="name" required :class="FIELD" />
      </div>
      <div>
        <label :for="`${id}-email`" class="block font-semibold">Your email</label>
        <input :id="`${id}-email`" v-model="fields.email" type="email" autocomplete="email" required :class="FIELD" />
      </div>
      <div>
        <label :for="`${id}-message`" class="block font-semibold">Message</label>
        <textarea :id="`${id}-message`" v-model="fields.message" rows="6" required :class="FIELD" />
      </div>
      <div class="hidden" aria-hidden="true">
        <label :for="`${id}-website`">Leave this empty</label>
        <input :id="`${id}-website`" v-model="fields.website" tabindex="-1" autocomplete="off" />
      </div>
      <button
        :disabled="state === 'sending'"
        class="rounded-full bg-button px-6 py-3 font-semibold text-button-text hover:opacity-85 disabled:opacity-60"
      >
        {{ state === 'sending' ? 'Sending…' : 'Send message' }}
      </button>
      <p v-if="problem" role="alert" class="font-semibold text-danger">{{ problem }}</p>
    </form>
  </section>
</template>
