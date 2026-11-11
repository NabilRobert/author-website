// @vitest-environment node
// ops/backup.sh and ops/restore.sh, run for real under bash with stand-ins
// for docker, age, rclone and curl on PATH, in a throwaway HOME. Each
// stand-in logs its arguments; FAIL_<TOOL>=1 makes that tool fail.
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const OPS = join(import.meta.dirname, '../../ops')
const KEY = 'age1testkeyfrombackupenv'
const S3_SECRET = 'test-s3-secret-value'
const DAY_MS = 24 * 60 * 60 * 1000

const STUBS: Record<string, string> = {
  // exec streams a pretend archive; ps reports $RUNNING_CONTAINER; run keeps what it was sent.
  docker: [
    'case "$1" in',
    '  exec) printf "archive from the container" ;;',
    '  ps) printf "%s" "${RUNNING_CONTAINER:-}" ;;',
    '  run) cat > "$HOME/sent-to-restore" ;;',
    'esac',
  ].join('\n'),
  // -r: "encrypts" stdin into the -o file; -d: prints the decrypted backup.
  age: [
    'out=""; mode=""',
    'while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift ;; -r) mode=encrypt ;; -d) mode=decrypt ;; esac; shift; done',
    'if [ "$mode" = encrypt ]; then { printf "encrypted:"; cat; } > "$out"; else printf "decrypted backup"; fi',
  ].join('\n'),
  rclone: '[ "$1" = copy ] && echo "files at upload: $(ls "$HOME/backups/framed")" >> "$CALLS_LOG"; true',
  curl: 'true',
}

let home: string
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'framed-ops-'))
  mkdirSync(join(home, 'bin'))
  for (const [tool, body] of Object.entries(STUBS)) {
    const path = join(home, 'bin', tool)
    const failWhenAsked = `[ -n "\${FAIL_${tool.toUpperCase()}:-}" ] && exit 1`
    writeFileSync(path, `#!/usr/bin/env bash\necho "${tool} $*" >> "$CALLS_LOG"\n${failWhenAsked}\n${body}\n`)
    chmodSync(path, 0o755)
  }
})
afterEach(() => rmSync(home, { recursive: true, force: true }))

const SETTINGS = {
  AGE_PUBLIC_KEY: KEY,
  BACKUP_S3_ACCESS_KEY_ID: 'test-key-id',
  BACKUP_S3_SECRET_ACCESS_KEY: S3_SECRET,
  BACKUP_S3_BUCKET: 'test-bucket',
  BACKUP_S3_REGION: 'test-region',
  BACKUP_HEALTHCHECK_URL: 'https://hc.example/check',
}

function writeSettings(settings: Record<string, string> = SETTINGS): void {
  const lines = Object.entries(settings).map(([name, value]) => `${name}=${value}`)
  writeFileSync(join(home, 'backup.env'), lines.join('\n') + '\n')
}

function run(script: string, args: string[] = [], extraEnv: Record<string, string> = {}, input = '') {
  const env = {
    ...process.env,
    HOME: home,
    PATH: `${join(home, 'bin')}:${process.env.PATH}`,
    CALLS_LOG: join(home, 'calls.log'),
    FRAMED_BACKUP_SETTINGS: join(home, 'backup.env'),
    ...extraEnv,
  }
  return spawnSync('bash', [join(OPS, script), ...args], { env, input, encoding: 'utf8' })
}

const calls = () => {
  try {
    return readFileSync(join(home, 'calls.log'), 'utf8')
  } catch {
    return ''
  }
}
const backupFiles = () => readdirSync(join(home, 'backups/framed')).sort()

describe('the nightly backup (ops/backup.sh)', () => {
  it('encrypts the archive from the container to the key in backup.env, keeping only that', () => {
    writeSettings()
    const result = run('backup.sh')

    expect(result.status, result.stderr).toBe(0)
    expect(calls()).toContain(`age -r ${KEY} `)
    const files = backupFiles()
    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/^framed-\d{8}-\d{6}\.tar\.age$/)
    expect(readFileSync(join(home, 'backups/framed', files[0] ?? ''), 'utf8')).toBe(
      'encrypted:archive from the container',
    )
  })

  it('uploads the encrypted copy under framed/ in the bucket, keys kept off the command line', () => {
    writeSettings()
    run('backup.sh')

    expect(calls()).toMatch(/rclone copy \S+\.tar\.age :s3:test-bucket\/framed\//)
    expect(calls()).not.toContain(S3_SECRET)
  })

  it('deletes copies older than the kept days, here and in S3, and keeps newer ones', () => {
    writeSettings()
    mkdirSync(join(home, 'backups/framed'), { recursive: true })
    const old = join(home, 'backups/framed/framed-20260101-034700.tar.age')
    const recent = join(home, 'backups/framed/framed-20260102-034700.tar.age')
    writeFileSync(old, 'old')
    writeFileSync(recent, 'recent')
    utimesSync(old, new Date(Date.now() - 15 * DAY_MS), new Date(Date.now() - 15 * DAY_MS))
    utimesSync(recent, new Date(Date.now() - 13 * DAY_MS), new Date(Date.now() - 13 * DAY_MS))

    run('backup.sh')

    expect(backupFiles()).not.toContain('framed-20260101-034700.tar.age')
    expect(backupFiles()).toContain('framed-20260102-034700.tar.age')
    expect(calls()).toContain('rclone delete :s3:test-bucket/framed --min-age 14d --include framed-*.tar.age')
  })

  it('stops before asking the container for anything when a setting is missing', () => {
    writeSettings({ ...SETTINGS, AGE_PUBLIC_KEY: '' })
    const result = run('backup.sh')

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('AGE_PUBLIC_KEY is missing')
    expect(calls()).not.toContain('docker')
  })

  it('refuses a keep-days setting that is not a whole number', () => {
    writeSettings({ ...SETTINGS, BACKUP_KEEP_DAYS: '0' })
    const result = run('backup.sh')

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('BACKUP_KEEP_DAYS must be a whole number')
  })

  it.each(['FAIL_DOCKER', 'FAIL_AGE', 'FAIL_RCLONE'])(
    'with %s: fails, reports it, leaves no half-written file and prunes nothing',
    (failingTool) => {
      writeSettings()
      const result = run('backup.sh', [], { [failingTool]: '1' })

      expect(result.status).not.toBe(0)
      expect(backupFiles().filter((name) => name.endsWith('.partial'))).toEqual([])
      expect(calls()).toContain('curl -fsS -m 10 --retry 3 https://hc.example/check/fail')
      expect(calls()).not.toContain('rclone delete')
    },
  )

  it('clears a half-written file left by a run that was killed', () => {
    writeSettings()
    mkdirSync(join(home, 'backups/framed'), { recursive: true })
    writeFileSync(join(home, 'backups/framed/framed-20260101-034700.tar.age.partial'), 'cut off')
    run('backup.sh')

    expect(backupFiles().filter((name) => name.endsWith('.partial'))).toEqual([])
  })
})

describe('putting a backup back (ops/restore.sh)', () => {
  it('decrypts the backup with the key and hands it to the restore command, offline', () => {
    const result = run('restore.sh', ['backup.tar.age', 'key.txt'])

    expect(result.status, result.stderr).toBe(0)
    expect(calls()).toContain('age -d -i key.txt backup.tar.age')
    expect(calls()).toMatch(
      /docker run --rm -i --network none .*-v framed_framed-data:\/data framed:local node dist-node\/restore-cli\.mjs/,
    )
    expect(readFileSync(join(home, 'sent-to-restore'), 'utf8')).toBe('decrypted backup')
  })

  it('takes an already decrypted backup on standard input with "-", without age', () => {
    const result = run('restore.sh', ['-'], {}, 'decrypted elsewhere')

    expect(result.status, result.stderr).toBe(0)
    expect(calls()).not.toContain('age ')
    expect(readFileSync(join(home, 'sent-to-restore'), 'utf8')).toBe('decrypted elsewhere')
  })

  it('refuses while Framed is still running on the volume', () => {
    const result = run('restore.sh', ['backup.tar.age', 'key.txt'], { RUNNING_CONTAINER: 'abc123' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('docker compose stop framed')
    expect(calls()).not.toContain('age ')
  })

  it('says how to call it when the key is missing', () => {
    const result = run('restore.sh', ['backup.tar.age'])

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('./restore.sh <backup.tar.age> <key file>')
  })
})
