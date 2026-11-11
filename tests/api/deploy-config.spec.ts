// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The deploy configs: Cloudflare's wrangler.toml, and the VPS's ops/ files
// (compose.yaml and the .env.example that ops/.env is copied from).
// Production secrets live outside the repo, so these are what can be checked.
const read = (path: string) => readFileSync(join(import.meta.dirname, '../..', path), 'utf8')
const WRANGLER_TOML = read('wrangler.toml')
const OPS_ENV_EXAMPLE = read('ops/.env.example')
const OPS_COMPOSE = read('ops/compose.yaml')
const BACKUP_ENV_EXAMPLE = read('ops/backup.env.example')
const GITIGNORE = read('.gitignore')

describe('the Cloudflare deploy config (wrangler.toml)', () => {
  it('never switches on a local-development setting', () => {
    expect(WRANGLER_TOML).not.toMatch(/LOCAL_DEV_/)
  })

  it('launches invite-only: changing that is a decision, not an accident', () => {
    expect(WRANGLER_TOML).toMatch(/^SIGN_UP_MODE = "invite"$/m)
  })

  it('points SITE_URL at the real site, not localhost', () => {
    expect(WRANGLER_TOML).toMatch(/^SITE_URL = "https:\/\/framed\.my\.id"$/m)
  })
})

describe('the VPS deploy config (ops/)', () => {
  it('never switches on a local-development setting', () => {
    expect(OPS_ENV_EXAMPLE).not.toMatch(/LOCAL_DEV_/)
    expect(OPS_COMPOSE).not.toMatch(/LOCAL_DEV_/)
  })

  it('launches invite-only', () => {
    expect(OPS_ENV_EXAMPLE).toMatch(/^SIGN_UP_MODE=invite$/m)
  })

  it('points SITE_URL at the real site, not localhost', () => {
    expect(OPS_ENV_EXAMPLE).toMatch(/^SITE_URL=https:\/\/framed\.my\.id$/m)
  })

  it('publishes the container on the loopback only, behind the proxy', () => {
    expect(OPS_COMPOSE).toContain("- '127.0.0.1:${FRAMED_PORT:-8790}:8790'")
  })

  it('keeps the backup settings out of git, and the S3 keys out of the container', () => {
    expect(GITIGNORE).toMatch(/^ops\/backup\.env$/m)
    expect(OPS_COMPOSE).not.toContain('backup.env')
    for (const secret of ['AGE_PUBLIC_KEY', 'BACKUP_S3_ACCESS_KEY_ID', 'BACKUP_S3_SECRET_ACCESS_KEY']) {
      expect(BACKUP_ENV_EXAMPLE).toMatch(new RegExp(`^${secret}=$`, 'm'))
    }
  })

  it('keeps backups for the 14 days the privacy page promises', () => {
    expect(BACKUP_ENV_EXAMPLE).toMatch(/^BACKUP_KEEP_DAYS=14$/m)
    expect(read('ops/backup.sh')).toContain('DEFAULT_KEEP_DAYS=14')
    expect(read('src/views/PrivacyView.vue')).toContain('Backups are deleted after 14 days')
  })
})
