import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { scrapeFifa } from './server/scrapers/fifa.js'
import { handleHighlightsRoute } from './server/scrapers/highlights.js'

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
          } else if (req.url.startsWith('/api/match-highlights')) {
            await handleHighlightsRoute(req, res);
          } else {
            next();
          }
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        }
      }
    }
  },
  server: {
    watch: {
      ignored: [
        '**/public/live-matches.json',
        '**/public/live-player-ratings.json',
        '**/public/*.tmp'
      ]
    }
  }
})
