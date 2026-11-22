#!/usr/bin/env bash
# Makes ops/secrets/ for Framed on a server: a fresh random login secret,
# and the Resend API key, which it asks for without showing it. It never
# overwrites a file that exists, so rerunning it is safe. Run once per
# server, by Arthur.
#
# The folder is private (700) but the files are readable (644): Compose
# mounts secret files with the host's owner and mode, and the container runs
# as another user (10001), so it couldn't read a 600 file. The folder still
# keeps other users on the host out.
set -euo pipefail
cd "$(dirname "$0")"
umask 077
mkdir -p secrets
cd secrets

[[ -s better_auth_secret ]] || openssl rand -base64 32 >better_auth_secret
if [[ ! -s resend_api_key ]]; then
    read -r -s -p "Resend API key (not shown): " key
    echo
    [[ -n "$key" ]] || { echo "No key given; run this again when you have it." >&2; exit 1; }
    printf '%s\n' "$key" >resend_api_key
fi
chmod 700 .
chmod 644 better_auth_secret resend_api_key
echo "ops/secrets/ is ready."
