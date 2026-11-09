import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    // The API runs in `wrangler pages dev` (npm run dev:api) on port 8788.
    proxy: { '/api': 'http://localhost:8788' },
  },
  test: {
    environment: 'jsdom',
  },
})
