// Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'StrokeCare',
        short_name: 'StrokeCare',
        description: 'Stroke prevention education and clinician-guided recovery at home.',
        theme_color: '#4338CA',
        background_color: '#F5F7FB',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/static\//, /^\/healthz/],
        // Only public content is cached for offline use. Personal health data is never cached by the service worker.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /^\/api\/v1\/(education|talk-board|emergency|home-visit-checklist)\//.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'public-content' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8000', '/healthz': 'http://localhost:8000' },
  },
  build: { chunkSizeWarningLimit: 600 },
})
