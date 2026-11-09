/**
 * The local test account: it logs in without a code, but only on a local
 * development server (server/dev-routes.ts says exactly when). It owns the
 * page at /test, made by `npm run db:seed:test`.
 */
export const TEST_ACCOUNT_EMAIL = 'test@framed.local'
export const TEST_ACCOUNT_SITE = 'test'
