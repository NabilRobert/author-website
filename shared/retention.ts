/**
 * How long Framed keeps things that the privacy page (src/views/PrivacyView.vue)
 * states, in one place so the page and the code can't drift apart. Backups
 * aren't here: their default is in ops/backup.sh, and a test keeps the page in
 * step with it (tests/api/deploy-config.spec.ts).
 */
export const DAY_MS = 24 * 60 * 60 * 1000

/** Page views, counted per page per day (server/visits.ts). */
export const VISIT_KEEP_DAYS = 90

/** Wrong-password attempts lock an account for this long (server/sign-in-lockout.ts). */
export const SIGN_IN_LOCK_MINUTES = 15

/** Emailed codes expire after this long (server/auth.ts). */
export const CODE_LIFETIME_MINUTES = 10
