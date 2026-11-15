import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  // Always use port 5173 (the backend only allows this origin). If it is busy,
  // stop with an error instead of silently moving to 5174, where the API is blocked.
  server: {
    port: 5173,
    strictPort: true
  },
})
