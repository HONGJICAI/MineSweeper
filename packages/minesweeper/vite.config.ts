import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const host = process.env.TAURI_DEV_HOST;
const isWeb = process.env.VITE_PLATFORM === 'web';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA only for web builds — Tauri ships its own native shell.
    ...(isWeb ? [VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'MineSweeper',
        short_name: 'MineSweeper',
        description: 'Classic Minesweeper game',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    })] : []),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    // Replace process.env with import.meta.env for Vite
    __PLATFORM__: JSON.stringify('web'),
  },
  // Use the src directory as the root for assets
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    host: host || false,
    open: false,
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
})
