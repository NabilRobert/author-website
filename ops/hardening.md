# Hardening the server in front of Framed

Steps for Arthur, or for the session that looks after the server, after
Framed is running (README, "Run it on a server"). The app already protects
itself:
- it caps API request bodies at 64 KB;
- it believes `CF-Connecting-IP` only from Cloudflare (`server/node/client-ip.ts`);
- it locks an account after 10 wrong passwords.

These steps add the same protections at the edge, so bad traffic never
reaches the container. Check each config before reloading.

## 1. Let only Cloudflare reach framed.my.id

Cloudflare's address ranges are published at
<https://www.cloudflare.com/ips-v4> and <https://www.cloudflare.com/ips-v6>.
Fetch them fresh when you set this up; the list below was current on
2026-11-10.

### Option A, in Caddy (recommended)

This applies to framed.my.id only, so other sites on the server are
unaffected. In the `framed.my.id` site block:

```caddyfile
framed.my.id {
	# Anyone not connecting from Cloudflare is refused.
	@not_cloudflare not remote_ip 173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32
	respond @not_cloudflare 403

	# The app refuses API bodies over 64 KB; this stops larger ones earlier.
	# 11 MB leaves room for PDF uploads (10 MB).
	request_body {
		max_size 11MB
	}

	reverse_proxy 127.0.0.1:8790
}
```

- `remote_ip` is the address that actually connected, so it can't be faked
  with a header.
- Don't add a `header_up X-Forwarded-For …` line. Framed reads the last
  address in that header to know who connected. Caddy's default is right.
- Test the config, then reload:
  `caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`.
  If Caddy runs in Docker, use `docker exec <caddy> caddy validate …` and
  `caddy reload`.
- Then check: `curl -sI https://framed.my.id/` returns 200 (through
  Cloudflare). From another machine, connecting straight to the server's
  address with `--resolve framed.my.id:443:<server address>` returns 403.

### Option B, in the firewall (ufw)

Use this only if **every** site on ports 80 and 443 is behind Cloudflare,
and Caddy runs on the host rather than in Docker. Docker-published ports
skip ufw's rules. Leave the SSH rule alone.

```bash
for range in $(curl -s https://www.cloudflare.com/ips-v4) $(curl -s https://www.cloudflare.com/ips-v6); do
  sudo ufw allow proto tcp from "$range" to any port 80,443 comment 'Cloudflare'
done
sudo ufw status numbered      # find the old "80,443/tcp ALLOW Anywhere" rules
sudo ufw delete <number>      # remove them, one at a time, renumbering after each
```

### Stronger, optional: Authenticated Origin Pulls

Cloudflare can show a client certificate to the server, and Caddy can
refuse any TLS connection without it. Turn it on in Cloudflare →
SSL/TLS → Origin Server → Authenticated Origin Pulls. Then add to the
site block:

```caddyfile
	tls {
		client_auth {
			mode require_and_verify
			trusted_ca_cert_file /etc/caddy/cloudflare-origin-pull-ca.pem
		}
	}
```

Download that file from Cloudflare's documentation.

## 2. Check the security headers arrive

The app sends a CSP, HSTS and the other headers itself (`public/_headers`).
After a redeploy:

```bash
curl -sI https://framed.my.id/ | grep -iE "content-security-policy|strict-transport-security|x-frame-options"
```

Expect all three. If Caddy or Cloudflare strips or overrides them, remove
that rule rather than repeating the headers there.
