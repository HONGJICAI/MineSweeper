import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    open: true,
  }, 
  envPrefix: ['VITE_', 'TAURI_ENV_*'],

})
