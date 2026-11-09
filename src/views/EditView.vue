<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { createEditor, DRAFT_KEY } from '@/editor/useEditor'
import { useWideScreen } from '@/composables/useWideScreen'
import EditorTopBar from '@/editor/EditorTopBar.vue'
import EditPanel from '@/editor/EditPanel.vue'
import PreviewPanel from '@/editor/PreviewPanel.vue'
import LayoutButtons from '@/editor/LayoutButtons.vue'

// The editor: the Save bar on top, then the forms and a live preview of the
// draft. On a wide screen they sit side by side with a divider to drag (all
// the way to one side hides the other); on a narrow one they stack.
const editor = createEditor()
const { draft, status, loadError, isStarter, isRestored, isDirty } = editor
provide(DRAFT_KEY, draft)
useHead({ title: 'Edit your site', meta: [{ name: 'robots', content: 'noindex' }] })

// Tailwind's lg breakpoint: below it there is no room for two columns.
const isWide = useWideScreen('64rem')
// The forms' share of the width, in percent.
const editorShare = ref(45)
const previewPageId = ref('')

// Preview the front page until the owner picks another.
watch(status, () => (previewPageId.value ||= draft.value.pages[0]?.id ?? ''))

// Leaving with unsaved changes asks first (the browser shows its own message).
function warnBeforeLeaving(event: BeforeUnloadEvent) {
  if (isDirty.value) event.preventDefault()
}
onMounted(() => {
  void editor.load()
  window.addEventListener('beforeunload', warnBeforeLeaving)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeLeaving))
</script>

<template>
  <!-- The editor keeps its own plain font; only the preview uses the theme. -->
  <div class="flex h-screen flex-col bg-panel-back font-sans text-panel-text [--font-heading:var(--font-sans)]">
    <p v-if="status === 'loading'" class="p-8 text-lg">Loading your site…</p>
    <div v-else-if="status === 'signed-out'" class="p-8 text-lg">
      <p>Your sign-in has expired.</p>
      <a href="/edit" class="mt-4 inline-block rounded-md bg-action px-6 py-3 font-semibold text-panel"
        >Sign in again</a
      >
    </div>
    <p v-else-if="status === 'failed'" class="p-8 text-lg text-danger" role="alert">{{ loadError }}</p>
    <template v-else>
      <EditorTopBar :editor="editor">
        <LayoutButtons v-if="isWide" v-model="editorShare" />
      </EditorTopBar>
      <p v-if="isRestored" class="shrink-0 bg-notice px-4 py-3" role="status">
        Your unsaved changes from last time are back. Press <strong>Save changes</strong> to publish them.
      </p>
      <p v-if="isStarter" class="shrink-0 bg-notice px-4 py-3">
        Your site is new, so this is example content. Change it to your own, then press <strong>Save changes</strong>
        to publish it.
      </p>
      <Splitpanes v-if="isWide" class="editor-split min-h-0 flex-1" @resized="editorShare = $event.panes[0]!.size">
        <Pane :size="editorShare" :min-size="0" class="overflow-y-auto">
          <EditPanel v-model:preview-page-id="previewPageId" />
        </Pane>
        <Pane :size="100 - editorShare" :min-size="0" class="overflow-y-auto">
          <PreviewPanel v-model:page-id="previewPageId" :content="draft" />
        </Pane>
      </Splitpanes>
      <div v-else class="min-h-0 flex-1 overflow-y-auto">
        <EditPanel v-model:preview-page-id="previewPageId" />
        <PreviewPanel v-model:page-id="previewPageId" :content="draft" />
      </div>
    </template>
  </div>
</template>

<style>
/* The divider between the forms and the preview: a wide, visible grip. */
.editor-split > .splitpanes__splitter {
  position: relative;
  width: 0.75rem;
  background: var(--color-panel-line);
  cursor: col-resize;
}
.editor-split > .splitpanes__splitter::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  width: 0.2rem;
  height: 2.5rem;
  border-radius: 1rem;
  background: var(--color-panel-muted);
  transform: translate(-50%, -50%);
}
.editor-split > .splitpanes__splitter:hover {
  background: var(--color-action);
}
</style>
