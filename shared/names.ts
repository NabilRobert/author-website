/**
 * The rules for a site's name, the part of the address after
 * framed.my.id/. Shared by the sign-up form and the API.
 */
import { z } from 'zod'

// Addresses Framed uses itself, and names that would pass for Framed's own
// staff or help desk (a page at framed.my.id/support asking for passwords).
export const RESERVED_NAMES = new Set([
  // Framed's own addresses
  ...['about', 'api', 'assets', 'edit', 'help', 'login', 'logout', 'privacy', 'terms', 'www'],
  ...['account', 'accounts', 'auth', 'dashboard', 'register', 'settings', 'signin', 'signup', 'sign-in', 'sign-up'],
  ...['blog', 'docs', 'news', 'static', 'status'],
  // Who runs it, or who you'd ask for help
  ...['admin', 'admins', 'administrator', 'root', 'sysadmin', 'superuser', 'system', 'moderator', 'mod', 'mods'],
  ...['staff', 'team', 'official', 'owner', 'support', 'helpdesk', 'security', 'abuse', 'trust', 'safety'],
  ...['billing', 'contact', 'legal', 'dmca', 'report', 'reports', 'verify', 'verified'],
  // Email-style addresses
  ...['mail', 'email', 'info', 'noreply', 'no-reply', 'postmaster', 'hostmaster', 'webmaster'],
])

/** Reserved, or uses "framed" as a word (framed-support, the-framed-team), which would look official. */
export function isReservedName(name: string): boolean {
  return RESERVED_NAMES.has(name) || name.split('-').includes('framed')
}

export const siteNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters.')
  .max(30, 'Use at most 30 characters.')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use letters, numbers and dashes, like "mara-ellison".')
  .refine((name) => !isReservedName(name), 'That name is used by Framed itself. Pick another.')
