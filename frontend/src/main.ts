// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'

import App from '@/App.vue'
import { i18n } from '@/i18n'
import { router } from '@/router'
import '@/styles/tokens.css'
import '@/styles/app.css'

createApp(App).use(createPinia()).use(i18n).use(router).mount('#app')
registerSW({ immediate: true })
