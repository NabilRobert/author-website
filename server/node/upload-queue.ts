/**
 * Lets the Node version handle one upload at a time.
 *
 * Reading a 10 MB upload form briefly takes about 100 MB, because the form
 * parser copies the file several times, and the container has 256 MB
 * (ops/compose.yaml). Measured in that container on 2026-11-11: 8 uploads at
 * once got it killed for running out of memory; 10 in a row peaked at
 * 143 MiB. So upload requests wait their turn, and every other request runs
 * as before. A waiting upload costs almost nothing: its body stays unread
 * until its turn comes.
 */

const UPLOAD_PATHS = new Set(['/api/me/images', '/api/me/files'])

export function isUploadRequest(method: string, path: string): boolean {
  return method === 'POST' && UPLOAD_PATHS.has(path)
}

/** Runs each task given to it only after the one before has finished, failed or not. */
export function createUploadQueue() {
  let previous: Promise<unknown> = Promise.resolve()
  return function inTurn<T>(task: () => Promise<T>): Promise<T> {
    // `then(task, task)`: the next task runs whether this one succeeded or failed.
    const result = previous.then(task, task)
    previous = result
    return result
  }
}
