/**
 * Better Auth's browser side: signs up, logs in with a password, confirms
 * an email or resets a password with an emailed code, and logs out. The server side is server/auth.ts; both talk over /api/auth.
 */
import { createAuthClient } from 'better-auth/vue'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({ basePath: '/api/auth', plugins: [emailOTPClient()] })
