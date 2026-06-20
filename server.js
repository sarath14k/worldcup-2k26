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

// Serve Vite static build assets
app.use(express.static(path.join(__dirname, 'dist')));

// Any other requests fall back to index.html (SPA routing support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Scraper background daemon logic
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
