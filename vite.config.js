import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/predict': {
        target: 'https://oil-spillage-detection.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
