/**
 * The rules for a site's name, the part of the address after
 * framed.my.id/. Shared by the sign-up form and the API.
 */
import { z } from 'zod'

// Addresses Framed uses itself, so nobody can take them as a name.
export const RESERVED_NAMES = new Set([
  'about',
  'admin',
  'api',
  'assets',
  'edit',
  'framed',
  'help',
  'login',
  'privacy',
  'terms',
  'www',
])

export const siteNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use at least 3 characters.')
  .max(30, 'Use at most 30 characters.')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use letters, numbers and dashes, like "mara-ellison".')
  .refine((name) => !RESERVED_NAMES.has(name), 'That name is used by Framed itself. Pick another.')
