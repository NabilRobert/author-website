<script setup lang="ts">
// Framed's mark, on every footer: people's sites, the editor's preview and
// Framed's own pages. It is fixed here, not part of anyone's content, so no
// editor setting can remove it (tests/site/credit.spec.ts checks each footer).
const BUILDER = { name: '@nabilrobert', url: 'https://github.com/NabilRobert' }
</script>

<template>
  <p data-framed-credit>
    Made with <RouterLink to="/" class="underline">Framed</RouterLink> by
    <a :href="BUILDER.url" rel="noopener" class="underline">{{ BUILDER.name }}</a>
  </p>
</template>
