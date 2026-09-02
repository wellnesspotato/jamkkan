import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages repository: https://<username>.github.io/jamkkan/
  base: '/jamkkan/',
  plugins: [react()],
})
