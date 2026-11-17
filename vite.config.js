import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps asset paths relative so the build works at any GitHub Pages sub-path
export default defineConfig({
  base: './',
  plugins: [react()],
})
