import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { syncWithEspn } from './scripts/espnSync.js';
import { syncRatings } from './scripts/scrapeFotmobRatings.js';
import { scrapeLiveRatings } from './scripts/scrapeLiveRatings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security & compression middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid breaking inline scripts/styles
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

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

// Serve the fotmob player ratings file dynamically
app.get('/fotmobPlayerRatings.json', (req, res) => {
  const ratingsPath = path.join(__dirname, 'public', 'fotmobPlayerRatings.json');
  if (fs.existsSync(ratingsPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(ratingsPath);
  } else {
    const distPath = path.join(__dirname, 'dist', 'fotmobPlayerRatings.json');
    if (fs.existsSync(distPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(distPath);
    } else {
      const srcPath = path.join(__dirname, 'src', 'data', 'fotmobPlayerRatings.json');
      if (fs.existsSync(srcPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(srcPath);
      } else {
        res.json([]);
      }
    }
  }
});

// Serve the live player ratings file dynamically
app.get('/live-player-ratings.json', (req, res) => {
  const ratingsPath = path.join(__dirname, 'public', 'live-player-ratings.json');
  if (fs.existsSync(ratingsPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(ratingsPath);
  } else {
    const distPath = path.join(__dirname, 'dist', 'live-player-ratings.json');
    if (fs.existsSync(distPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(distPath);
    } else {
      const srcPath = path.join(__dirname, 'src', 'data', 'livePlayerRatings.json');
      if (fs.existsSync(srcPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(srcPath);
      } else {
        res.json({});
      }
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
    return res.status(503).json({ error: 'Sync endpoint is not configured. Set SYNC_TOKEN env var.' });
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

import { searchHighlights } from './scripts/highlightsScraper.js';

// Endpoint to search and fetch direct YouTube highlights link
app.get('/api/match-highlights', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const { home, away, homeCode, awayCode } = req.query;
  
  const { statusCode, result } = await searchHighlights({ home, away, homeCode, awayCode });
  res.status(statusCode).json(result);
});

// Serve Vite static build assets
app.use(express.static(path.join(__dirname, 'dist')));

// Any other requests fall back to index.html (SPA routing support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

let scrapeTimeout = null;
let currentlyLiveMatches = false;
async function runScrape() {
  if (isRunning) {
    console.log('[Server Scraper] Scraper is already running. Skipping.');
    return;
  }
  isRunning = true;
  console.log('[Server Scraper] Starting scraping cycle...');
  lastScrapeStatus.lastRun = new Date().toISOString();
  let liveMatchesActive = false;
  try {
    const result = await syncWithEspn();
    console.log('[Server Scraper] Scraping cycle completed successfully:', result);
    lastScrapeStatus.success = result.success;
    lastScrapeStatus.count = result.count || 0;
    lastScrapeStatus.error = result.error || null;

    if (result.success && result.liveCount > 0) {
      liveMatchesActive = true;
    }
    currentlyLiveMatches = liveMatchesActive;
  } catch (err) {
    console.error('[Server Scraper] Scraping cycle failed:', err);
    lastScrapeStatus.success = false;
    lastScrapeStatus.error = err.message;
  } finally {
    isRunning = false;

    if (scrapeTimeout) {
      clearTimeout(scrapeTimeout);
    }
    // Dynamic scheduling: 30 seconds if live matches are running, otherwise 10 minutes (600000ms)
    const delay = liveMatchesActive ? 30000 : 600000;
    console.log(`[Server Scraper] Next scraping cycle scheduled in ${delay / 1000}s`);
    scrapeTimeout = setTimeout(runScrape, delay);
  }
}

let isRatingsRunning = false;
let ratingsTimeout = null;
async function runRatingsSync() {
  if (isRatingsRunning) {
    console.log('[Server Scraper] Ratings sync is already running. Skipping.');
    return;
  }
  isRatingsRunning = true;
  console.log('[Server Scraper] Starting ratings sync...');
  try {
    const ratingsResult = await syncRatings();
    console.log('[Server Scraper] Ratings sync completed:', ratingsResult);
  } catch (err) {
    console.error('[Server Scraper] Ratings sync failed:', err);
  } finally {
    isRatingsRunning = false;
    if (ratingsTimeout) clearTimeout(ratingsTimeout);
    const delay = currentlyLiveMatches ? 300000 : 1800000; // 5min live, 30min standby
    console.log(`[Server Scraper] Next ratings sync scheduled in ${delay / 1000}s`);
    ratingsTimeout = setTimeout(runRatingsSync, delay);
  }
}

let isLiveRatingsRunning = false;
let liveRatingsTimeout = null;
async function runLiveRatingsSync() {
  if (isLiveRatingsRunning) {
    console.log('[Server Scraper] Live ratings sync is already running. Skipping.');
    return;
  }
  isLiveRatingsRunning = true;
  console.log('[Server Scraper] Starting live ratings sync...');
  try {
    const liveRatingsResult = await scrapeLiveRatings();
    console.log('[Server Scraper] Live ratings sync completed:', liveRatingsResult);
  } catch (err) {
    console.error('[Server Scraper] Live ratings sync failed:', err);
  } finally {
    isLiveRatingsRunning = false;
    if (liveRatingsTimeout) clearTimeout(liveRatingsTimeout);
    const delay = currentlyLiveMatches ? 300000 : 1800000; // 5min live, 30min standby
    console.log(`[Server Scraper] Next live ratings sync scheduled in ${delay / 1000}s`);
    liveRatingsTimeout = setTimeout(runLiveRatingsSync, delay);
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
  runRatingsSync();
  runLiveRatingsSync();
  


  // Render Keep-Alive Bot to prevent service spin-down
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    console.log(`[Keep-Alive Bot] Registered for external URL: ${selfUrl}`);
    const pingSelf = async () => {
      try {
        console.log(`[Keep-Alive Bot] Pinging self at ${selfUrl}/scraper-status...`);
        const res = await fetch(`${selfUrl}/scraper-status`);
        console.log(`[Keep-Alive Bot] Ping response status: ${res.status}`);
      } catch (err) {
        console.error(`[Keep-Alive Bot] Ping failed:`, err.message);
      }
    };
    // Ping every 10 minutes (600000 ms)
    setInterval(pingSelf, 600000);
  }
});
