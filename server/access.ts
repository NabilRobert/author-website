/**
 * Guards the editor's API (/api/admin/*). Cloudflare Access already stops
 * anyone who hasn't signed in with an allowed email; this middleware checks
 * Access's signed token again, so a missing or mistaken Access policy fails
 * closed instead of leaving the editor open.
 *
 * The token (Cf-Access-Jwt-Assertion header) is verified with `jose`
 * against the team's public keys: signature, issuer, audience and expiry.
 */
import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Env } from './env'

const TOKEN_HEADER = 'Cf-Access-Jwt-Assertion'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

// One key set per team domain, kept between requests so the keys aren't
// downloaded every time (jose refreshes them when they rotate).
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function keySetFor(teamDomain: string) {
  let keySet = keySets.get(teamDomain)
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`))
    keySets.set(teamDomain, keySet)
  }
  return keySet
}

async function isValidAccessToken(token: string, teamDomain: string, audience: string): Promise<boolean> {
  try {
    await jwtVerify(token, keySetFor(teamDomain), { issuer: `https://${teamDomain}`, audience })
    return true
  } catch {
    return false
  }
}

export const requireOwner = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const { ACCESS_TEAM_DOMAIN: teamDomain, ACCESS_AUD: audience } = c.env
  if (teamDomain && audience) {
    const token = c.req.header(TOKEN_HEADER) ?? ''
    if (!(await isValidAccessToken(token, teamDomain, audience))) {
      return c.json({ error: 'You are not signed in, or your sign-in has expired. Reload the page to sign in.' }, 401)
    }
    return next()
  }
  if (c.env.LOCAL_DEV_NO_LOGIN === 'true' && LOCAL_HOSTNAMES.has(new URL(c.req.url).hostname)) {
    return next()
  }
  console.error('Editor API refused: ACCESS_TEAM_DOMAIN and ACCESS_AUD are not set (README, Cloudflare checklist).')
  return c.json({ error: 'Editing is not set up yet. Ask Arthur to finish the Cloudflare Access setup.' }, 503)
})
