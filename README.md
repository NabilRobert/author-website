# Framed

Portfolio pages anyone can make: sign up with your email, pick an address
(`framed.my.id/your-name`), and build your page from blocks (a big banner,
text, picture and text, lists, quotes, buttons, your work (projects,
books, buildings, art),
news, contact details, a press kit). Choose your colours, fonts and
background, crop your pictures, and edit it all from the browser with a
live preview.

Built with Vue 3, TypeScript, Tailwind and Vite, with a Hono API. It runs
two ways from the same code: on Cloudflare's free plan (Pages, a Pages
Function, D1 for accounts and content, R2 for pictures), or as one Node
process with a SQLite file on a VPS, which is how framed.my.id runs. Login is an email and password
through Better Auth; emailed codes (Resend's free tier) confirm the email
at sign-up and reset a forgotten password.

> Status: live at https://framed.my.id (the Node version, invite-only, with
> picture uploads switched off for now). The example content is an
> invented designer, "Alex Rowan".

## Run it

```bash
npm install
cp .dev.vars.example .dev.vars   # local settings: emailed codes print in the terminal
npm run db:migrate:local         # create the tables in a local D1 (once)
npm run dev:api                  # site and API on http://localhost:8788
npm run check                    # types, lint, format, tests and build (what CI runs)
```

Open http://localhost:8788/login and sign up with any email and a
password; the code that confirms the email is printed in the terminal.
Once logged in, your own page shows an **Edit this page** button; the
editor's **Done** brings you back.

> **Never set `LOCAL_DEV_PRINT_CODES` (or any `LOCAL_DEV_` setting) on a
> deployed site.** It would print people's codes in the logs instead of
> emailing them. The code ignores it unless `SITE_URL` is localhost, and a
> test fails if `wrangler.toml` or `ops/` ever sets one; the safe
> rule is: local `.dev.vars` only. For live reloading while changing the
> site, also run `npm run dev` (http://localhost:5173, with `/api` passed
> to port 8788).

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | Used by both sides: the content's shape (`schema.ts`, `blocks.ts`, `theme.ts`, `fields.ts`), name rules (`names.ts`), picture rules (`images.ts`), the example content |
| `functions/api/` | The Pages Function entry: hands every `/api/*` request to the API |
| `server/` | The API (Hono): `app.ts` wires it; `auth.ts`, `sign-in-lockout.ts` and `email.ts` log people in; `session.ts` checks logins; `public-routes.ts`, `reports.ts`, `me-routes.ts`, `content-routes.ts` and `image-routes.ts` answer requests; `content-read.ts` and `content-write.ts` talk to D1 |
| `server/node/` | The Node version for a VPS: `main.ts` starts it, `server.ts` serves the site and API, `sqlite-d1.ts` lets the code use a SQLite file as if it were D1, `migrate.ts` applies migrations on start, `client-ip.ts` works out the visitor's address, plus the `invite-cli`, `takedown-cli` and `backup-cli` commands |
| `ops/` | Running the Node version with Docker: `compose.yaml`, `.env.example`, `make-secrets.sh` (the `Dockerfile` is at the root) |
| `migrations/` | The database tables, numbered; the same files for D1 and for the Node version's SQLite |
| `src/views/` | One view per address: `LandingView`, `LoginView`, `SiteLayout` + `PageView` (someone's site), `EditView` (their editor), terms and privacy |
| `src/auth/` | The login page's steps and the account calls |
| `src/components/` | What a site is made of: one component per block, work, header and footer |
| `src/editor/` | The editor: its state and API calls, tabs, a form per block type, fields, cropper, preview |
| `src/content/` | Loading a site, its links (`sitePath.ts`), theme and background as CSS variables, formatting |
| `tests/` | Vitest specs: `api/` on a real local D1 and R2 (Miniflare), and again on SQLite (`npm run test:sqlite`); `site/`, `editor/` and `auth/` for the pages |
| `scripts/` | `seed-test-site.ts`: a local example page at `/test`; `print-auth-tables.mjs`: regenerates Better Auth's table SQL after an upgrade |
| `docs/guide.md` | How a request flows through the code, a glossary, and where to change things |

## Run it on a server (Docker)

The same app also runs as one Node process with a SQLite file, for a VPS
instead of Cloudflare (Hono's Node adapter and better-sqlite3;
`server/node/`). Picture uploads are off in this version too.

```bash
cd ops
cp .env.example .env              # non-secret settings
./make-secrets.sh                 # makes the login secret, asks for the Resend key (not shown)
docker compose up -d --build      # builds and starts it on 127.0.0.1:8790
docker compose exec framed node dist-node/invite-cli.mjs you@example.com   # your first invite
```

- **Migrations** apply by themselves on every start.
- **The database** is one SQLite file in the `framed-data` volume. Take a consistent copy while it runs
  with `docker compose exec framed node dist-node/backup-cli.mjs /data/backup.sqlite`, then encrypt and
  ship it with the server's other backups.
- **Reported pages:** set `REPORTS_EMAIL` in `ops/.env` to get an email for each report (up to 10 a
  day). `docker compose exec framed node dist-node/takedown-cli.mjs reports` lists recent ones;
  `… takedown-cli.mjs hide <name>` hides a page from visitors, and `show <name>` brings it back.
- **In front of it:** the server's proxy (Caddy) forwards `framed.my.id` to `127.0.0.1:8790`, and
  Cloudflare stays in front (the DNS record proxied, "orange cloud"). The app trusts Cloudflare's
  `CF-Connecting-IP` only when the request reached the proxy from a Cloudflare address
  (`server/node/client-ip.ts`), so rate limits hold even if someone finds the server's address. Still,
  let only Cloudflare reach ports 80 and 443, and cap request bodies in the proxy too:
  [`ops/hardening.md`](ops/hardening.md) has the steps.
- `npm run build:node` builds it without Docker (`node dist-node/main.mjs`, settings from the environment).

## Setup checklist (Arthur)

Everything stays on free plans: Cloudflare Pages, D1 (5 GB per account,
500 MB per database, 5 million rows read and 100,000 written a day), R2
(10 GB, free egress), and Resend (3,000 emails a month, 100 a day). Do
these once, in order. Steps 2–4 run in this folder after `npx wrangler login`.

1. **Domain.** Register `framed.my.id` (check that `.my.id`'s rules allow a
   service for other people) and add it to Cloudflare. Turn on **two-factor
   login for the Cloudflare account**: whoever gets in sees every account.
2. **Database.** `npx wrangler d1 create frameddatabase` (done: its name and
   `database_id` are in `wrangler.toml`), then
   `npx wrangler d1 migrations apply DB --remote` to create the tables.
3. **Picture storage (skipped for now).** Uploads of pictures and PDFs are
   switched off: `wrangler.toml` has no storage binding, and the editor says
   so. To turn them on with R2: enable R2 in the dashboard,
   `npx wrangler r2 bucket create framed-images` (keep it private), and
   uncomment the `[[r2_buckets]]` lines in `wrangler.toml`.
4. **Login secret.** Make 32+ random characters (`openssl rand -base64 32`).
5. **Resend.** Make a free account at resend.com, add `framed.my.id` as a
   sending domain (it shows the DNS records to add in Cloudflare), and
   create an API key with "sending access" only.
6. **Pages project.** Workers & Pages → Create → Pages → connect to Git →
   this repo. Name `framed`, production branch `main`, build command
   `npm run build`, output `dist`. **Before pressing Save and Deploy**, add
   under Environment variables: `NODE_VERSION` = `24`, and both secrets as
   **Encrypt**: `BETTER_AUTH_SECRET` (step 4) and `RESEND_API_KEY` (step 5).
   (Without the secret the API refuses to run, answering 503.) Then
   Settings → Builds → Branch control → preview deployments: **None**,
   because previews would use the live database. Then Custom domains → add
   `framed.my.id`.
7. **Check it.** Sign-up is invite-only (`SIGN_UP_MODE = "invite"` in
   `wrangler.toml`), so make yourself an invite first:
   `npm run invite -- --remote you@example.com`. Open the link it prints,
   make your account, type the code from the email, pick a name, press
   Save in the editor, and open your page.
8. **Invite people** the same way: `npm run invite -- --remote their@email.com`
   prints a link that works once, for that address only (leave the email
   out for a link anyone can use once).

**Taking a page down** after a report, on Cloudflare (on the VPS, use `takedown-cli.mjs` above):

```bash
npx wrangler d1 execute DB --remote --command "SELECT r.created_at, s.name, r.reason FROM reports r JOIN sites s ON s.id = r.site_id ORDER BY r.created_at DESC LIMIT 20"
npx wrangler d1 execute DB --remote --command "UPDATE sites SET is_hidden = 1 WHERE name = 'the-name'"
```

Backups: D1 can restore the database to any minute in the last 7 days
(`npx wrangler d1 time-travel restore DB --timestamp=…`).
