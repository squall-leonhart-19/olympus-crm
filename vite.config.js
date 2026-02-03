import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Olympus Command Center',
        short_name: 'Olympus',
        description: 'High-performance team operations and task management',
        theme_color: '#d4af37',
        background_color: '#0d0f12',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Tasks',
            short_name: 'Tasks',
            url: '/tasks',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Command Center',
            short_name: 'ECC',
            url: '/ecc',
            icons: [{ src: '/icons/icon-96.png', sizes: '96x96' }]
          }
        ],
        categories: ['business', 'productivity']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
