# Author website

A website for a fiction writer: books, news and events, a press kit and
contact details. The owner builds the pages himself from blocks (a big
banner, text, picture and text, a list, a quote, buttons, his books, his
news), like a website builder, picks the site's colours and fonts, and
edits it all from the site.

Built with Vue 3, TypeScript, Tailwind and Vite. Runs on Cloudflare (free
plan): Pages for the site, a Pages Function (Hono) for the API, D1 for the
content and R2 for images.

> Status: the public site, the editor (`/edit`) and picture upload work
> locally. Not deployed yet: see the Cloudflare checklist below. Demo
> content is an invented author, "Mara Ellison".

## Run it

```bash
npm install
cp .dev.vars.example .dev.vars   # local only: lets the editor save without signing in
npm run db:migrate:local   # create the tables in a local D1 (once)
npm run dev:api            # the API on http://localhost:8788 (second terminal)
npm run dev                # the site on http://localhost:5173, /api proxied to 8788
                           # the editor is at http://localhost:5173/edit; press Save once to fill a new database
npm run check              # types, lint, format, tests and build (what CI runs)
```

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | The content's shape: `schema.ts` (author, books, news, pages), `blocks.ts` (block types), `theme.ts` (colours and fonts), `fields.ts` (field rules), `demo-content.ts` |
| `functions/api/` | The Pages Function entry: hands every `/api/*` request to the API |
| `server/` | The API (Hono): `app.ts` and `admin-routes.ts` route, `access.ts` checks the sign-in, `content-read.ts` and `content-write.ts` for D1, `image-routes.ts` for pictures in R2 |
| `migrations/` | The D1 tables, as numbered SQL files |
| `wrangler.toml` | Cloudflare settings: database and picture bindings (placeholders only) |
| `public/` | Files served as they are: the icon and `_headers` (security headers) |
| `src/views/` | `PageView.vue` finds a page by its address and shows its blocks; `EditView.vue` is the editor |
| `src/editor/` | The editor: its state and API calls, the tabs, a form per block type, form fields, the preview |
| `src/components/blocks/` | One component per block type, and `PageBlocks.vue`, which stacks a page's blocks |
| `src/components/books/` | A book's cover, its full entry, and the list grouped by series |
| `src/components/layout/` | Header (with the menu) and footer |
| `src/content/` | Where the content comes from (`useSiteContent.ts`), formatting helpers, and the theme's CSS variables |
| `src/styles/` | Tailwind setup, default design tokens, and the font loader |
| `tests/site/` | Vitest specs for the schema, the helpers and the pages |
| `tests/editor/` | Vitest specs for the editor's state, messages and page |
| `tests/api/` | Vitest specs for the API, on a real local D1 (Miniflare) |
| `docs/guide.md` | How a request flows through the code, a glossary, and where to change things |

## Cloudflare setup checklist (Arthur)

Everything stays on Cloudflare's free plans: Pages, D1 (5M rows read and
100k written a day, 5 GB), R2 (10 GB, free egress) and Zero Trust (free for
up to 50 users; this needs 2). Do these once, in order. Steps 1 to 3 run in
this folder after `npx wrangler login`.

1. **Database.** Run `npx wrangler d1 create author-website`. Copy the
   `database_id` it prints into `wrangler.toml` (replacing
   `REPLACE_WITH_D1_DATABASE_ID`) and commit that on a branch.
2. **Tables.** Run `npx wrangler d1 migrations apply DB --remote`.
3. **Picture storage.** Run `npx wrangler r2 bucket create author-website-images`.
   Leave the bucket private; the site serves pictures itself.
4. **Pages project.** In the dashboard: Workers & Pages → Create → Pages →
   connect to Git → `NabilRobert/author-website`. Production branch `main`,
   build command `npm run build`, output folder `dist`. Node 24 comes from
   `.nvmrc`. The D1 and R2 bindings come from `wrangler.toml`.
5. **Domain.** Pages project → Custom domains → add the brother's domain.
   (Access path rules need a domain that is a zone in this Cloudflare
   account; the editor won't work on `*.pages.dev`, by design: it refuses
   saves there.)
6. **Sign-in method.** Zero Trust → Settings → Authentication → Login
   methods → Add new → **One-time PIN**. (New Zero Trust accounts start with
   the Cloudflare login, which would need the brother to have a Cloudflare
   account.)
7. **Access application.** Zero Trust → Access → Applications → Create →
   Self-hosted. Name it "Author site editor". Add two public hostnames on
   the brother's domain: path `edit` and path `api/admin`. Policy: **Allow**,
   Include → Emails → the brother's email and Arthur's. Login method:
   One-time PIN only. **Session Duration: 1 hour**, so each editing visit
   needs a fresh email code. Save, then copy the **Application Audience
   (AUD) tag** from its Overview.
   Also set Zero Trust → Access settings → **global session duration to 15
   minutes** (the shortest). Otherwise Access quietly signs him back in for
   24 hours after the editor's session ends. Unsaved changes survive an
   expired sign-in: the editor keeps them in his browser and brings them
   back after he signs in again.
8. **Secrets.** Pages project → Settings → Variables and Secrets →
   Production → add two, both **Encrypt**:
   - `ACCESS_TEAM_DOMAIN`: your team domain, like `yourteam.cloudflareaccess.com`
     (Zero Trust → Settings → Custom pages shows it).
   - `ACCESS_AUD`: the tag from step 7.

   Then redeploy (Deployments → … → Retry deployment). Never set
   `LOCAL_DEV_NO_LOGIN` here.
9. **Check it is locked.** In a private window, open
   `https://<domain>/api/admin/content`: you should get the Cloudflare
   sign-in page, not data. Open `https://<domain>/edit`, sign in with the
   emailed code, and you should see the editor.
10. **Publish the first version.** The editor starts from the example
    content on a new site. Press **Save changes** once; the public site
    then shows it, and the brother replaces it with his own.

If the editor says "Editing is not set up yet", step 8 is missing or the
deploy didn't pick it up. If it says the sign-in expired straight after
signing in, the AUD tag or team domain in step 8 doesn't match step 7.
