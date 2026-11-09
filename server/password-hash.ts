/**
 * Password hashing for Better Auth (server/auth.ts), with PBKDF2-SHA256 from
 * Web Crypto.
 *
 * Why not Better Auth's default (scrypt in JavaScript): it takes roughly
 * 50-100 ms of CPU per login, and Cloudflare's free plan allows about 10 ms
 * a request. PBKDF2 runs natively in the Workers runtime. Workers' Web Crypto
 * refuses more than 100,000 rounds, which is below OWASP's 600,000 for
 * PBKDF2-SHA256; refusing passwords found in data breaches (haveIBeenPwned,
 * server/auth.ts) makes up part of the gap.
 *
 * Each hash is stored as "pbkdf2-sha256$<rounds>$<salt>$<hash>" (base64),
 * so if the round count is raised later, old hashes still check against
 * their own count.
 */
const ALGORITHM = 'pbkdf2-sha256'
const ROUNDS = 100_000 // the most Workers' Web Crypto allows
const SALT_BYTES = 16
const HASH_BITS = 256

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, ROUNDS)
  return [ALGORITHM, ROUNDS, toBase64(salt), toBase64(hash)].join('$')
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [algorithm, rounds, salt, expected] = hash.split('$')
  if (algorithm !== ALGORITHM || !rounds || !salt || !expected) return false
  const actual = await derive(password, fromBase64(salt), Number(rounds))
  return isSameBytes(actual, fromBase64(expected))
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, rounds: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds },
    key,
    HASH_BITS,
  )
  return new Uint8Array(bits)
}

// Compares every byte even after a difference, so the time taken doesn't
// tell an attacker how much of a guess was right.
function isSameBytes(first: Uint8Array, second: Uint8Array): boolean {
  if (first.length !== second.length) return false
  let difference = 0
  for (let index = 0; index < first.length; index++) difference |= first[index]! ^ second[index]!
  return difference === 0
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (character) => character.charCodeAt(0))
}
