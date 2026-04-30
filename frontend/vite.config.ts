import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' = SW takes over on next page load when a new build ships;
      // good UX for an MR app where users keep the tab open all day.
      registerType: 'autoUpdate',

      // Inject a Web App Manifest so iOS/Android browsers offer "Add to Home Screen".
      manifest: {
        name: 'ZenX MR App',
        short_name: 'ZenX',
        description: 'Pharmaceutical Sales Force Automation — daily field tools for MRs.',
        theme_color: '#0a3d62',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png' },
          { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },

      // Workbox config: precache the build output, network-first for API calls
      // (so live data wins when online), cache-first for static assets.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Don't precache the seed-data .sql / .docx files if they're ever copied to dist
        globIgnores: ['**/*.sql', '**/*.docx'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],   // don't serve index.html for API calls
        runtimeCaching: [
          {
            // API calls: try network first, fall back to cache when offline.
            // The IndexedDB queue (utils/offlineQueue.ts) handles writes; this
            // handles reads so a flaky connection still shows cached data.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'zenx-api',
              networkTimeoutSeconds: 8,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images / fonts / icons: cache aggressively.
            urlPattern: ({ request }) =>
              ['image', 'font', 'style'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'zenx-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // Auto-register the service worker via virtual module 'virtual:pwa-register'
      // (we import this from src/utils/registerSW.ts).
      injectRegister: null,

      // Local dev: enable SW in `npm run dev` so behaviour can be tested.
      devOptions: {
        enabled: false, // keep off by default — flip to true when debugging SW behaviour
        type: 'module',
      },
    }),
  ],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  appType: 'spa',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
