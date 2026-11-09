<script setup lang="ts">
import type { BlockOf } from '@shared/blocks'
import TextField from '@/editor/fields/TextField.vue'

// A contact form's heading and the words above it. The fields visitors fill
// in are fixed: name, email and message.
const block = defineModel<BlockOf<'contactForm'>>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <p class="rounded-md bg-notice p-3 text-sm">
      Messages are emailed to the address you log in with, with the visitor's email to reply to. They aren't stored on
      Framed.
    </p>
    <TextField v-model="block.heading" label="Heading" hint="Optional." />
    <TextField v-model="block.intro" label="Words above the form" hint="Optional." multiline />
  </div>
</template>
