import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const base = process.env.SITE_URL
  ? `${new URL(process.env.SITE_URL).pathname.replace(/\/$/, '')}/`
  : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // React and the JSON database change at different paces from the app code: separate
        // chunks keep them cached across deploys and the entry chunk under the size warning.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/]react(-dom)?[\\/]|node_modules[\\/]scheduler[\\/]/ },
            { name: 'db', test: /[\\/]src[\\/]db[\\/]/ },
          ],
        },
      },
    },
  },
})
