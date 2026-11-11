#!/usr/bin/env bash
# Nightly encrypted backup of Framed on the VPS: the database (copied safely
# while the site runs) and the uploaded pictures and PDFs, as one tar stream
# from the container (server/node/backup-cli.ts), encrypted with age as it
# arrives. No unencrypted copy is ever written to the host's disk. Then the
# encrypted file goes to S3 with rclone, and copies older than
# BACKUP_KEEP_DAYS (14 by default) are deleted, here and in S3.
#
# Run by cron on the host (README, "Backups"):
#   47 3 * * * $HOME/framed/ops/backup.sh >> $HOME/backups/framed/backup.log 2>&1
#
# Settings come from ops/backup.env at run time (copy ops/backup.env.example).
# They are kept out of ops/.env on purpose: that file is passed into the
# container, and the S3 keys have no business there. The age public key can
# only encrypt; the private key stays off the server.
#
# Pattern from MCP-backbone's deploy/backup_bookkeeping.sh (commit fe5d10c).
set -euo pipefail
umask 077

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETTINGS_FILE="${FRAMED_BACKUP_SETTINGS:-$OPS_DIR/backup.env}"
BACKUP_DIR="$HOME/backups/framed"
DEFAULT_KEEP_DAYS=14
DEFAULT_CONTAINER=framed-framed-1

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "backup: $SETTINGS_FILE is missing: copy ops/backup.env.example to it and fill it in" >&2
  exit 1
fi

# The value of one setting, or $2 when it's unset.
setting() {
  local value
  value="$(grep "^$1=" "$SETTINGS_FILE" | tail -n 1 | cut -d= -f2- || true)"
  printf '%s' "${value:-${2:-}}"
}

require() {
  local value
  value="$(setting "$1")"
  if [ -z "$value" ]; then
    echo "backup: $1 is missing from $SETTINGS_FILE" >&2
    exit 1
  fi
  printf '%s' "$value"
}

HEALTHCHECK_URL="$(setting BACKUP_HEALTHCHECK_URL)"
ping_healthcheck() {
  if [ -n "$HEALTHCHECK_URL" ]; then curl -fsS -m 10 --retry 3 "$HEALTHCHECK_URL$1" >/dev/null || true; fi
}
# Whatever happens, no half-written backup stays behind, and a failure is reported.
trap 'status=$?; if [ -n "${OUT:-}" ]; then rm -f -- "$OUT.partial"; fi; if [ "$status" -ne 0 ]; then ping_healthcheck /fail; fi' EXIT
ping_healthcheck /start

# Check every setting before backing anything up.
AGE_PUBLIC_KEY="$(require AGE_PUBLIC_KEY)"
S3_ACCESS_KEY_ID="$(require BACKUP_S3_ACCESS_KEY_ID)"
S3_SECRET_ACCESS_KEY="$(require BACKUP_S3_SECRET_ACCESS_KEY)"
S3_BUCKET="$(require BACKUP_S3_BUCKET)"
S3_REGION="$(require BACKUP_S3_REGION)"
KEEP_DAYS="$(setting BACKUP_KEEP_DAYS "$DEFAULT_KEEP_DAYS")"
CONTAINER="$(setting FRAMED_CONTAINER "$DEFAULT_CONTAINER")"
if ! [[ "$KEEP_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "backup: BACKUP_KEEP_DAYS must be a whole number of days, like 14 (it is \"$KEEP_DAYS\")" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
# A run killed outright (power loss) skips the trap; clear what it left.
rm -f -- "$BACKUP_DIR"/framed-*.partial

OUT="$BACKUP_DIR/framed-$(date -u +%Y%m%d-%H%M%S).tar.age"
docker exec "$CONTAINER" node dist-node/backup-cli.mjs | age -r "$AGE_PUBLIC_KEY" -o "$OUT.partial"
mv "$OUT.partial" "$OUT"

# Credentials via environment variables, not arguments, so they don't show in ps.
export RCLONE_S3_PROVIDER=AWS
export RCLONE_S3_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID"
export RCLONE_S3_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY"
export RCLONE_S3_REGION="$S3_REGION"
export RCLONE_S3_NO_CHECK_BUCKET=true
REMOTE=":s3:$S3_BUCKET/framed"

# Upload first: a failed upload stops the script before anything is pruned,
# and pruning only ever follows a fresh copy, so the newest one always stays.
rclone copy "$OUT" "$REMOTE/"

find "$BACKUP_DIR" -maxdepth 1 -name 'framed-*.tar.age' -mmin +$((KEEP_DAYS * 24 * 60)) -delete
rclone delete "$REMOTE" --min-age "${KEEP_DAYS}d" --include 'framed-*.tar.age'

echo "backup: $(basename "$OUT") uploaded; copies older than $KEEP_DAYS days removed"
ping_healthcheck ""
