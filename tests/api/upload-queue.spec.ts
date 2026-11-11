// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createUploadQueue, isUploadRequest } from '../../server/node/upload-queue'

/** A task that runs until `finish` is called, noting when it starts and ends. */
function heldTask(name: string, log: string[]) {
  let finish = () => {}
  const task = () =>
    new Promise<string>((resolve) => {
      log.push(`${name} started`)
      finish = () => {
        log.push(`${name} finished`)
        resolve(name)
      }
    })
  return { task, finish: () => finish() }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('one upload at a time (Node version)', () => {
  it('starts the next upload only when the one before has finished', async () => {
    const inTurn = createUploadQueue()
    const log: string[] = []
    const first = heldTask('first', log)
    const second = heldTask('second', log)
    const firstResult = inTurn(first.task)
    const secondResult = inTurn(second.task)
    await settle()
    expect(log).toEqual(['first started'])
    first.finish()
    await settle()
    expect(log).toEqual(['first started', 'first finished', 'second started'])
    second.finish()
    expect([await firstResult, await secondResult]).toEqual(['first', 'second'])
  })

  it('carries on after an upload fails', async () => {
    const inTurn = createUploadQueue()
    const failed = inTurn(() => Promise.reject(new Error('cut off')))
    await expect(failed).rejects.toThrow('cut off')
    expect(await inTurn(async () => 'next')).toBe('next')
  })

  it('queues only the picture and PDF uploads', () => {
    expect(isUploadRequest('POST', '/api/me/images')).toBe(true)
    expect(isUploadRequest('POST', '/api/me/files')).toBe(true)
    expect(isUploadRequest('GET', '/api/me/images')).toBe(false)
    expect(isUploadRequest('GET', '/api/images/a.png')).toBe(false)
    expect(isUploadRequest('PUT', '/api/me/content')).toBe(false)
  })
})
