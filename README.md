# Framed

Portfolio pages anyone can make: sign up with your email, pick an address
(`framed.my.id/your-name`), and build your page from blocks (a big banner,
text, picture and text, lists, quotes, buttons, your books or projects,
news, contact details, a press kit). Choose your colours, fonts and
background, crop your pictures, and edit it all from the browser with a
live preview.

Built with Vue 3, TypeScript, Tailwind and Vite. Runs on Cloudflare's free
plan: Pages for the site, a Pages Function (Hono) for the API, D1 for
accounts and content, R2 for pictures. Login is an emailed code through
Better Auth; codes are sent with Resend's free tier. No passwords exist.

> Status: works end to end locally (sign up, edit, save, public page). Not
> deployed yet: see the setup checklist below. The example content is an
> invented author, "Mara Ellison".

## Run it

```bash
npm install
cp .dev.vars.example .dev.vars   # local settings: login codes print in the terminal
npm run db:migrate:local         # create the tables in a local D1 (once)
npm run db:seed:test             # optional: a test page at http://localhost:8788/test (local only)
npm run dev:api                  # site and API on http://localhost:8788
npm run check                    # types, lint, format, tests and build (what CI runs)
```

Open http://localhost:8788/login, type any email, and copy the code from
the terminal. To edit the test page, open http://localhost:8788/api/dev/test-login
(local only: it logs you in as `test@framed.local` and opens `/test/edit`;
it answers only on localhost with `LOCAL_DEV_TEST_LOGIN=true` in `.dev.vars`).

> **Never set `LOCAL_DEV_TEST_LOGIN` (or any `LOCAL_DEV_` setting) on a
> deployed site.** `/api/dev/test-login` logs in without a code. It also
> refuses unless `SITE_URL` is a localhost address, and a test fails if
> `wrangler.toml` ever sets it, but the safe rule is: local `.dev.vars` only. For live reloading while changing the site, also run
`npm run dev` (http://localhost:5173, with `/api` passed to port 8788).

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | Used by both sides: the content's shape (`schema.ts`, `blocks.ts`, `theme.ts`, `fields.ts`), name rules (`names.ts`), picture rules (`images.ts`), the example content |
| `functions/api/` | The Pages Function entry: hands every `/api/*` request to the API |
| `server/` | The API (Hono): `app.ts` wires it; `auth.ts` and `email.ts` log people in; `session.ts` checks logins; `public-routes.ts`, `me-routes.ts`, `content-routes.ts` and `image-routes.ts` answer requests; `content-read.ts` and `content-write.ts` talk to D1 |
| `migrations/` | The D1 tables: Better Auth's (`0001`), then sites and content (`0002`) |
| `src/views/` | One view per address: `LandingView`, `LoginView`, `SiteLayout` + `PageView` (someone's site), `EditView` (their editor), terms and privacy |
| `src/auth/` | The login page's steps and the account calls |
| `src/components/` | What a site is made of: one component per block, books, header and footer |
| `src/editor/` | The editor: its state and API calls, tabs, a form per block type, fields, cropper, preview |
| `src/content/` | Loading a site, its links (`sitePath.ts`), theme and background as CSS variables, formatting |
| `tests/` | Vitest specs: `api/` on a real local D1 and R2 (Miniflare), `site/`, `editor/` and `auth/` for the pages |
| `scripts/` | `seed-test-site.ts`: the local test page; `print-auth-tables.mjs`: regenerates Better Auth's table SQL after an upgrade |
| `docs/guide.md` | How a request flows through the code, a glossary, and where to change things |

## Setup checklist (Arthur)

Everything stays on free plans: Cloudflare Pages, D1 (5 GB per account,
500 MB per database, 5 million rows read and 100,000 written a day), R2
(10 GB, free egress), and Resend (3,000 emails a month, 100 a day). Do
these once, in order. Steps 2–4 run in this folder after `npx wrangler login`.

1. **Domain.** Register `framed.my.id` (check that `.my.id`'s rules allow a
   service for other people) and add it to Cloudflare. Turn on **two-factor
   login for the Cloudflare account**: whoever gets in sees every account.
2. **Database.** `npx wrangler d1 create framed`; put the `database_id` it
   prints into `wrangler.toml`, then `npx wrangler d1 migrations apply DB --remote`.
3. **Picture storage.** `npx wrangler r2 bucket create framed-images`. Keep
   it private; Framed serves pictures itself.
4. **Login secret.** Make 32+ random characters (`openssl rand -base64 32`).
5. **Resend.** Make a free account at resend.com, add `framed.my.id` as a
   sending domain (it shows the DNS records to add in Cloudflare), and
   create an API key with "sending access" only.
6. **Pages project.** Workers & Pages → Create → Pages → connect to Git →
   this repo. Production branch `main`, build command `npm run build`,
   output `dist`. Settings → Variables and Secrets → Production, both
   **Encrypt**: `BETTER_AUTH_SECRET` (step 4) and `RESEND_API_KEY` (step 5).
   Then Custom domains → add `framed.my.id`, and redeploy.
7. **Check it.** Open https://framed.my.id/login, log in with your email,
   pick a name, press Save in the editor, and open your page.

**Taking a page down** after a report (reports are in the `reports` table):

```bash
npx wrangler d1 execute DB --remote --command "SELECT r.created_at, s.name, r.reason FROM reports r JOIN sites s ON s.id = r.site_id ORDER BY r.created_at DESC LIMIT 20"
npx wrangler d1 execute DB --remote --command "UPDATE sites SET is_hidden = 1 WHERE name = 'the-name'"
```

Backups: D1 can restore the database to any minute in the last 7 days
(`npx wrangler d1 time-travel restore DB --timestamp=…`).
