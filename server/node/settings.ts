/**
 * Settings for the Node version (server/node/main.ts). Each comes from an
 * environment variable or, for secrets, a Docker secret file named after it
 * in lower case (BETTER_AUTH_SECRET → /run/secrets/better_auth_secret), the
 * same convention as Juku's ops/compose.yaml.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SECRETS_DIR = '/run/secrets'

export function readSetting(
  name: string,
  environment: NodeJS.ProcessEnv = process.env,
  secretsDir = SECRETS_DIR,
): string | undefined {
  const fromEnvironment = environment[name]
  if (fromEnvironment) return fromEnvironment
  const secretFile = join(secretsDir, name.toLowerCase())
  return existsSync(secretFile) ? readFileSync(secretFile, 'utf8').trim() : undefined
}

export function requireSetting(name: string, environment?: NodeJS.ProcessEnv, secretsDir?: string): string {
  const value = readSetting(name, environment, secretsDir)
  if (!value) throw new Error(`${name} is not set: add it to ops/.env (or as a secret file), then restart.`)
  return value
}
