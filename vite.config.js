import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
    manifest: {
      name: "O'HINA · Quản lý Spa", short_name: "O'HINA", lang: 'vi',
      description: 'Chăm chút từng khoảnh khắc, nâng niu mỗi trải nghiệm.', start_url: '/', scope: '/', display: 'standalone',
      background_color: '#faf8f3', theme_color: '#aa843f',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }],
      cleanupOutdatedCaches: true,
    },
  })],
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: { '/api': 'http://localhost:5000' },
  },
  test: { include: ['src/**/*.test.{js,jsx}'], environment: 'jsdom', setupFiles: './src/test/setup.js', globals: true },
})