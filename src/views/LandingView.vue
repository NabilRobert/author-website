<script setup lang="ts">
import { useHead } from '@unhead/vue'
import FramedShell from '@/components/layout/FramedShell.vue'

// What Framed is, for someone arriving at framed.my.id.
useHead({
  title: 'Framed: your work, framed',
  meta: [{ name: 'description', content: 'A portfolio page you design yourself, at framed.my.id/your-name.' }],
})

const FEATURES = [
  {
    title: 'Your own address',
    text: 'framed.my.id/your-name, to put on your CV, your social profiles and your business card.',
  },
  {
    title: 'Build it from blocks',
    text: 'Banners, text, pictures, lists, quotes and buttons, stacked the way you like.',
  },
  {
    title: 'Show your work',
    text: 'Projects, books, buildings or paintings, and your news, kept once and shown wherever you want them.',
  },
  {
    title: 'Make it look like you',
    text: 'Your colours, fonts and background pattern, with a live preview as you go.',
  },
]
</script>

<template>
  <FramedShell>
    <section class="py-12 text-center sm:py-20">
      <h1 class="font-heading text-5xl font-semibold sm:text-7xl">Your work, framed.</h1>
      <p class="mx-auto mt-6 max-w-xl text-xl text-panel-muted">
        A portfolio page you design yourself, for writers, designers, architects, artists and makers. Free.
      </p>
      <RouterLink
        to="/login"
        class="mt-10 inline-block rounded-md bg-action px-8 py-4 text-lg font-semibold text-panel hover:opacity-90"
        >Make your page</RouterLink
      >
    </section>
    <ul class="grid gap-4 sm:grid-cols-2">
      <li v-for="feature in FEATURES" :key="feature.title" class="rounded-lg border border-panel-line bg-panel p-6">
        <h2 class="text-lg font-semibold">{{ feature.title }}</h2>
        <p class="mt-2 text-panel-muted">{{ feature.text }}</p>
      </li>
    </ul>
  </FramedShell>
</template>
