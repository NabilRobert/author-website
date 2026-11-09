<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteAccount } from '@/auth/account'
import { clearBackup } from '@/editor/draftBackup'

// "Delete my account": removes the account, the page and every picture at
// once. To be sure it is meant, the owner types their page's name first.
const props = defineProps<{ site: string }>()
const router = useRouter()
const typedName = ref('')
const problem = ref('')
const isDeleting = ref(false)

async function confirmDelete() {
  if (typedName.value.trim() !== props.site) {
    problem.value = `Type ${props.site} exactly to confirm.`
    return
  }
  isDeleting.value = true
  const isDeleted = await deleteAccount()
  isDeleting.value = false
  if (!isDeleted) return void (problem.value = 'Deleting failed. Check your connection and try again.')
  clearBackup(props.site)
  await router.push('/')
}
</script>

<template>
  <section class="space-y-3 rounded-md border border-danger bg-panel p-4">
    <h2 class="text-lg font-semibold">Delete my account</h2>
    <p class="text-sm text-panel-muted">
      This removes your account, your page at framed.my.id/{{ site }} and all your pictures, straight away. It can't be
      undone.
    </p>
    <label class="block text-sm font-semibold" for="confirm-delete">Type {{ site }} to confirm</label>
    <input id="confirm-delete" v-model="typedName" class="w-full rounded-md border border-panel-line p-3" />
    <button
      type="button"
      :disabled="isDeleting"
      class="rounded-md bg-danger px-4 py-2 font-semibold text-panel disabled:opacity-50"
      @click="confirmDelete"
    >
      {{ isDeleting ? 'Deleting…' : 'Delete everything' }}
    </button>
    <p v-if="problem" role="alert" class="text-sm font-semibold text-danger">{{ problem }}</p>
  </section>
</template>
