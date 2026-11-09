// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MESSAGES_PER_SENDER_PER_HOUR, MESSAGES_PER_SITE_PER_DAY } from '../../server/contact-messages'
import { createTestApp } from './test-app'
import type { TestApp } from './test-app'

let api: TestApp
beforeEach(async () => {
  api = await createTestApp()
  await api.signUp('mara@example.com', 'mara')
})
afterEach(async () => {
  await api.dispose()
})

const MESSAGE = { name: 'Sam Visitor', email: 'sam@example.org', message: 'Could you design our library signs?' }

function send(body: object, ip = '203.0.113.7') {
  return api.request('/api/sites/mara/messages', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip },
  })
}

describe('POST /api/sites/<name>/messages', () => {
  it("emails the message to the owner's login email, with the visitor to reply to", async () => {
    expect((await send(MESSAGE)).status).toBe(201)
    expect(api.sentMessages).toEqual([
      {
        to: 'mara@example.com',
        siteName: 'mara',
        senderName: 'Sam Visitor',
        senderEmail: 'sam@example.org',
        message: MESSAGE.message,
      },
    ])
  })

  it('stores no message, only a hashed sender and the time', async () => {
    await send(MESSAGE)
    const row = await api.db.prepare('SELECT * FROM contact_messages').first<Record<string, string>>()
    expect(Object.keys(row!).sort()).toEqual(['sender_hash', 'sent_at', 'site_id'])
    expect(row!.sender_hash).not.toContain('203.0.113.7')
  })

  it('refuses a message without a valid email, saying why', async () => {
    const response = await send({ ...MESSAGE, email: 'not an email' })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Enter your email address, like name@example.com, so they can reply.',
    })
  })

  it('pretends to send when the trap field is filled in, and sends nothing', async () => {
    expect((await send({ ...MESSAGE, website: 'http://spam.example' })).status).toBe(201)
    expect(api.sentMessages).toEqual([])
  })

  it(`lets one sender send ${MESSAGES_PER_SENDER_PER_HOUR} an hour`, async () => {
    for (let count = 0; count < MESSAGES_PER_SENDER_PER_HOUR; count++) expect((await send(MESSAGE)).status).toBe(201)
    expect((await send(MESSAGE)).status).toBe(429)
    expect((await send(MESSAGE, '198.51.100.1')).status).toBe(201)
  })

  it(`lets a site receive ${MESSAGES_PER_SITE_PER_DAY} a day`, async () => {
    for (let count = 0; count < MESSAGES_PER_SITE_PER_DAY; count++) {
      expect((await send(MESSAGE, `198.51.100.${count}`)).status).toBe(201)
    }
    const response = await send(MESSAGE, '192.0.2.1')
    expect(response.status).toBe(429)
    expect(((await response.json()) as { error: string }).error).toContain('many messages today')
  })

  it('answers 404 for a site that does not exist', async () => {
    const response = await api.request('/api/sites/nobody-here/messages', {
      method: 'POST',
      body: JSON.stringify(MESSAGE),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status).toBe(404)
  })
})
