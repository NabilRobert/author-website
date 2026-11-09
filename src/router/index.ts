import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouterHistory } from 'vue-router'
import PageView from '@/views/PageView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const routes: RouteRecordRaw[] = [
  // Every page the owner built: '/' is the front page, '/books' the page
  // whose address is 'books'. An address with no page shows "not found".
  { path: '/:slug([a-z0-9-]*)', name: 'page', component: PageView, props: true },
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
