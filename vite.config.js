import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'KasFlow - Manajemen Keuangan',
        short_name: 'KasFlow',
        description: 'Sistem pencatatan keuangan untuk usaha.',
        theme_color: '#087f68',
        background_color: '#f5f7f6',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache semua asset statis utama
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Hindari runtime caching pada endpoint Supabase (Auth & Database REST)
        // untuk menjamin kesegaran data finansial real-time dan mencegah kebocoran sesi/token.
        runtimeCaching: []
      }
    })
  ],
})
