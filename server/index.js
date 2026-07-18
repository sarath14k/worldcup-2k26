import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { registerRoutes } from './routes.js';
import { startSchedulers } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

registerRoutes(app);

app.use(express.static(path.join(__dirname, '../dist')));

app.use((req, res) => {
  const htmlPath = path.join(__dirname, '../dist', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  try {
    const livePaths = [
      path.join(__dirname, '../public', 'live-matches.json'),
      path.join(__dirname, '../dist', 'live-matches.json'),
    ];
    const livePath = livePaths.find(p => fs.existsSync(p));
    if (livePath) {
      const liveData = JSON.parse(fs.readFileSync(livePath, 'utf8'));
      const bracketData = {};
      for (const [id, m] of Object.entries(liveData)) {
        const roundCode = id.split('_')[0];
        if (['r32', 'r16', 'qf', 'sf', 'final'].includes(roundCode) && m.home && m.away) {
          bracketData[id] = {
            home: m.home,
            away: m.away,
            homeScore: m.homeScore ?? null,
            awayScore: m.awayScore ?? null,
            winner: m.winner || null,
            isCompleted: !!(m.isCompleted || m.minute === 'FT')
          };
        }
      }
      if (Object.keys(bracketData).length > 0) {
        const json = JSON.stringify(bracketData);
        html = html.replace('</body>', `<script>window.__INITIAL_BRACKET_DATA__=${json};</script>\n</body>`);
      }
    }
  } catch (e) {
    console.warn('[Server] Could not inject bracket data:', e.message);
  }

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  WORLDCUP 2K26 Production Server Started`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Smart Scheduling: ENABLED`);
  console.log(`=================================================`);

  startSchedulers();

  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    console.log(`[Keep-Alive Bot] Registered for: ${selfUrl}`);
    setInterval(async () => {
      try {
        const res = await fetch(`${selfUrl}/scraper-status`);
        console.log(`[Keep-Alive Bot] Ping: ${res.status}`);
      } catch (err) {
        console.error(`[Keep-Alive Bot] Failed:`, err.message);
      }
    }, 600000);
  }
});
