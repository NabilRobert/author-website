<script setup lang="ts">
import type { BlockType } from '@shared/blocks'

// A tiny sketch of what a block looks like, for the "Add a block" picker.
// Grey bars are text, blue shapes are buttons and pictures.
defineProps<{ type: BlockType }>()
</script>

<template>
  <svg viewBox="0 0 80 48" class="h-12 w-20 shrink-0 rounded border border-panel-line bg-panel-back" aria-hidden="true">
    <g class="fill-panel-line">
      <template v-if="type === 'hero'">
        <rect x="4" y="4" width="72" height="40" rx="2" />
        <rect x="20" y="13" width="40" height="6" class="fill-panel-muted" />
        <rect x="26" y="23" width="28" height="3" class="fill-panel-muted" />
        <rect x="31" y="31" width="18" height="6" rx="3" class="fill-action" />
      </template>
      <template v-else-if="type === 'text'">
        <rect x="8" y="8" width="34" height="5" class="fill-panel-muted" />
        <rect x="8" y="18" width="64" height="3" />
        <rect x="8" y="25" width="60" height="3" />
        <rect x="8" y="32" width="48" height="3" />
      </template>
      <template v-else-if="type === 'imageText'">
        <rect x="6" y="8" width="26" height="32" rx="2" class="fill-action opacity-60" />
        <rect x="38" y="10" width="30" height="4" class="fill-panel-muted" />
        <rect x="38" y="19" width="36" height="3" />
        <rect x="38" y="26" width="32" height="3" />
        <rect x="38" y="33" width="26" height="3" />
      </template>
      <template v-else-if="type === 'gallery'">
        <template v-for="row in 2" :key="row">
          <rect
            v-for="column in 3"
            :key="column"
            :x="column * 24 - 18"
            :y="row * 20 - 15"
            width="20"
            height="17"
            rx="1"
            class="fill-action opacity-60"
          />
        </template>
      </template>
      <template v-else-if="type === 'list'">
        <template v-for="row in 3" :key="row">
          <circle cx="12" :cy="6 + row * 9" r="2" class="fill-panel-muted" />
          <rect x="18" :y="4.5 + row * 9" :width="56 - row * 8" height="3" />
        </template>
      </template>
      <template v-else-if="type === 'quote'">
        <circle cx="10" cy="15" r="3" class="fill-panel-muted" />
        <circle cx="17" cy="15" r="3" class="fill-panel-muted" />
        <rect x="18" y="16" width="48" height="4" class="fill-panel-muted" />
        <rect x="22" y="24" width="40" height="4" class="fill-panel-muted" />
        <rect x="30" y="34" width="20" height="3" />
      </template>
      <template v-else-if="type === 'buttons'">
        <rect x="6" y="19" width="20" height="9" rx="4.5" class="fill-action" />
        <rect x="30" y="19" width="20" height="9" rx="4.5" class="fill-action" />
        <rect x="54" y="19" width="20" height="9" rx="4.5" class="fill-action" />
      </template>
      <template v-else-if="type === 'works'">
        <rect x="8" y="6" width="22" height="34" rx="1" class="fill-panel-muted" />
        <rect x="36" y="8" width="32" height="5" class="fill-panel-muted" />
        <rect x="36" y="18" width="36" height="3" />
        <rect x="36" y="25" width="30" height="3" />
        <rect x="36" y="33" width="14" height="5" rx="2.5" class="fill-action" />
      </template>
      <template v-else-if="type === 'news'">
        <template v-for="row in 2" :key="row">
          <rect x="8" :y="row * 20 - 14" width="16" height="2.5" class="fill-action" />
          <rect x="8" :y="row * 20 - 9" width="40" height="4" class="fill-panel-muted" />
          <rect x="8" :y="row * 20 - 2" width="62" height="3" />
        </template>
      </template>
      <template v-else-if="type === 'contact'">
        <rect x="8" y="10" width="22" height="15" rx="1" class="fill-panel-muted" />
        <path d="M8 10 L19 19 L30 10" class="fill-none stroke-panel-back" stroke-width="1.5" />
        <rect x="36" y="14" width="34" height="4" />
        <rect x="8" y="32" width="18" height="7" rx="3.5" class="fill-action" />
        <rect x="30" y="32" width="18" height="7" rx="3.5" class="fill-action" />
      </template>
      <template v-else>
        <rect x="6" y="6" width="68" height="8" rx="1" />
        <rect
          v-for="card in 4"
          :key="card"
          :x="card * 17 - 11"
          y="19"
          width="13"
          height="22"
          rx="1"
          class="fill-panel-muted"
        />
      </template>
    </g>
  </svg>
</template>
