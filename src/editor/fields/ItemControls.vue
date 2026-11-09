<script setup lang="ts">
// Move up, move down and remove buttons for one item in a list. Removing
// asks first, naming what will go.
const props = defineProps<{ itemName: string; isFirst: boolean; isLast: boolean }>()
const emit = defineEmits<{ move: [offset: -1 | 1]; remove: [] }>()

function confirmRemove() {
  if (
    window.confirm(`Remove ${props.itemName}? Undo brings it back, and nothing changes on the site until you save.`)
  ) {
    emit('remove')
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      :disabled="isFirst"
      :aria-label="`Move ${itemName} up`"
      class="rounded-md border border-panel-line bg-panel px-3 py-2 text-sm disabled:opacity-40"
      @click="emit('move', -1)"
    >
      ↑ Up
    </button>
    <button
      type="button"
      :disabled="isLast"
      :aria-label="`Move ${itemName} down`"
      class="rounded-md border border-panel-line bg-panel px-3 py-2 text-sm disabled:opacity-40"
      @click="emit('move', 1)"
    >
      ↓ Down
    </button>
    <button
      type="button"
      :aria-label="`Remove ${itemName}`"
      class="rounded-md border border-danger px-3 py-2 text-sm text-danger"
      @click="confirmRemove"
    >
      Remove
    </button>
  </div>
</template>
