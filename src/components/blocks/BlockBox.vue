<script setup lang="ts">
import { computed } from 'vue'
import type { BoxStyle } from '@shared/theme'
import { boxVariables, hasBoxFill } from '@/content/backgroundStyle'

// The box around a block, as the owner styled it: a fill colour and/or
// pattern on its own layer (so opacity fades the box, never the text), a
// text colour, and rounded or sharp corners. A plain style draws nothing.
const props = defineProps<{ boxStyle: BoxStyle }>()

const hasFill = computed(() => hasBoxFill(props.boxStyle))
const variables = computed(() => boxVariables(props.boxStyle))
</script>

<template>
  <div
    :style="variables"
    class="relative"
    :class="[hasFill ? 'p-6 @2xl:p-10' : '', boxStyle.text ? 'text-(--box-text)' : '']"
  >
    <div v-if="hasFill" aria-hidden="true" class="box-fill absolute inset-0" />
    <div class="relative"><slot /></div>
  </div>
</template>
