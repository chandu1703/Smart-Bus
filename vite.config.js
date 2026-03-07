import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-driver',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.includes('/driver/') || req.url === '/driver') {
            req.url = '/driver.html';
          }
          next();
        });
      },
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        driver: resolve(__dirname, 'driver.html'),
      },
    },
  },
})
