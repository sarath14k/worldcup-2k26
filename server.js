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

// ==============================
// SCRAPER ANALYTICS TRACKING
// ==============================
const scraperAnalytics = {
  espn: {
    name: 'ESPN Match Sync',
    isRunning: false,
    mode: 'idle', // idle, pre-match, live, standby
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    matchCount: 0,
    liveCount: 0,
    nextMatchTime: null,
    recentRuns: [] // last 20 runs
  },
  ratings: {
    name: 'FotMob Ratings',
    isRunning: false,
    mode: 'idle',
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    recentRuns: []
  },
  liveRatings: {
    name: 'Live Player Ratings',
    isRunning: false,
    mode: 'idle',
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    recentRuns: []
  },
  server: {
    startedAt: new Date().toISOString(),
    uptime: 0
  }
};

function recordRun(scraperKey, { success, duration, error }) {
  const s = scraperAnalytics[scraperKey];
  s.totalRuns++;
  if (success) s.successCount++;
  else s.failureCount++;
  s.lastDuration = duration;
  s.lastSuccess = success;
  s.lastError = error || null;
  
  s.recentRuns.unshift({
    time: new Date().toISOString(),
    success,
    duration,
    error: error || null
  });
  if (s.recentRuns.length > 20) s.recentRuns.pop();
}

// Scraper status endpoint (legacy)
app.get('/scraper-status', (req, res) => {
  res.json({
    isRunning: scraperAnalytics.espn.isRunning,
    lastRun: scraperAnalytics.espn.lastRun,
    success: scraperAnalytics.espn.lastSuccess,
    error: scraperAnalytics.espn.lastError,
    count: scraperAnalytics.espn.matchCount
  });
});

// Sync endpoint
app.post('/api/sync-live', express.json({ limit: '5mb' }), (req, res) => {
  const matchesData = req.body;
  if (!matchesData || typeof matchesData !== 'object') {
    return res.status(400).json({ error: 'Invalid data format. Expected JSON object.' });
  }

  const syncToken = req.headers['x-sync-token'];
  const expectedToken = process.env.SYNC_TOKEN;
  if (expectedToken && syncToken !== expectedToken) {
    return res.status(403).json({ error: 'Invalid sync token' });
  }

  try {
    const livePath = path.join(__dirname, 'public', 'live-matches.json');
    const distPath = path.join(__dirname, 'dist', 'live-matches.json');
    fs.writeFileSync(livePath, JSON.stringify(matchesData, null, 2), 'utf8');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, JSON.stringify(matchesData, null, 2), 'utf8');
    }
    console.log(`[Sync API] Successfully synchronized ${Object.keys(matchesData).length} matches from local client.`);
    res.json({ success: true, count: Object.keys(matchesData).length });
  } catch (err) {
    console.error('[Sync API] Error writing sync data:', err);
    res.status(500).json({ error: 'Failed to write data: ' + err.message });
  }
});

// ==============================
// ANALYTICS API ENDPOINT
// ==============================
app.get('/api/scraper-analytics', (req, res) => {
  scraperAnalytics.server.uptime = Math.floor((Date.now() - new Date(scraperAnalytics.server.startedAt).getTime()) / 1000);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(scraperAnalytics);
});

import { searchHighlights, handleHighlightsRoute } from './scripts/highlightsScraper.js';

// Endpoint to search and fetch direct YouTube highlights link
app.get('/api/match-highlights', handleHighlightsRoute);

// Serve Vite static build assets
app.use(express.static(path.join(__dirname, 'dist')));

// Any other requests fall back to index.html (SPA routing support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ==============================
// SMART SCHEDULING ENGINE
// ==============================

/**
 * Compute the optimal delay for the next scrape based on match schedule.
 * 
 * | Condition                          | Interval    |
 * |------------------------------------|-------------|
 * | Live matches in progress           | 30 seconds  |
 * | Match starting within 10 min       | 30 seconds  |
 * | Match ended < 30 min ago           | 30 seconds  |
 * | Next match 10-60 min away          | 5 minutes   |
 * | No matches soon / idle             | 1 hour      |
 */
function computeScrapeDelay({ liveCount, nextMatchTime, lastMatchEndTime }) {
  const now = Date.now();
  
  // 1. Live matches → 30s
  if (liveCount > 0) {
    return { delay: 30000, mode: 'live', reason: `${liveCount} live match(es)` };
  }
  
  // 2. Match ended recently (< 30 min ago) → 30s (covers extra time + penalties up to 160min)
  if (lastMatchEndTime) {
    const endedAgo = now - new Date(lastMatchEndTime).getTime();
    if (endedAgo >= 0 && endedAgo < 30 * 60 * 1000) {
      return { delay: 30000, mode: 'live', reason: `Match ended ${Math.floor(endedAgo / 60000)}min ago` };
    }
  }
  
  // 3. Next match within 10 min → 30s (pre-match warm-up)
  if (nextMatchTime) {
    const timeToMatch = new Date(nextMatchTime).getTime() - now;
    if (timeToMatch > 0 && timeToMatch <= 10 * 60 * 1000) {
      return { delay: 30000, mode: 'pre-match', reason: `Next match in ${Math.floor(timeToMatch / 60000)}min` };
    }
    
    // 4. Next match 10-60 min away → 5 min
    if (timeToMatch > 10 * 60 * 1000 && timeToMatch <= 60 * 60 * 1000) {
      return { delay: 300000, mode: 'standby', reason: `Next match in ${Math.floor(timeToMatch / 60000)}min` };
    }
  }
  
  // 5. Nothing upcoming → 1 hour
  return { delay: 3600000, mode: 'idle', reason: 'No upcoming matches' };
}

let scrapeTimeout = null;
let currentlyLiveMatches = false;

async function runScrape() {
  const analytics = scraperAnalytics.espn;
  if (analytics.isRunning) {
    console.log('[ESPN Scraper] Already running. Skipping.');
    return;
  }
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();
  
  let scheduleData = { liveCount: 0, nextMatchTime: null, lastMatchEndTime: null };
  
  try {
    const result = await syncWithEspn();
    const duration = Date.now() - startTime;
    analytics.matchCount = result.count || 0;
    analytics.liveCount = result.liveCount || 0;
    analytics.nextMatchTime = result.nextMatchTime || null;
    
    scheduleData = {
      liveCount: result.liveCount || 0,
      nextMatchTime: result.nextMatchTime,
      lastMatchEndTime: result.lastMatchEndTime
    };
    
    currentlyLiveMatches = scheduleData.liveCount > 0;
    recordRun('espn', { success: result.success, duration, error: result.error });
    console.log(`[ESPN Scraper] Completed in ${duration}ms. ${result.count} matches, ${result.liveCount} live.`);
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('espn', { success: false, duration, error: err.message });
    console.error('[ESPN Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    if (scrapeTimeout) clearTimeout(scrapeTimeout);
    
    const { delay, mode, reason } = computeScrapeDelay(scheduleData);
    analytics.mode = mode;
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();
    
    console.log(`[ESPN Scraper] Mode: ${mode} | Next run in ${delay / 1000}s | Reason: ${reason}`);
    scrapeTimeout = setTimeout(runScrape, delay);
  }
}

let ratingsTimeout = null;
async function runRatingsSync() {
  const analytics = scraperAnalytics.ratings;
  if (analytics.isRunning) return;
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    const result = await syncRatings();
    const duration = Date.now() - startTime;
    recordRun('ratings', { success: true, duration });
    console.log(`[Ratings Scraper] Completed in ${duration}ms.`);
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('ratings', { success: false, duration, error: err.message });
    console.error('[Ratings Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    if (ratingsTimeout) clearTimeout(ratingsTimeout);
    const delay = currentlyLiveMatches ? 300000 : 1800000; // 5min live, 30min standby
    analytics.mode = currentlyLiveMatches ? 'live' : 'standby';
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();
    console.log(`[Ratings Scraper] Next run in ${delay / 1000}s`);
    ratingsTimeout = setTimeout(runRatingsSync, delay);
  }
}

let liveRatingsTimeout = null;
async function runLiveRatingsSync() {
  const analytics = scraperAnalytics.liveRatings;
  if (analytics.isRunning) return;
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();
  
  try {
    const result = await scrapeLiveRatings();
    const duration = Date.now() - startTime;
    recordRun('liveRatings', { success: true, duration });
    console.log(`[Live Ratings Scraper] Completed in ${duration}ms.`);
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('liveRatings', { success: false, duration, error: err.message });
    console.error('[Live Ratings Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    if (liveRatingsTimeout) clearTimeout(liveRatingsTimeout);
    const delay = currentlyLiveMatches ? 300000 : 1800000;
    analytics.mode = currentlyLiveMatches ? 'live' : 'standby';
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();
    console.log(`[Live Ratings Scraper] Next run in ${delay / 1000}s`);
    liveRatingsTimeout = setTimeout(runLiveRatingsSync, delay);
  }
}

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  WORLDCUP 2K26 Production Server Started`);
  console.log(`  Listening on port: ${PORT}`);
  console.log(`  Smart Scheduling: ENABLED`);
  console.log(`=================================================`);
  
  runScrape();
  runRatingsSync();
  runLiveRatingsSync();

  // Render Keep-Alive Bot
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
