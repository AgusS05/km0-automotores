import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js minificado pesa ~590 kB, pero solo se descarga en las páginas con visor 3D
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // three.js es pesado: va en su propio archivo y solo se descarga en las páginas con visor 3D
        manualChunks: (id: string) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
})
