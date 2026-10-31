import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const base = process.env.SITE_URL
  ? `${new URL(process.env.SITE_URL).pathname.replace(/\/$/, '')}/`
  : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
