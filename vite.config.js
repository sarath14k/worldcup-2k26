import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { scrapeFifa } from './scripts/fifaScraper.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'sync-live-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/sync-live') {
            try {
              const result = await scrapeFifa();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    watch: {
      ignored: ['**/public/live-matches.json']
    }
  }
})
