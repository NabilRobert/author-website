<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Editor } from '@/editor/useEditor'
import { authClient } from '@/auth/authClient'

// The bar along the top of the editor: whether there are unsaved changes,
// the Save button, and what happened on the last save.
const props = defineProps<{ editor: Editor }>()
const { site, isDirty, isSaving, lastSave } = props.editor
const router = useRouter()

async function logOut() {
  await authClient.signOut()
  await router.push('/')
}
</script>

<template>
  <header class="shrink-0 border-b border-panel-line bg-panel">
    <div class="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
      <div>
        <h1 class="text-xl font-semibold">Edit your site</h1>
        <p class="text-sm text-panel-muted" role="status">
          {{ isDirty ? 'You have changes that are not saved yet.' : 'Everything is saved.' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot />
        <a :href="`/${site}`" target="_blank" class="rounded-md border border-panel-line px-4 py-3">View my page</a>
        <button type="button" class="rounded-md border border-panel-line px-4 py-3" @click="logOut">Log out</button>
        <button
          type="button"
          :disabled="isSaving || !isDirty"
          class="rounded-md bg-action px-6 py-3 text-lg font-semibold text-panel disabled:opacity-50"
          @click="editor.save()"
        >
          {{ isSaving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>
    <div v-if="lastSave" class="px-4 pb-3" role="alert">
      <p :class="lastSave.isSaved ? 'text-ok' : 'text-danger'" class="font-semibold">{{ lastSave.text }}</p>
      <ul v-if="!lastSave.isSaved && lastSave.problems.length" class="mt-1 list-disc pl-6 text-danger">
        <li v-for="(problem, index) in lastSave.problems" :key="index">
          <strong>{{ problem.location }}:</strong> {{ problem.message }}
        </li>
      </ul>
    </div>
  </header>
</template>
