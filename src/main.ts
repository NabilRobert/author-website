import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import { createAppRouter } from './router'
import { loadSiteContent } from './content/useSiteContent'
import './styles/main.css'

// The editor loads its own copy (with sign-in); everything else is public.
if (!window.location.pathname.startsWith('/edit')) void loadSiteContent()
createApp(App).use(createAppRouter()).use(createHead()).mount('#app')
