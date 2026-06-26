import express from 'express';
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
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
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
