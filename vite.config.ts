import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    allowedHosts: ['51851429.r29.cpolar.top','https://511ffd4d.r29.cpolar.top'],
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://2f47a029.r29.cpolar.top',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
