<script setup lang="ts">
// Framed's own pages (landing, login, terms, privacy): its name, a login
// link, and the small print. People's sites use SiteLayout instead.
</script>

<template>
  <div class="flex min-h-screen flex-col bg-panel-back font-sans text-panel-text">
    <header class="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6">
      <RouterLink to="/" class="font-heading text-2xl font-semibold">Framed</RouterLink>
      <RouterLink to="/login" class="rounded-md border border-panel-line bg-panel px-4 py-2 font-semibold"
        >Log in</RouterLink
      >
    </header>
    <main class="mx-auto w-full max-w-5xl flex-1 px-5 py-8"><slot /></main>
    <footer class="mx-auto flex w-full max-w-5xl flex-wrap gap-x-6 gap-y-2 px-5 py-8 text-sm text-panel-muted">
      <RouterLink to="/terms" class="underline">Terms</RouterLink>
      <RouterLink to="/privacy" class="underline">Privacy</RouterLink>
      <span>Made by <a href="https://github.com/NabilRobert" rel="noopener" class="underline">@nabilrobert</a></span>
    </footer>
  </div>
</template>
