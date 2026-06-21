import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scrapeFifa } from './scripts/fifaScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the live matches file dynamically from public folder (updated by scraper)
app.get('/live-matches.json', (req, res) => {
  const livePath = path.join(__dirname, 'public', 'live-matches.json');
  if (fs.existsSync(livePath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(livePath);
  } else {
    const distPath = path.join(__dirname, 'dist', 'live-matches.json');
    if (fs.existsSync(distPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(distPath);
    } else {
      res.json({});
    }
  }
});

// Scraper status tracking
let isRunning = false;
let lastScrapeStatus = {
  lastRun: null,
  success: null,
  error: null,
  count: 0
};

app.get('/scraper-status', (req, res) => {
  res.json({
    isRunning,
    ...lastScrapeStatus
  });
});

// POST endpoint to sync matches from a trusted local scraper
app.post('/api/sync-matches', express.json({ limit: '10mb' }), (req, res) => {
  const syncToken = process.env.SYNC_TOKEN;
  if (!syncToken) {
    return res.status(500).json({ error: 'SYNC_TOKEN environment variable is not set on the server.' });
  }

  const clientToken = req.headers['x-sync-token'];
  if (!clientToken || clientToken !== syncToken) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing X-Sync-Token.' });
  }

  const matchesData = req.body;
  if (!matchesData || typeof matchesData !== 'object' || Array.isArray(matchesData)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an object.' });
  }

  try {
    const livePath = path.join(__dirname, 'public', 'live-matches.json');
    const distPath = path.join(__dirname, 'dist', 'live-matches.json');

    // Write to public
    fs.writeFileSync(livePath, JSON.stringify(matchesData, null, 2), 'utf8');
    
    // Write to dist (Vite build output folder) if it exists so changes are reflected immediately
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, JSON.stringify(matchesData, null, 2), 'utf8');
    }

    lastScrapeStatus = {
      lastRun: new Date().toISOString(),
      success: true,
      error: null,
      count: Object.keys(matchesData).length,
      source: 'local-sync'
    };

    console.log(`[Sync API] Successfully synchronized ${lastScrapeStatus.count} matches from local client.`);
    res.json({ success: true, count: lastScrapeStatus.count });
  } catch (err) {
    console.error('[Sync API] Error writing sync data:', err);
    res.status(500).json({ error: 'Failed to write data: ' + err.message });
  }
});

// Serve Vite static build assets
app.use(express.static(path.join(__dirname, 'dist')));

// Any other requests fall back to index.html (SPA routing support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

async function runScrape() {
  if (isRunning) {
    console.log('[Server Scraper] Scraper is already running. Skipping.');
    return;
  }
  isRunning = true;
  console.log('[Server Scraper] Starting scraping cycle...');
  lastScrapeStatus.lastRun = new Date().toISOString();
  try {
    const result = await scrapeFifa();
    console.log('[Server Scraper] Scraping cycle completed successfully:', result);
    lastScrapeStatus.success = result.success;
    lastScrapeStatus.count = result.count || 0;
    lastScrapeStatus.error = result.error || null;
  } catch (err) {
    console.error('[Server Scraper] Scraping cycle failed:', err);
    lastScrapeStatus.success = false;
    lastScrapeStatus.error = err.message;
  } finally {
    isRunning = false;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  WORLDCUP 2K26 Production Server Started`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`=================================================`);
  
  // Run once immediately on startup
  runScrape();
  
  // Run every 60 seconds
  setInterval(runScrape, 60000);
});
