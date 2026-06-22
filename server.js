import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { syncWithEspn } from './scripts/espnSync.js';

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
  const syncToken = process.env.SYNC_TOKEN || 'default_secret_sync_token_2k26';

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

// Team name aliases for matching YouTube highlight titles
const TEAM_ALIASES = {
  'united states': ['usa', 'united states', 'us'],
  'south korea': ['korea republic', 'south korea', 'korea'],
  'czechia': ['czechia', 'czech republic'],
  'turkey': ['turkiye', 'turkey'],
  'ivory coast': ['cote divoire', 'ivory coast'],
  'dr congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
  'cape verde': ['cabo verde', 'cape verde']
};

// Helper to normalize team names for verification
function normalizeTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // keep alphanumeric and spaces
    .trim();
}

// Endpoint to search and fetch direct YouTube highlights link
app.get('/api/match-highlights', async (req, res) => {
  const { home, away } = req.query;
  if (!home || !away) {
    return res.status(400).json({ error: 'home and away parameters are required' });
  }

  const query = `FIFA ${home} v ${away} World Cup highlights`;

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch from YouTube: ${response.statusText}`);
    }

    const html = await response.text();
    
    // 1. Try parsing from ytInitialData for precise search result order
    const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents
          || data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
          
        if (contents) {
          const videos = [];
          for (const section of contents) {
            const itemSection = section.itemSectionRenderer;
            if (itemSection && itemSection.contents) {
              for (const item of itemSection.contents) {
                if (item.videoRenderer) {
                  const vr = item.videoRenderer;
                  const title = vr.title?.runs?.[0]?.text;
                  const videoId = vr.videoId;
                  const channel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text;
                  const channelUrl = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl 
                    || vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl 
                    || '';
                  const duration = vr.lengthText?.simpleText || '';
                  if (title && videoId) {
                    videos.push({ title, videoId, channel, channelUrl, duration });
                  }
                }
              }
            }
          }
          
          const EXCLUDE_KEYWORDS = [
            'simulation', 'pes', 'efootball', 'gameplay', 'fifa 23', 'fifa 22', 'fifa 24',
            'game play', 'fifa 25', 'ea sports fc', 'fc 24', 'fc 25', 'fifa 19', 'fifa 20', 'fifa 21',
            'alt cast', 'alt-cast', 'alternative cast', 'preview', 'prediction',
            'fake', 'concept', 'fan-made', 'fan made', 'parody', 'mockup', 'mock',
            'short', 'shorts'
          ];
          
          const realVideos = videos.filter(v => {
            const titleLower = v.title.toLowerCase();
            const channelLower = (v.channel || '').toLowerCase();
            const channelUrlLower = (v.channelUrl || '').toLowerCase();
            
            // 1. Exclude based on title keywords
            if (EXCLUDE_KEYWORDS.some(kw => titleLower.includes(kw) || channelLower.includes(kw))) {
              return false;
            }
            
            // 2. Exclude if "ai" is a standalone word in the title or channel name
            const titleWords = titleLower.split(/[^a-z0-9]/);
            const channelWords = channelLower.split(/[^a-z0-9]/);
            if (titleWords.includes('ai') || channelWords.includes('ai')) {
              return false;
            }
            
            // 3. MUST be the official FIFA channel (strict channel name and url check)
            const isOfficialFIFA = channelLower === 'fifa' && (
              channelUrlLower === '/@fifa' || 
              channelUrlLower.includes('ucpctrcxblq78gzrtutlwebw')
            );
            if (!isOfficialFIFA) {
              return false;
            }
            
            // 4. Exclude if duration is missing, under 60 seconds, or over 5 minutes (300 seconds)
            if (!v.duration) {
              return false;
            }
            const parts = v.duration.split(':');
            if (parts.length === 1) {
              return false; // just seconds
            }
            if (parts.length === 3) {
              return false; // hours, definitely over 5 minutes
            }
            if (parts.length === 2) {
              const minutes = parseInt(parts[0], 10);
              const seconds = parseInt(parts[1], 10);
              if (isNaN(minutes) || isNaN(seconds)) {
                return false;
              }
              const totalSeconds = minutes * 60 + seconds;
              if (totalSeconds < 60 || totalSeconds > 300) {
                return false;
              }
            }
            
            // 5. Match Verification: Title must contain BOTH normalized home team and away team name
            const normTitle = titleLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normHome = normalizeTeamName(home);
            const normAway = normalizeTeamName(away);
            
            const checkTeam = (normName) => {
              const aliases = TEAM_ALIASES[normName] || [normName];
              if (aliases.some(alias => normTitle.includes(alias))) {
                return true;
              }
              const words = normName.split(' ').filter(w => w.length > 3);
              if (words.length > 0) {
                return words.every(word => normTitle.includes(word));
              }
              return false;
            };

            if (!checkTeam(normHome) || !checkTeam(normAway)) {
              return false;
            }
            
            return true;
          });
          
          if (realVideos.length > 0) {
            const best = realVideos[0];
            return res.json({ videoId: best.videoId, url: `https://www.youtube.com/watch?v=${best.videoId}`, title: best.title, channel: best.channel });
          }
        }
      } catch (err) {
        console.warn('[Highlights API] Failed to parse ytInitialData, falling back to regex:', err);
      }
    }

    res.status(404).json({ error: 'No video highlights found' });
  } catch (err) {
    console.error('[Highlights API] Error:', err.message);
    res.status(500).json({ error: err.message });
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
    const result = await syncWithEspn();
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
