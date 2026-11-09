<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { PASSWORD_TOO_SHORT } from '@shared/passwords'
import { useLogin } from '@/auth/useLogin'
import FramedShell from '@/components/layout/FramedShell.vue'
import AuthField from '@/components/auth/AuthField.vue'
import SubmitButton from '@/components/auth/SubmitButton.vue'

// Log in, make an account, or reset a forgotten password (src/auth/useLogin.ts).
const route = useRoute()
// Only a path on this site, so a link can't send people elsewhere afterwards.
const next = computed(() => {
  const target = String(route.query.next ?? '')
  return target.startsWith('/') && !target.startsWith('//') ? target : null
})
const login = useLogin(next.value, String(route.query.invite ?? ''))
const { step, email, password, code, name, problem, isBusy, goTo, invite, isInviteOnly } = login
useHead({ title: 'Log in · Framed' })

const LINK = 'text-sm text-action underline'
const CODE_BOX = 'text-center font-mono text-2xl tracking-[0.5em]'
</script>

<template>
  <FramedShell>
    <div class="mx-auto max-w-md rounded-lg border border-panel-line bg-panel p-8">
      <form v-if="step === 'log-in'" class="space-y-4" @submit.prevent="login.logIn">
        <h1 class="text-2xl font-semibold">Log in</h1>
        <AuthField id="login-email" v-model="email" label="Your email" type="email" autocomplete="email" required />
        <AuthField
          id="login-password"
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          required
        />
        <SubmitButton :is-busy="isBusy" busy-label="Logging in…">Log in</SubmitButton>
        <div class="flex flex-wrap justify-between gap-2">
          <button type="button" :class="LINK" @click="goTo('forgot')">Forgot your password?</button>
          <button type="button" :class="LINK" @click="goTo('sign-up')">New here? Make an account</button>
        </div>
      </form>

      <form v-else-if="step === 'sign-up'" class="space-y-4" @submit.prevent="login.signUp">
        <h1 class="text-2xl font-semibold">Make your account</h1>
        <p class="text-panel-muted">We'll email you a 6-digit code to confirm the address.</p>
        <AuthField
          v-if="isInviteOnly"
          id="login-invite"
          v-model="invite"
          label="Invite code"
          hint="Framed is invite-only for now. It's in the link you were sent."
          autocomplete="off"
          required
        />
        <AuthField id="login-email" v-model="email" label="Your email" type="email" autocomplete="email" required />
        <AuthField
          id="login-password"
          v-model="password"
          label="Choose a password"
          :hint="PASSWORD_TOO_SHORT"
          type="password"
          autocomplete="new-password"
          required
        />
        <SubmitButton :is-busy="isBusy" busy-label="Making it…">Make my account</SubmitButton>
        <button type="button" :class="LINK" @click="goTo('log-in')">Already have an account? Log in</button>
      </form>

      <form v-else-if="step === 'confirm'" class="space-y-4" @submit.prevent="login.confirmEmail">
        <h1 class="text-2xl font-semibold">Check your email</h1>
        <p class="text-panel-muted">We sent a 6-digit code to {{ email }}. It works for 10 minutes.</p>
        <AuthField
          id="login-code"
          v-model="code"
          label="The code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          required
          :class="CODE_BOX"
        />
        <SubmitButton :is-busy="isBusy" busy-label="Checking…">Confirm my email</SubmitButton>
        <button type="button" :class="LINK" @click="login.resendConfirmCode">Send a new code</button>
      </form>

      <form v-else-if="step === 'forgot'" class="space-y-4" @submit.prevent="login.requestReset">
        <h1 class="text-2xl font-semibold">Reset your password</h1>
        <p class="text-panel-muted">We'll email you a 6-digit code to choose a new one.</p>
        <AuthField id="login-email" v-model="email" label="Your email" type="email" autocomplete="email" required />
        <SubmitButton :is-busy="isBusy" busy-label="Sending…">Email me a code</SubmitButton>
        <button type="button" :class="LINK" @click="goTo('log-in')">Back to logging in</button>
      </form>

      <form v-else-if="step === 'reset'" class="space-y-4" @submit.prevent="login.resetPassword">
        <h1 class="text-2xl font-semibold">Choose a new password</h1>
        <p class="text-panel-muted">If {{ email }} has an account, we sent it a 6-digit code.</p>
        <AuthField
          id="login-code"
          v-model="code"
          label="The code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          required
          :class="CODE_BOX"
        />
        <AuthField
          id="login-password"
          v-model="password"
          label="New password"
          :hint="PASSWORD_TOO_SHORT"
          type="password"
          autocomplete="new-password"
          required
        />
        <SubmitButton :is-busy="isBusy" busy-label="Saving…">Save it and log in</SubmitButton>
        <button type="button" :class="LINK" @click="login.requestReset">Send a new code</button>
      </form>

      <form v-else class="space-y-4" @submit.prevent="login.pickName">
        <h1 class="text-2xl font-semibold">Pick your page's address</h1>
        <p class="text-panel-muted">This is the link you'll share. Letters, numbers and dashes.</p>
        <label class="block font-semibold" for="login-name">Your address</label>
        <div class="flex items-center rounded-md border border-panel-line">
          <span class="pl-3 text-panel-muted">framed.my.id/</span>
          <input id="login-name" v-model="name" required class="w-full p-3 text-base" placeholder="your-name" />
        </div>
        <SubmitButton :is-busy="isBusy" busy-label="Saving…">Make my page</SubmitButton>
      </form>

      <p v-if="problem" role="alert" class="mt-4 font-semibold text-danger">{{ problem }}</p>
    </div>
  </FramedShell>
</template>
