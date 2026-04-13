import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load all VITE_ env vars so we can use them in the proxy config
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  const proxy = {
    // Internal backend proxy
    '/api': { target: 'http://localhost:8000', changeOrigin: true },
  }

  // SFMC proxies — only active in dev to avoid CORS issues.
  // In production, route SFMC calls through your backend instead.
  if (env.VITE_SFMC_AUTH_BASE_URI) {
    proxy['/sfmc-auth'] = {
      target:    env.VITE_SFMC_AUTH_BASE_URI,
      changeOrigin: true,
      rewrite:   (p) => p.replace(/^\/sfmc-auth/, ''),
    }
  }

  if (env.VITE_SFMC_REST_BASE_URI) {
    proxy['/sfmc-rest'] = {
      target:    env.VITE_SFMC_REST_BASE_URI,
      changeOrigin: true,
      rewrite:   (p) => p.replace(/^\/sfmc-rest/, ''),
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: { proxy },
  }
})
