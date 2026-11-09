<script setup lang="ts">
// The login page's main button: says what is happening while busy.
defineProps<{ isBusy: boolean; busyLabel: string }>()
</script>

<template>
  <button :disabled="isBusy" class="w-full rounded-md bg-action px-5 py-3 text-lg font-semibold text-panel">
    <template v-if="isBusy">{{ busyLabel }}</template>
    <slot v-else />
  </button>
</template>
