<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useLogin } from '@/auth/useLogin'
import FramedShell from '@/components/layout/FramedShell.vue'

// Log in or sign up: the same three steps for both. Nobody has a password.
const route = useRoute()
// Only a path on this site, so a link can't send people elsewhere afterwards.
const next = computed(() => {
  const target = String(route.query.next ?? '')
  return target.startsWith('/') && !target.startsWith('//') ? target : null
})
const { step, email, code, name, problem, isBusy, sendCode, checkCode, pickName } = useLogin(next.value)
useHead({ title: 'Log in · Framed' })
</script>

<template>
  <FramedShell>
    <div class="mx-auto max-w-md rounded-lg border border-panel-line bg-panel p-8">
      <form v-if="step === 'email'" class="space-y-4" @submit.prevent="sendCode">
        <h1 class="text-2xl font-semibold">Log in or sign up</h1>
        <p class="text-panel-muted">We'll email you a 6-digit code. No password needed.</p>
        <label class="block font-semibold" for="login-email">Your email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          class="w-full rounded-md border border-panel-line p-3 text-base"
        />
        <button :disabled="isBusy" class="w-full rounded-md bg-action px-5 py-3 text-lg font-semibold text-panel">
          {{ isBusy ? 'Sending…' : 'Email me a code' }}
        </button>
      </form>

      <form v-else-if="step === 'code'" class="space-y-4" @submit.prevent="checkCode">
        <h1 class="text-2xl font-semibold">Check your email</h1>
        <p class="text-panel-muted">We sent a 6-digit code to {{ email }}. It works for 10 minutes.</p>
        <label class="block font-semibold" for="login-code">The code</label>
        <input
          id="login-code"
          v-model="code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          required
          class="w-full rounded-md border border-panel-line p-3 text-center font-mono text-2xl tracking-[0.5em]"
        />
        <button :disabled="isBusy" class="w-full rounded-md bg-action px-5 py-3 text-lg font-semibold text-panel">
          {{ isBusy ? 'Checking…' : 'Log in' }}
        </button>
        <button type="button" class="text-sm text-action underline" @click="step = 'email'">
          Use another email, or send a new code
        </button>
      </form>

      <form v-else class="space-y-4" @submit.prevent="pickName">
        <h1 class="text-2xl font-semibold">Pick your page's address</h1>
        <p class="text-panel-muted">This is the link you'll share. Letters, numbers and dashes.</p>
        <label class="block font-semibold" for="login-name">Your address</label>
        <div class="flex items-center rounded-md border border-panel-line">
          <span class="pl-3 text-panel-muted">framed.my.id/</span>
          <input id="login-name" v-model="name" required class="w-full p-3 text-base" placeholder="your-name" />
        </div>
        <button :disabled="isBusy" class="w-full rounded-md bg-action px-5 py-3 text-lg font-semibold text-panel">
          {{ isBusy ? 'Saving…' : 'Make my page' }}
        </button>
      </form>

      <p v-if="problem" role="alert" class="mt-4 font-semibold text-danger">{{ problem }}</p>
    </div>
  </FramedShell>
</template>
