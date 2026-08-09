import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  // MapLibre GL loads its own code as a module Worker. Vite's dev-server dependency
  // pre-bundling rewrites that worker's import path and serves it with a MIME type
  // Firefox refuses for workers (Chrome is more lenient), so the worker silently
  // fails to load and GeoJSON layers never get tessellated into visible geometry.
  // Excluding it from pre-bundling lets the worker resolve natively instead.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
