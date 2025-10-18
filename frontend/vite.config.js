import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const devPort = Number(process.env.VITE_DEV_PORT || 5173)
const backendPort = process.env.VITE_BACKEND_PORT || '5000'
const backendHost = process.env.VITE_BACKEND_HOST || '127.0.0.1'
const devHost = process.env.VITE_DEV_HOST ? process.env.VITE_DEV_HOST : true

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    open: process.env.VITE_E2E ? false : true,
    host: devHost,
    https: false,
    proxy: {
      '/api': {
        // Use explicit IPv4 to avoid Windows/IPv6 localhost issues
        target: `http://${backendHost}:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
