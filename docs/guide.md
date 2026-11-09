# Guide

How the site works, in plain words. Read the flow first, then use the
glossary and "where to change things" as a reference.

## The flow: a visitor opens /about

```mermaid
flowchart TD
  A[Browser asks for /about] --> B[src/router/index.ts: route 'page', slug = 'about']
  B --> C[src/views/PageView.vue: find the page whose slug is 'about']
  C --> D[src/content/useSiteContent.ts: the site's content]
  C --> E[src/components/blocks/PageBlocks.vue: one component per block]
  E --> F[ImageTextBlock, ListBlock, QuoteBlock ...]
```

1. **Router** (`src/router/index.ts`): every address that looks like a page
   (`/`, `/about`, `/my-new-page`) goes to `PageView` with its `slug`
   (`''` for the front page).
2. **Find the page** (`src/views/PageView.vue`): looks through
   `content.pages` for that slug. No match shows the not-found page. A page
   that doesn't start with a big banner gets its title as the `h1`.
3. **The content** (`src/content/useSiteContent.ts: useSiteContent`): one
   shared document with the author, books, news and pages. For now it is the
   demo document in `shared/demo-content.ts`.
4. **Stack the blocks** (`src/components/blocks/PageBlocks.vue`): for each
   block, picks the component for its `type` and passes it the block (and,
   for books, news, contact and press kit, the content they show).
5. **Each block draws itself**, for example
   `src/components/blocks/ImageTextBlock.vue` puts the picture beside the
   text. Books come from `src/components/books/BookList.vue`, which groups a
   series in reading order (`src/content/format.ts: groupBooksBySeries`).

The menu (`src/components/layout/SiteHeader.vue`) lists the pages whose
`showInMenu` is on, in the order of `content.pages`.

## Glossary

- **Block**: one piece of a page, like a banner or a list. Its fields and
  error messages are in `shared/blocks.ts`.
- **Page**: a title, an address (slug) and a stack of blocks
  (`shared/schema.ts: pageSchema`).
- **Slug**: the part of the address after the `/`. The front page's is
  empty. `edit` and `api` are kept for the site itself.
- **Content document**: everything on the site as one object
  (`SiteContent`): author, books, news, pages and `updatedAt`.
- **Zod schema**: a description of the content's shape that can also check
  it. The same schema checks the editor's draft and the API's input, and
  its messages are what the owner sees.
- **Typeset cover**: the plain title-on-colour cover shown until a book has
  a cover image (`src/components/books/BookCover.vue`).
- **Image key**: the name an uploaded image is stored under, like
  `images/<id>.jpg`; the site loads it from `/api/images/<key>`.

## Where to change things

- **Add a block type:** add its schema to `shared/blocks.ts` (and to
  `blockSchema` and `BLOCK_NAMES`), add a component in
  `src/components/blocks/`, and add a line for it in `PageBlocks.vue`.
- **Change the colours or fonts:** `src/styles/theme.css` (the contrast
  ratios are noted there; keep text at 4.5:1 or more).
- **Change a field's rules or its error message:** `shared/fields.ts` or the
  schema that uses it.
- **Change the demo content:** `shared/demo-content.ts`.
