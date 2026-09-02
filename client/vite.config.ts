import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/wheredle/',
  plugins: [react()],
  server: {
    port: 5317,
  },
})
