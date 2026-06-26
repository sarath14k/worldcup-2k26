import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import { scraperAnalytics } from './analytics.js';
import { handleHighlightsRoute } from './scrapers/highlights.js';
import { triggerEspnScrape, triggerRatingsScrape, triggerLiveRatingsScrape } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveJsonFile(req, res, filename, srcFallback) {
  const paths = [
    path.join(__dirname, '../public', filename),
    path.join(__dirname, '../dist', filename),
  ];
  if (srcFallback) paths.push(path.join(__dirname, '../src', 'data', srcFallback));
  for (const p of paths) {
    if (fs.existsSync(p)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(p);
    }
  }
  res.json(filename === 'live-matches.json' ? {} : []);
}

export function registerRoutes(app) {
  // Static data files
  app.get('/live-matches.json', (req, res) => serveJsonFile(req, res, 'live-matches.json'));
  app.get('/fotmobPlayerRatings.json', (req, res) => serveJsonFile(req, res, 'fotmobPlayerRatings.json', 'fotmobPlayerRatings.json'));
  app.get('/live-player-ratings.json', (req, res) => serveJsonFile(req, res, 'live-player-ratings.json', 'livePlayerRatings.json'));
  app.get('/fotmobPlayerDetails.json', (req, res) => serveJsonFile(req, res, 'fotmobPlayerDetails.json', 'fotmobPlayerDetails.json'));

  // Scraper status (legacy)
  app.get('/scraper-status', (req, res) => {
    res.json({
      isRunning: scraperAnalytics.espn.isRunning,
      lastRun: scraperAnalytics.espn.lastRun,
      success: scraperAnalytics.espn.lastSuccess,
      error: scraperAnalytics.espn.lastError,
      count: scraperAnalytics.espn.matchCount
    });
  });

  // Sync endpoint (local client pushes data)
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
      const livePath = path.join(__dirname, '../public', 'live-matches.json');
      const distPath = path.join(__dirname, '../dist', 'live-matches.json');
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

  // Analytics API
  app.get('/api/scraper-analytics', (req, res) => {
    scraperAnalytics.server.uptime = Math.floor((Date.now() - new Date(scraperAnalytics.server.startedAt).getTime()) / 1000);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(scraperAnalytics);
  });

  // Deploy status — checks both server and latest GitHub commit
  app.get('/api/deploy-status', async (req, res) => {
    const commitFile = path.join(__dirname, '../public/commit.txt');
    let deployedCommit = '';
    try {
      deployedCommit = fs.readFileSync(commitFile, 'utf8').trim();
    } catch {
      deployedCommit = process.env.RENDER_GIT_COMMIT || '';
    }
    let latestCommit = null;
    try {
      const gh = await fetch('https://api.github.com/repos/sarath14k/worldcup-2k26/branches/main');
      if (gh.ok) {
        const body = await gh.json();
        latestCommit = {
          sha: body.commit?.sha || '',
          message: body.commit?.commit?.message || '',
          date: body.commit?.commit?.committer?.date || ''
        };
      }
    } catch {}
    const ahead = latestCommit && deployedCommit ? latestCommit.sha.slice(0, 7) !== deployedCommit.slice(0, 7) : false;
    res.json({
      deployedCommit,
      latestCommit,
      ahead,
      deployId: process.env.RENDER_DEPLOY_ID || null,
      serverTime: new Date().toISOString()
    });
  });

  // Manual trigger for scrapers
  app.post('/api/trigger-scrape/:type', (req, res) => {
    const token = req.headers['x-sync-token'];
    const expected = process.env.SYNC_TOKEN;
    if (expected && token !== expected) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const { type } = req.params;
    const triggers = {
      espn: triggerEspnScrape,
      ratings: triggerRatingsScrape,
      'live-ratings': triggerLiveRatingsScrape,
    };
    const trigger = triggers[type];
    if (!trigger) return res.status(400).json({ error: `Unknown scraper type: ${type}` });
    trigger();
    res.json({ success: true, message: `${type} scrape triggered` });
  });

  // Force re-fetch timeline for matches with old data (no granular commentary events)
  app.post('/api/migrate-timeline', (req, res) => {
    const token = req.headers['x-sync-token'];
    const expected = process.env.SYNC_TOKEN;
    if (expected && token !== expected) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const livePath = path.join(__dirname, '../public', 'live-matches.json');
    const distPath = path.join(__dirname, '../dist', 'live-matches.json');
    let count = 0;
    for (const p of [livePath, distPath]) {
      if (!fs.existsSync(p)) continue;
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        for (const [mid, m] of Object.entries(data)) {
          const hasGranular = m.timeline?.some(t => {
            const lower = (t.type || '').toLowerCase();
            return lower.includes('shot') || lower.includes('foul') || lower.includes('corner');
          });
          if (!hasGranular && m.isDetailedScraped) {
            m.isDetailedScraped = false;
            m.isScorersFixed = false;
            count++;
          }
        }
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
        console.error(`[Migrate] Error processing ${p}:`, err.message);
      }
    }
    triggerEspnScrape();
    res.json({ success: true, message: `Cleared ${count} stale entries, scrape triggered` });
  });

  // Match highlights API
  app.get('/api/match-highlights', handleHighlightsRoute);

  // Bulk highlights cache endpoint
  app.get('/api/all-highlights', (req, res) => {
    const cachePath = path.join(__dirname, '../src/data/highlights-cache.json');
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Player detail API (from Fotmob data)
  app.get('/api/player-detail/:id', (req, res) => {
    const detailsPath = path.join(__dirname, '../src/data/fotmobPlayerDetails.json');
    if (!fs.existsSync(detailsPath)) return res.status(404).json({ error: 'No player data' });
    const details = JSON.parse(fs.readFileSync(detailsPath, 'utf8'));
    const player = details[req.params.id];
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(player);
  });
}
