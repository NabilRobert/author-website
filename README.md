# Author website

A website for a fiction writer: books, news and events, a press kit and
contact details. The owner builds the pages himself from blocks (a big
banner, text, picture and text, a list, a quote, buttons, his books, his
news), like a website builder, picks the site's colours and fonts, and
edits it all from the site.

Built with Vue 3, TypeScript, Tailwind and Vite. Runs on Cloudflare (free
plan): Pages for the site, a Pages Function (Hono) for the API, D1 for the
content and R2 for images.

> Status: the public site loads its content from the API and D1. The
> editor and image upload come next. Demo content is an invented author,
> "Mara Ellison".

## Run it

```bash
npm install
npm run db:migrate:local   # create the tables in a local D1 (once)
npm run dev:api            # the API on http://localhost:8788 (second terminal)
npm run dev                # the site on http://localhost:5173, /api proxied to 8788
npm run check              # types, lint, format, tests and build (what CI runs)
```

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | The content's shape: `schema.ts` (author, books, news, pages), `blocks.ts` (block types), `theme.ts` (colours and fonts), `fields.ts` (field rules), `demo-content.ts` |
| `functions/api/` | The Pages Function entry: hands every `/api/*` request to the API |
| `server/` | The API (Hono): `app.ts` routes, `content-read.ts` and `content-write.ts` for D1 |
| `migrations/` | The D1 tables, as numbered SQL files |
| `src/views/` | `PageView.vue` finds a page by its address and shows its blocks |
| `src/components/blocks/` | One component per block type, and `PageBlocks.vue`, which stacks a page's blocks |
| `src/components/books/` | A book's cover, its full entry, and the list grouped by series |
| `src/components/layout/` | Header (with the menu) and footer |
| `src/content/` | Where the content comes from (`useSiteContent.ts`), formatting helpers, and the theme's CSS variables |
| `src/styles/` | Tailwind setup, default design tokens, and the font loader |
| `tests/site/` | Vitest specs for the schema, the helpers and the pages |
| `tests/api/` | Vitest specs for the API, on a real local D1 (Miniflare) |
| `docs/guide.md` | How a request flows through the code, a glossary, and where to change things |
