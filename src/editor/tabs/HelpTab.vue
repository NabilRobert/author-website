<script setup lang="ts">
// "Help": short how-tos for the editor, one per task, in the words the
// editor's own buttons use. Update this when a button or tab is renamed.
interface HowTo {
  title: string
  steps: string[]
}

const HOW_TOS: HowTo[] = [
  {
    title: 'Change something on your page',
    steps: [
      'Click it in the preview on the right. Its form opens on the left, outlined in blue.',
      'Type your change. The preview updates as you type.',
      'Press Save changes (top right) to publish it. Until then, only you can see it.',
    ],
  },
  {
    title: 'Add a page',
    steps: [
      'In the Pages tab, press + Add a page.',
      'Choose a layout, such as About me or Gallery. Each card sketches its blocks.',
      'Under Page settings, change its name, its address and "Show this page in the menu".',
    ],
  },
  {
    title: 'Add, move and remove blocks',
    steps: [
      'Pages are made of blocks: a banner, text, a picture gallery, a video, a list and so on.',
      'For a video, paste its YouTube or Vimeo link into a Video block.',
      'To offer your CV or a portfolio PDF, add a Downloads block and upload the PDF (up to 10 MB).',
      'A Contact form block lets visitors email you; messages arrive at the email you log in with.',
      'Pick one under "Add a block to this page" at the bottom of the page’s blocks.',
      'Up and Down move a block; Remove takes it away.',
      'The ▾ button folds a block away, and Minimise all folds them all, to see the order at a glance.',
      'Box style (under each block) gives it a colour, a pattern, see-through-ness and corners.',
    ],
  },
  {
    title: 'Show your work, each with its own page',
    steps: [
      'The Work tab lists your work in the order your site shows it. Drag the ⠿ handle, or use Up and Down.',
      'Press Open to edit a work and its page together: details, cover, more pictures and extra blocks.',
      'More pictures appear as a gallery on its page. Visitors click one to see it full size.',
      'Untick "Show a page for this work" if it shouldn’t have a page.',
      'To start a new one from a layout, press + Add a project in the Pages tab.',
    ],
  },
  {
    title: 'Add and crop pictures',
    steps: [
      'Press Upload a picture and choose a JPG, PNG or WebP of up to 5 MB.',
      'Drag the picture inside its frame to choose what shows, and use the zoom slider.',
      'Your original is kept whole; visitors who open a gallery picture see all of it.',
    ],
  },
  {
    title: 'Change the look',
    steps: [
      'The Look tab sets the colours, the fonts and the background: a colour, a pattern or a picture.',
      'Over a picture or a strong pattern, the content sits in a box you can colour, make see-through or stretch edge to edge.',
      'No colour leaves a box, a pattern part or a banner see-through.',
      'A warning appears if text would be hard to read on its background.',
    ],
  },
  {
    title: 'Reuse a page you like',
    steps: [
      'Under a page’s settings (or a work’s page), press Save as a layout and name it.',
      'It then appears with the other layouts when you add a page or a project.',
      'Remove it from the layout list when you no longer need it. Pages made from it stay as they are.',
    ],
  },
  {
    title: 'Undo, preview and save',
    steps: [
      'Undo and Redo (top) step back and forward through your changes since the last save.',
      'Editor only, Side by side and Preview only change the view; drag the bar between them to resize.',
      'The Page menu above the preview shows any page, including your work’s pages.',
      'Unsaved changes are kept on this computer if you close the tab; they come back next time.',
      'Done takes you to your page as visitors see it.',
      'The Visits tab shows how many people looked at your pages in the last 30 days (your own visits don’t count).',
    ],
  },
  {
    title: 'Your account',
    steps: [
      'Forgot your password? On the login page, press "Forgot your password?" and we’ll email you a code.',
      'Your name, short bio, photo, email and social links are in the About you tab.',
      'At the bottom of About you, "Delete my account" (the Delete everything button) removes your account, page and pictures for good.',
    ],
  },
]
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">How to…</h2>
    <p class="text-panel-muted">Open a topic to see the steps. Nothing here changes your page.</p>
    <details v-for="howTo in HOW_TOS" :key="howTo.title" class="rounded-md border border-panel-line bg-panel p-4">
      <summary class="cursor-pointer text-lg font-semibold">{{ howTo.title }}</summary>
      <ol class="mt-3 list-decimal space-y-2 pl-6">
        <li v-for="step in howTo.steps" :key="step">{{ step }}</li>
      </ol>
    </details>
  </div>
</template>
