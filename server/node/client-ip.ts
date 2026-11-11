/**
 * The visitor's real address on the Node version, passed on to the API in
 * CF-Connecting-IP, the header its rate limits read (server/auth.ts,
 * server/contact-messages.ts). On Cloudflare Pages, Cloudflare sets that
 * header itself; on the VPS a visitor could send it, so it is worked out here.
 *
 * The path is visitor → Cloudflare → Caddy on the VPS → this container.
 * Caddy puts the address that connected to it at the end of
 * X-Forwarded-For. If that address is Cloudflare's, Cloudflare's
 * CF-Connecting-IP names the visitor. If not, someone reached the VPS
 * directly, skipping Cloudflare: their CF-Connecting-IP could say anything,
 * so their own connecting address is used, and faking it buys nothing.
 */
import { BlockList, isIP } from 'node:net'

// From https://www.cloudflare.com/ips/ (checked 2026-11-10). Cloudflare
// rarely changes them; if it does, visitors from a new range are only
// counted by Cloudflare's address in the rate limits until this is updated.
const CLOUDFLARE_RANGES = {
  ipv4: [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
  ],
  ipv6: [
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
  ],
}

const cloudflare = new BlockList()
for (const range of CLOUDFLARE_RANGES.ipv4) addRange(range, 'ipv4')
for (const range of CLOUDFLARE_RANGES.ipv6) addRange(range, 'ipv6')

function addRange(range: string, family: 'ipv4' | 'ipv6') {
  const [network = '', prefix = ''] = range.split('/')
  cloudflare.addSubnet(network, Number(prefix), family)
}

export function isCloudflareAddress(address: string): boolean {
  const family = isIP(address)
  if (family === 0) return false
  return cloudflare.check(address, family === 4 ? 'ipv4' : 'ipv6')
}

/** The visitor's address, or undefined when no proxy said who connected. */
export function clientIpOf(headers: Headers): string | undefined {
  const connectedFrom = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
  if (!connectedFrom || isIP(connectedFrom) === 0) return undefined
  if (!isCloudflareAddress(connectedFrom)) return connectedFrom
  const visitor = headers.get('cf-connecting-ip')?.trim() ?? ''
  return isIP(visitor) === 0 ? connectedFrom : visitor
}

/** The request with CF-Connecting-IP replaced by the address worked out above. */
export function withClientIp(request: Request): Request {
  const headers = new Headers(request.headers)
  headers.delete('cf-connecting-ip')
  const visitor = clientIpOf(request.headers)
  if (visitor) headers.set('cf-connecting-ip', visitor)
  return new Request(request, { headers })
}
