#!/usr/bin/env bash
# Puts a Framed backup (ops/backup.sh) back into the framed-data volume,
# replacing the database and uploads (server/node/restore-cli.ts). Stop the
# site first; the script refuses while the volume is in use.
#
#   cd ops && docker compose stop framed
#   ./restore.sh ~/backups/framed/framed-20261112-034700.tar.age <age private key file>
#   docker compose start framed
#
# To keep the private key off the server, decrypt on your own computer and
# send the result over ssh instead, with "-" for the backup:
#   age -d -i key.txt framed-….tar.age | ssh <server> 'cd framed/ops && ./restore.sh -'
set -euo pipefail

VOLUME="${FRAMED_VOLUME:-framed_framed-data}"
IMAGE="${FRAMED_IMAGE:-framed:local}"
BACKUP_FILE="${1:-}"
KEY_FILE="${2:-}"

if [ -z "$BACKUP_FILE" ] || { [ "$BACKUP_FILE" != "-" ] && [ -z "$KEY_FILE" ]; }; then
  echo "restore: say which backup and which age private key: ./restore.sh <backup.tar.age> <key file>" >&2
  echo "         (or ./restore.sh - with an already decrypted backup on standard input)" >&2
  exit 1
fi
if [ -n "$(docker ps -q --filter "volume=$VOLUME")" ]; then
  echo "restore: Framed is still running on $VOLUME: run 'docker compose stop framed' first" >&2
  exit 1
fi

decrypted_backup() {
  if [ "$BACKUP_FILE" = "-" ]; then cat; else age -d -i "$KEY_FILE" "$BACKUP_FILE"; fi
}

# The image's own restore command, with no network and a read-only system;
# only the data volume can change.
decrypted_backup | docker run --rm -i --network none --read-only --cap-drop ALL \
  -v "$VOLUME:/data" "$IMAGE" node dist-node/restore-cli.mjs
