// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The deploy config, as Cloudflare reads it. Production secrets live in
// Cloudflare, not in the repo, so this file is what can be checked here.
const WRANGLER_TOML = readFileSync(join(import.meta.dirname, '../../wrangler.toml'), 'utf8')

describe('the deploy config (wrangler.toml)', () => {
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
