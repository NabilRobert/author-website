<script setup lang="ts">
import { useHead } from '@unhead/vue'
import FramedShell from '@/components/layout/FramedShell.vue'

// What Framed keeps about people, and why, in plain words (Indonesia's
// personal data protection law, UU PDP). A draft for Arthur to quote.
useHead({ title: 'Privacy · Framed' })
</script>

<template>
  <FramedShell>
    <article class="mx-auto max-w-2xl space-y-4 leading-relaxed">
      <h1 class="text-3xl font-semibold">Privacy</h1>
      <p class="rounded-md bg-notice p-3 text-sm">Draft, to be reviewed before Framed opens to the public.</p>
      <h2 class="text-xl font-semibold">What we keep</h2>
      <ul class="list-disc space-y-1 pl-6">
        <li>Your email address, to log you in and to send you codes to confirm it or reset your password.</li>
        <li>
          Your password, only scrambled (hashed) so that nobody, including us, can read it. When you choose one, we
          check it against Have I Been Pwned's list of leaked passwords; only the first 5 characters of a scrambled copy
          are sent, never the password.
        </li>
        <li>Your page and the pictures you upload, to show them to visitors.</li>
        <li>Your login sessions (which device, until when), so you stay logged in for up to a week.</li>
      </ul>
      <h2 class="text-xl font-semibold">What we don't do</h2>
      <p>
        No ads, no tracking, no selling or sharing your data. Codes are emailed through Resend, an email service. A
        video on a page loads from YouTube (without its tracking cookies) or Vimeo (with do-not-track) only when a
        visitor presses play. A message sent through a page's contact form is emailed to the page's owner and not kept;
        to stop floods of messages we keep a scrambled stand-in for the sender's internet address, and the time, for one
        day.
      </p>
      <h2 class="text-xl font-semibold">Where it is kept</h2>
      <p>On Cloudflare's servers. Emailed codes are stored scrambled (hashed) and expire after 10 minutes.</p>
      <h2 class="text-xl font-semibold">Deleting everything</h2>
      <p>
        In your editor, under "About you", choose "Delete my account". Your account, page and pictures are removed at
        once. Backups disappear within 7 days.
      </p>
    </article>
  </FramedShell>
</template>
