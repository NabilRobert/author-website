/**
 * Framed's addresses. Fixed pages (login, terms, privacy) come first, so
 * nobody can take their names (shared/names.ts reserves them too).
 *
 *   /                      what Framed is (LandingView)
 *   /login                 log in or sign up with an emailed code
 *   /<site>                someone's front page
 *   /<site>/<page>         their other pages
 *   /<site>/edit           their editor, for them only
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouterHistory } from 'vue-router'
import SiteLayout from '@/views/SiteLayout.vue'
import PageView from '@/views/PageView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

// The same rule as shared/names.ts, as a route pattern.
const SITE = ':site([a-z0-9][a-z0-9-]{1,28}[a-z0-9])'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/LandingView.vue') },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  { path: '/terms', name: 'terms', component: () => import('@/views/TermsView.vue') },
  { path: '/privacy', name: 'privacy', component: () => import('@/views/PrivacyView.vue') },
  { path: `/${SITE}/edit`, name: 'edit', component: () => import('@/views/EditView.vue'), props: true },
  {
    path: `/${SITE}`,
    component: SiteLayout,
    props: true,
    children: [
      { path: '', name: 'site-home', component: PageView, props: { slug: '' } },
      {
        path: ':page([a-z0-9-]+)',
        name: 'site-page',
        component: PageView,
        props: (route) => ({ slug: String(route.params.page) }),
      },
    ],
  },
  { path: '/:rest(.*)*', name: 'not-found', component: NotFoundView },
]

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
    scrollBehavior(to, _from, saved) {
      if (saved) return saved
      if (to.hash) return { el: to.hash }
      return { top: 0 }
    },
  })
}
