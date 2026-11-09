/**
 * A stand-in for the API in front-end tests: `fetch` answers by address
 * ("GET /api/me"), so a test lists only the calls it cares about. Each
 * answer is a function, because a Response can be read only once.
 * Unlisted calls fail the test loudly.
 */
import { vi } from 'vitest'

export type FakeAnswer = () => Response | Promise<Response>

export function fakeApi(answers: Record<string, FakeAnswer>) {
  const calls: { method: string; path: string; init?: RequestInit }[] = []
  const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase()
    const path = new URL(String(input), 'http://localhost').pathname
    calls.push({ method, path, init })
    const answer = answers[`${method} ${path}`]
    if (!answer) throw new Error(`The fake API has no answer for ${method} ${path}`)
    return answer()
  })
  vi.stubGlobal('fetch', fetchStub)
  return { calls, fetchStub }
}

export const json =
  (body: unknown, status = 200): FakeAnswer =>
  () =>
    Response.json(body, { status })
export const offline: FakeAnswer = () => Promise.reject(new TypeError('Failed to fetch'))
