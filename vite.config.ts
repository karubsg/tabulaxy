import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // BURASI ÇOK ÖNEMLİ: GitHub repo adını başına ve sonuna / koyarak yaz.
  // Örneğin repo adın "my-game-app" ise base: '/my-game-app/' olmalı.
  base: '/tabulaxy/', 
  plugins: [react()],
  server: {
    host: true 
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})
