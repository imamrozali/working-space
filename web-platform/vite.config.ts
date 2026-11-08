import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Non-predictable port bound to loopback for secure local operation
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.VITE_PORT) || 38291

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host: '127.0.0.1',
    },
  }
})
