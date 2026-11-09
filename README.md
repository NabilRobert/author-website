# Author website

A website for a fiction writer: books, news and events, a press kit and
contact details. The owner builds the pages himself from blocks (a big
banner, text, picture and text, a list, a quote, buttons, his books, his
news), like a website builder, and edits them from the site.

Built with Vue 3, TypeScript, Tailwind and Vite. Runs on Cloudflare (free
plan): Pages for the site, a Pages Function (Hono) for the API, D1 for the
content and R2 for images.

> Status: the public site renders the demo content (an invented author,
> "Mara Ellison"). The API, the editor and image upload come next.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # types, lint, format, tests and build (what CI runs)
```

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | The content's shape: `schema.ts` (author, books, news, pages), `blocks.ts` (block types), `fields.ts` (field rules), `demo-content.ts` |
| `src/views/` | `PageView.vue` finds a page by its address and shows its blocks |
| `src/components/blocks/` | One component per block type, and `PageBlocks.vue`, which stacks a page's blocks |
| `src/components/books/` | A book's cover, its full entry, and the list grouped by series |
| `src/components/layout/` | Header (with the menu) and footer |
| `src/content/` | Where the content comes from (`useSiteContent.ts`) and formatting helpers |
| `tests/site/` | Vitest specs for the schema, the helpers and the pages |
| `docs/guide.md` | How a request flows through the code, a glossary, and where to change things |
