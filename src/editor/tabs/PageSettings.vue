<script setup lang="ts">
import type { Page } from '@shared/schema'
import TextField from '@/editor/fields/TextField.vue'
import CheckboxField from '@/editor/fields/CheckboxField.vue'

// A page's name, address and whether it is in the menu. The front page's
// address can't change.
const page = defineModel<Page>({ required: true })
</script>

<template>
  <div class="space-y-4">
    <TextField v-model="page.title" label="Page name" hint="Shown in the menu and the browser tab." />
    <p v-if="page.slug === ''" class="text-panel-muted">This is the front page, at the site's main address.</p>
    <TextField
      v-else
      v-model="page.slug"
      label="Address"
      :hint="`The page will be at /${page.slug}. Lower-case letters, numbers and dashes only.`"
    />
    <CheckboxField v-if="page.slug !== ''" v-model="page.showInMenu" label="Show this page in the menu" />
  </div>
</template>
