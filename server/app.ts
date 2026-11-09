/**
 * The API, as a Hono app. It runs as a Cloudflare Pages Function
 * (functions/api/[[path]].ts), so every request to /api/* lands here.
 *
 *   /api/auth/*        login with an emailed code (Better Auth, server/auth.ts)
 *   /api/sites/...     anyone: a site's content, reporting a page (server/public-routes.ts)
 *   /api/images/...    anyone: pictures (server/image-routes.ts)
 *   /api/me/...        the logged-in person's own site (server/me-routes.ts)
 *   /api/dev/...       local development only (server/dev-routes.ts)
 */
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createAuth } from './auth'
import type { Auth } from './auth'
import { loginCodeSender } from './email'
import type { SendLoginCode } from './email'
import type { Env } from './env'
import type { AppEnv } from './session'
import { publicRoutes } from './public-routes'
import { imageServeRoutes } from './image-routes'
import { meRoutes } from './me-routes'
import { devRoutes } from './dev-routes'

interface AppOptions {
  /** How login codes are sent; tests pass one that keeps them. */
  loginCodeSenderFor?: (env: Env) => SendLoginCode
}

export function createApp({ loginCodeSenderFor = loginCodeSender }: AppOptions = {}) {
  const app = new Hono<AppEnv>().basePath('/api')

  // Better Auth starts setting itself up (reading the database) as soon as
  // it is created, so it is created on first use: public pages, pictures
  // and requests refused early never start it.
  app.use('*', async (c, next) => {
    let auth: Auth | undefined
    c.set('auth', () => (auth ??= createAuth(c.env, loginCodeSenderFor(c.env))))
    await next()
  })
  app.on(['GET', 'POST'], '/auth/*', (c) => c.var.auth().handler(c.req.raw))
  app.route('/', publicRoutes)
  app.route('/', imageServeRoutes)
  app.route('/me', meRoutes)
  // Local development only; answers 404 everywhere else (server/dev-routes.ts).
  app.route('/dev', devRoutes)

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
