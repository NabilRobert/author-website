/**
 * The API, as a Hono app. It runs as a Cloudflare Pages Function
 * (functions/api/[[path]].ts), so every request to /api/* lands here.
 *
 *   /api/auth/*        accounts: email and password, emailed codes to confirm and reset (Better Auth, server/auth.ts)
 *   /api/sites/...     anyone: a site's content, reporting a page (server/public-routes.ts)
 *   /api/images/...    anyone: pictures (server/image-routes.ts)
 *   /api/me/...        the logged-in person's own site (server/me-routes.ts)
 */
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { bodyLimit } from 'hono/body-limit'
import { createMiddleware } from 'hono/factory'
import { createAuth } from './auth'
import type { Auth } from './auth'
import { contactMessageSender, emailCodeSender, reportNoticeSender } from './email'
import type { SendContactMessage, SendEmailCode, SendReportNotice } from './email'
import { contactRoutes } from './contact-messages'
import { visitCountRoutes } from './visits'
import { guardSignUp, signUpRoutes } from './invites'
import { guardSignIn, unlockOnReset } from './sign-in-lockout'
import { featureRoutes } from './storage'
import type { Env } from './env'
import { secretProblem } from './env'
import type { AppEnv } from './session'
import { publicRoutes } from './public-routes'
import { reportRoutes } from './reports'
import { imageServeRoutes } from './image-routes'
import { fileServeRoutes } from './file-routes'
import { meRoutes } from './me-routes'

// Every API request body is read whole into memory, and the Node version's
// container has 256 MB, so one huge POST could crash it. Forms and logins are
// a few kilobytes; the routes listed below set their own, larger limits.
export const MAX_REQUEST_BYTES = 64 * 1024
const ROUTES_WITH_OWN_LIMIT = new Set(['PUT /api/me/content', 'POST /api/me/images', 'POST /api/me/files'])
const TOO_LARGE = 'That request is too large.'

const sharedBodyLimit = bodyLimit({
  maxSize: MAX_REQUEST_BYTES,
  onError: (c) => c.json({ error: TOO_LARGE }, 413),
})

const limitRequestSize = createMiddleware<AppEnv>((c, next) => {
  if (ROUTES_WITH_OWN_LIMIT.has(`${c.req.method} ${c.req.path}`)) return next()
  return sharedBodyLimit(c, next)
})

// Fail closed: without a real BETTER_AUTH_SECRET nothing runs, so a preview
// or a half-set-up deployment can't sign logins with Better Auth's public
// default or touch the live database. The reason goes to the logs only.
const refuseWithoutSecret = createMiddleware<AppEnv>(async (c, next) => {
  const problem = secretProblem(c.env)
  if (problem) {
    console.error(problem)
    return c.json({ error: "Framed isn't set up on this address yet." }, 503)
  }
  await next()
})

interface AppOptions {
  /** How emailed codes are sent; tests pass one that keeps them. */
  emailCodeSenderFor?: (env: Env) => SendEmailCode
  /** How contact-form messages are sent; tests pass one that keeps them. */
  contactMessageSenderFor?: (env: Env) => SendContactMessage
  /** How report notices are sent; tests pass one that keeps them. */
  reportNoticeSenderFor?: (env: Env) => SendReportNotice
}

export function createApp({
  emailCodeSenderFor = emailCodeSender,
  contactMessageSenderFor = contactMessageSender,
  reportNoticeSenderFor = reportNoticeSender,
}: AppOptions = {}) {
  const app = new Hono<AppEnv>().basePath('/api')

  app.use('*', refuseWithoutSecret, limitRequestSize)
  // Better Auth starts setting itself up (reading the database) as soon as
  // it is created, so it is created on first use: public pages, pictures
  // and requests refused early never start it.
  app.use('*', async (c, next) => {
    let auth: Auth | undefined
    c.set('auth', () => (auth ??= createAuth(c.env, emailCodeSenderFor(c.env))))
    c.set('sendContactMessage', (message) => contactMessageSenderFor(c.env)(message))
    c.set('sendReportNotice', (notice) => reportNoticeSenderFor(c.env)(notice))
    await next()
  })
  // Invite-only sign-up is checked before Better Auth sees the request (server/invites.ts).
  app.post('/auth/sign-up/email', guardSignUp)
  // A per-account lockout, on top of Better Auth's per-address limits (server/sign-in-lockout.ts).
  app.post('/auth/sign-in/email', guardSignIn)
  app.post('/auth/email-otp/reset-password', unlockOnReset)
  app.on(['GET', 'POST'], '/auth/*', (c) => c.var.auth().handler(c.req.raw))
  app.route('/', signUpRoutes)
  app.route('/', featureRoutes)
  app.route('/', publicRoutes)
  app.route('/', reportRoutes)
  app.route('/', contactRoutes)
  app.route('/', visitCountRoutes)
  app.route('/', imageServeRoutes)
  app.route('/', fileServeRoutes)
  app.route('/me', meRoutes)

  app.notFound((c) => c.json({ error: `There is no API address ${c.req.method} ${c.req.path}.` }, 404))
  // Details go to the Cloudflare logs; the browser gets a message a person
  // can act on, without internals.
  app.onError((error, c) => {
    // A deliberate refusal (like csrf()'s 403) keeps its own answer.
    if (error instanceof HTTPException) return error.getResponse()
    console.error(error)
    return c.json({ error: 'Something went wrong on the server. Try again in a minute.' }, 500)
  })
  return app
}

export const app = createApp()
