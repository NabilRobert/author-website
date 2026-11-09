/**
 * The API, as a Hono app. It runs as a Cloudflare Pages Function
 * (functions/api/[[path]].ts), so every request to /api/* lands here.
 *
 *   /api/auth/*        login with an emailed code (Better Auth, server/auth.ts)
 *   /api/sites/...     anyone: a site's content, reporting a page (server/public-routes.ts)
 *   /api/images/...    anyone: pictures (server/image-routes.ts)
 *   /api/me/...        the logged-in person's own site (server/me-routes.ts)
 */
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createAuth } from './auth'
import type { Auth } from './auth'
import { contactMessageSender, emailCodeSender } from './email'
import type { SendContactMessage, SendEmailCode } from './email'
import { contactRoutes } from './contact-messages'
import type { Env } from './env'
import type { AppEnv } from './session'
import { publicRoutes } from './public-routes'
import { imageServeRoutes } from './image-routes'
import { fileServeRoutes } from './file-routes'
import { meRoutes } from './me-routes'

interface AppOptions {
  /** How emailed codes are sent; tests pass one that keeps them. */
  emailCodeSenderFor?: (env: Env) => SendEmailCode
  /** How contact-form messages are sent; tests pass one that keeps them. */
  contactMessageSenderFor?: (env: Env) => SendContactMessage
}

export function createApp({
  emailCodeSenderFor = emailCodeSender,
  contactMessageSenderFor = contactMessageSender,
}: AppOptions = {}) {
  const app = new Hono<AppEnv>().basePath('/api')

  // Better Auth starts setting itself up (reading the database) as soon as
  // it is created, so it is created on first use: public pages, pictures
  // and requests refused early never start it.
  app.use('*', async (c, next) => {
    let auth: Auth | undefined
    c.set('auth', () => (auth ??= createAuth(c.env, emailCodeSenderFor(c.env))))
    c.set('sendContactMessage', (message) => contactMessageSenderFor(c.env)(message))
    await next()
  })
  app.on(['GET', 'POST'], '/auth/*', (c) => c.var.auth().handler(c.req.raw))
  app.route('/', publicRoutes)
  app.route('/', contactRoutes)
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
