# Framed

Portfolio pages anyone can make: sign up with your email, pick an address
(`framed.my.id/your-name`), and build your page from blocks (a banner, text,
pictures, lists, quotes, buttons, your work, news, contact details, a press
kit). Choose colours, fonts and a background, crop your pictures, and edit it
all in the browser with a live preview.

Live at https://framed.my.id (invite-only). The example content is an invented
designer, "Alex Rowan".

Built with Vue 3, TypeScript, Tailwind and Vite, with a Hono API and Better
Auth. The same code runs two ways: on Cloudflare (Pages and D1), or as one
Node process with a SQLite file. Every API test runs against both.

## Run it

```bash
npm install
cp .dev.vars.example .dev.vars   # local settings: emailed codes print in the terminal
npm run db:migrate:local         # create the tables in a local database (once)
npm run dev:api                  # site and API on http://localhost:8788
```

Open http://localhost:8788/login and sign up with any email and a password;
the code that confirms the email is printed in the terminal.

`npm run check` runs what CI runs: types, lint, format, tests and the build.

> **Never set a `LOCAL_DEV_` setting on a deployed site.** They belong in your
> local `.dev.vars` only; `LOCAL_DEV_PRINT_CODES` would print people's codes.

## Layout

| Folder | What's in it |
| --- | --- |
| `shared/` | Used by both sides: the content's shape and its rules |
| `server/` | The API; `server/node/` is the Node version |
| `functions/` | The Cloudflare entry point, which hands requests to the API |
| `migrations/` | The database tables, numbered; the same files for both versions |
| `src/` | The site and its editor |
| `tests/` | Vitest specs for the API, site, editor and login |
| `scripts/` | Invites, the local example page, auth table SQL |
| `ops/` | Files for running the Node version with Docker |
| `docs/` | The guide |

## Docs

- [`docs/guide.md`](docs/guide.md): how a request flows through the code, a
  glossary, where to change things, and deploying.
