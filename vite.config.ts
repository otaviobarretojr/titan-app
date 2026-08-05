import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/titan-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'icons/titan.svg',
        'icons/titan-maskable.svg',
      ],
      manifest: {
        name: 'TITAN v1.0',
        short_name: 'TITAN',
        description:
          'TITAN v1.0.0 — sistema operacional de performance pessoal para treino, nutrição, cardio e evolução.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'portrait',
        lang: 'pt-BR',
        categories: ['health', 'fitness', 'productivity'],
        id: './',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/titan.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/titan-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        globPatterns: [
          '**/*.{js,css,html,svg,png,webp,json}',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'titan-pages', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'titan-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
})
