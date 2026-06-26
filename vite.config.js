import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { scrapeFifa } from './server/scrapers/fifa.js'
import { handleHighlightsRoute } from './server/scrapers/highlights.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',
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
          } else if (req.url === '/api/all-highlights') {
            const cachePath = path.join(__dirname, 'src/data/highlights-cache.json');
            try {
              const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(JSON.stringify(data));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          } else if (req.url.startsWith('/api/player-detail/')) {
            const playerId = req.url.split('/').pop();
            const detailsPath = path.join(__dirname, 'src/data/fotmobPlayerDetails.json');
            try {
              const details = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
              const player = details[playerId];
              if (player) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.end(JSON.stringify(player));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Player not found' }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
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
