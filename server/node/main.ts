/**
 * Starts the Node version of Framed (for a VPS; ops/compose.yaml):
 *
 *   node dist-node/main.mjs
 *
 * It opens the SQLite file (DATABASE_PATH), applies any new migrations,
 * reads the settings (server/node/settings.ts) and serves the site and API
 * on PORT. Picture storage isn't connected here, so uploads are off
 * (server/storage.ts).
 */
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import type { Env } from '../env'
import { asD1 } from './sqlite-d1'
import { DEFAULT_DATABASE_PATH, openDatabase } from './database'
import { applyMigrations } from './migrate'
import { readSetting, requireSetting } from './settings'
import { createNodeServer } from './server'

const DEFAULT_PORT = 8790
const appDir = process.cwd()

const sqlite = openDatabase(readSetting('DATABASE_PATH') ?? DEFAULT_DATABASE_PATH)
const applied = applyMigrations(sqlite, join(appDir, 'migrations'))
if (applied.length) console.log(`Applied migrations: ${applied.join(', ')}`)

const env: Env = {
  DB: asD1(sqlite),
  SQLITE_DATABASE: sqlite,
  SITE_URL: requireSetting('SITE_URL'),
  // Checked on every request (server/env.ts: secretProblem): without a real one the API answers 503.
  BETTER_AUTH_SECRET: readSetting('BETTER_AUTH_SECRET') ?? '',
  RESEND_API_KEY: readSetting('RESEND_API_KEY'),
  EMAIL_FROM: readSetting('EMAIL_FROM'),
  SIGN_UP_MODE: readSetting('SIGN_UP_MODE'),
  REPORTS_EMAIL: readSetting('REPORTS_EMAIL'),
  // Local trials only (prints codes instead of emailing them); ignored unless SITE_URL is localhost.
  LOCAL_DEV_PRINT_CODES: readSetting('LOCAL_DEV_PRINT_CODES'),
}

const server = createNodeServer(join(appDir, 'dist'))
const port = Number(readSetting('PORT') ?? DEFAULT_PORT)
serve({ fetch: (request) => server.fetch(request, env), port, hostname: '0.0.0.0' })
console.log(`Framed is listening on port ${port}.`)
