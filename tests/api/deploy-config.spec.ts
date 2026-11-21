// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The deploy configs: Cloudflare's wrangler.toml, and the VPS's ops/ files
// (compose.yaml, the .env.example that ops/.env is copied from, and the S3
// rules for the backups, which Arthur applies in AWS).
// Production secrets live outside the repo, so these are what can be checked.
const read = (path: string) => readFileSync(join(import.meta.dirname, '../..', path), 'utf8')
const WRANGLER_TOML = read('wrangler.toml')
const OPS_ENV_EXAMPLE = read('ops/.env.example')
const OPS_COMPOSE = read('ops/compose.yaml')
const BACKUP_ENV_EXAMPLE = read('ops/backup.env.example')
const GITIGNORE = read('.gitignore')
const PRIVACY_PAGE_BACKUP_DAYS = 14

interface S3LifecycleRule {
  Status: string
  Filter: { Prefix: string }
  Expiration: { Days: number }
  NoncurrentVersionExpiration: { NoncurrentDays: number }
}
interface S3PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Action: string | string[]
}
const S3_LIFECYCLE = JSON.parse(read('ops/s3-lifecycle.json')) as { Rules: S3LifecycleRule[] }
const S3_KEY_POLICY = JSON.parse(read('ops/s3-backup-key-policy.json')) as { Statement: S3PolicyStatement[] }

/** Every action the backup key's policy allows, or denies. */
function actionsWithEffect(effect: S3PolicyStatement['Effect']): string[] {
  const statements = S3_KEY_POLICY.Statement.filter((statement) => statement.Effect === effect)
  return statements.flatMap((statement) => [statement.Action].flat())
}

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

  it('has S3 expire the off-site backups inside those 14 days', () => {
    const rule = S3_LIFECYCLE.Rules.find((candidate) => candidate.Filter.Prefix === 'framed/')
    expect(rule?.Status).toBe('Enabled')
    // S3 rounds the expiry up to the next midnight (UTC), so it can take a
    // day longer; an old version is then kept NoncurrentDays more.
    const worstCaseDays =
      (rule?.Expiration.Days ?? Infinity) + 1 + (rule?.NoncurrentVersionExpiration.NoncurrentDays ?? 0)
    expect(worstCaseDays).toBeLessThanOrEqual(PRIVACY_PAGE_BACKUP_DAYS)
  })

  it('gives the backup key no way to delete a backup or loosen the bucket', () => {
    const deletesOrLoosens = /Delete|Put(Bucket|Lifecycle)/
    expect(actionsWithEffect('Allow').filter((action) => deletesOrLoosens.test(action))).toEqual([])
    expect(actionsWithEffect('Deny')).toEqual(
      expect.arrayContaining([
        's3:DeleteObject',
        's3:DeleteObjectVersion',
        's3:PutLifecycleConfiguration',
        's3:PutBucketPolicy',
      ]),
    )
  })
})
