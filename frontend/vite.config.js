import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const configuredBasePath = env.VITE_BASE_PATH?.trim()
  const defaultBasePath = env.GITHUB_ACTIONS === 'true' ? '/RitmoApi/' : '/'
  const basePath = configuredBasePath || defaultBasePath
  const normalizedBasePath = basePath.startsWith('/')
    ? (basePath.endsWith('/') ? basePath : `${basePath}/`)
    : `/${basePath}/`

  return {
    base: normalizedBasePath,
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('recharts')) return 'charts'
            if (id.includes('lucide-react')) return 'icons'
            if (
              id.includes('react-router-dom') ||
              id.includes('react-dom') ||
              id.includes('/react/') ||
              id.includes('\\react\\')
            ) return 'react'
          },
        },
      },
    },
  }
})
