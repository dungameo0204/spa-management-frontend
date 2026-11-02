import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_PROXY_TARGET')
  return {
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'icons/rosa-logo.jpg'],
      manifest: {
        name: 'ROSA · Quản lý Spa', short_name: 'ROSA', lang: 'vi',
        description: 'Không gian quản lý spa của bạn', start_url: '/', scope: '/', display: 'standalone',
        background_color: '#f3f7fa', theme_color: '#176799',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }],
        cleanupOutdatedCaches: true,
      },
    })],
    server: {
      allowedHosts: ['.trycloudflare.com'],
      proxy: { '/api': env.API_PROXY_TARGET || 'http://127.0.0.1:5002' },
    },
    test: { include: ['src/**/*.test.{js,jsx}'], environment: 'jsdom', setupFiles: './src/test/setup.js', globals: true },
  }
})
