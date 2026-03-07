import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];

          // Only rewrite if it's NOT a file request (doesn't have a dot)
          // and NOT an internal Vite request or API call
          if (!url.includes('.') &&
            !url.startsWith('/@') &&
            !url.startsWith('/api') &&
            !url.startsWith('/node_modules')) {

            if (url.startsWith('/driver')) {
              console.log(`📡 [Rewrite] ${url} -> /driver.html`);
              req.url = '/driver.html';
            } else {
              console.log(`📡 [Rewrite] ${url} -> /index.html`);
              req.url = '/index.html';
            }
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
