<script setup lang="ts">
import { useHead } from '@unhead/vue'
import FramedShell from '@/components/layout/FramedShell.vue'

// The rules, in plain words. A draft for Arthur to review before launch.
useHead({ title: 'Terms · Framed' })
</script>

<template>
  <FramedShell>
    <article class="mx-auto max-w-2xl space-y-4 leading-relaxed">
      <h1 class="text-3xl font-semibold">Terms</h1>
      <p class="rounded-md bg-notice p-3 text-sm">Draft, to be reviewed before Framed opens to the public.</p>
      <p>Framed is a free service for showing your work on a page you design. By using it you agree to these rules.</p>
      <h2 class="text-xl font-semibold">What you can put on your page</h2>
      <p>
        Only things you have the right to share. No content that is illegal in Indonesia, that harms or harasses others,
        that pretends to be someone else, or that tries to trick visitors (for example asking for passwords or
        payments).
      </p>
      <h2 class="text-xl font-semibold">Reports and removal</h2>
      <p>Anyone can report a page. A page that breaks these rules may be hidden or removed, and its account closed.</p>
      <h2 class="text-xl font-semibold">Your content stays yours</h2>
      <p>You keep the rights to what you upload. You allow Framed to store it and show it on your page.</p>
      <h2 class="text-xl font-semibold">No guarantees</h2>
      <p>Framed is offered as it is, and may change or stop. Keep your own copies of anything important.</p>
    </article>
  </FramedShell>
</template>
