/**
 * The logged-in person's account, through the API (server/me-routes.ts):
 * who am I, claim a name, delete everything.
 */
export interface Me {
  email: string
  site: { name: string } | null
}

/** Me, or null if nobody is logged in. */
export async function fetchMe(): Promise<Me | null> {
  const response = await fetch('/api/me', { cache: 'no-store' })
  if (response.status === 401) return null
  if (!response.ok) throw new Error(`GET /api/me answered ${response.status}`)
  return (await response.json()) as Me
}

/** Claims framed.my.id/<name>; returns why not, or null if it worked. */
export async function claimName(name: string): Promise<string | null> {
  const response = await fetch('/api/me/site', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => null)
  if (!response) return "Couldn't reach Framed. Check your internet connection and try again."
  if (response.ok) return null
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  return body.error ?? 'That name could not be saved. Try another.'
}

export async function deleteAccount(): Promise<boolean> {
  const response = await fetch('/api/me', { method: 'DELETE' }).catch(() => null)
  return response?.ok ?? false
}

/**
 * Logs in as the local test account without a code. Only a local
 * development server answers; anywhere else this returns false.
 */
export async function testAccountLogin(): Promise<boolean> {
  const response = await fetch('/api/dev/test-account-login', { method: 'POST' }).catch(() => null)
  return response?.ok ?? false
}
