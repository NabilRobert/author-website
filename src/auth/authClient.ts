/**
 * Better Auth's browser side: asks for a login code, logs in with it, and
 * logs out. The server side is server/auth.ts; both talk over /api/auth.
 */
import { createAuthClient } from 'better-auth/vue'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({ basePath: '/api/auth', plugins: [emailOTPClient()] })
