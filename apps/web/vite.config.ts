import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/thcs/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/thcs/api': {
        target: 'https://vie.info.vn',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/thcs/api': {
        target: 'https://vie.info.vn',
        changeOrigin: true,
      },
    },
  },
})
