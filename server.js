import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { syncWithEspn } from './scripts/espnSync.js';
import { syncRatings } from './scripts/scrapeFotmobRatings.js';
import { scrapeLiveRatings } from './scripts/scrapeLiveRatings.js';

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

const TEAM_ALIASES = {
  'united states': ['usa', 'united states', 'us'],
  'south korea': ['korea republic', 'south korea', 'korea'],
  'czechia': ['czechia', 'czech republic'],
  'turkey': ['turkiye', 'turkey'],
  'ivory coast': ["cote d'ivoire", 'cote divoire', 'ivory coast'],
  'dr congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
  'cape verde': ['cabo verde', 'cape verde'],
  'bosnia  herzegovina': ['bosnia and herzegovina', 'bosnia & herzegovina', 'bosnia']
};

// Hardcoded highlights fallback mapping
const HARDCODED_HIGHLIGHTS = {
  'canada-bosnia  herzegovina': 'https://www.youtube.com/watch?v=w-_rY5morQY',
  'bosnia  herzegovina-canada': 'https://www.youtube.com/watch?v=w-_rY5morQY'
};

const CACHE_FILE = path.join(__dirname, 'src/data/highlights-cache.json');

// Ensure parent directories exist
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Load cache
let highlightsCache = {};
try {
  if (fs.existsSync(CACHE_FILE)) {
    const rawCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    // Filter to keep only FIFA channel highlights
    highlightsCache = {};
    for (const [key, val] of Object.entries(rawCache)) {
      const channelLower = (val.channel || '').toLowerCase().trim();
      const isFIFA = channelLower === 'fifa' || 
                     channelLower === 'fifatv' || 
                     channelLower === 'fifa (direct)';
      if (isFIFA) {
        highlightsCache[key] = val;
      }
    }
    // Save filtered version immediately to clean file on disk
    ensureDirectoryExistence(CACHE_FILE);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(highlightsCache, null, 2), 'utf8');
  }
} catch (err) {
  console.warn('[Cache] Failed to load highlights cache:', err.message);
}

// Save cache
function saveCache() {
  try {
    ensureDirectoryExistence(CACHE_FILE);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(highlightsCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[Cache] Failed to save highlights cache:', err.message);
  }
}

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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const { home, away, homeCode, awayCode } = req.query;
  if (!home || !away) {
    return res.status(400).json({ error: 'home and away parameters are required' });
  }

  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);
  const fallbackKey = `${normHome}-${normAway}`;
  if (HARDCODED_HIGHLIGHTS[fallbackKey]) {
    return res.json({
      videoId: HARDCODED_HIGHLIGHTS[fallbackKey].split('v=')[1],
      url: HARDCODED_HIGHLIGHTS[fallbackKey],
      title: `Highlights | ${home} vs ${away} | FIFA World Cup 2026™`,
      channel: 'FIFA (Direct)'
    });
  }

  const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
  if (homeCode && awayCode && highlightsCache[cacheKey]) {
    const cached = highlightsCache[cacheKey];
    const channelLower = (cached.channel || '').toLowerCase();
    const isFIFA = channelLower === 'fifa' || 
                   channelLower === 'fifatv' || 
                   channelLower === 'fifa (direct)' || 
                   channelLower.includes('fifa');
    if (isFIFA) {
      return res.json(cached);
    }
  }

  const cleanHome = home.replace(/&/g, 'and');
  const cleanAway = away.replace(/&/g, 'and');
  const query = `FIFA ${cleanHome} v ${cleanAway} World Cup highlights`;

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
            'short', 'shorts', 'u20', 'u-20', 'u17', 'u-17', 'u23', 'u-23', 'women', 'womens', 'wnt',
            'train', 'training', 'press conference', 'press-conference', 'press', 'interview', 'interviews',
            'arrival', 'arrivals', 'tunnel', 'vlog', 'reaction', 'fan react', 'fans react', 'behind the scenes', 'bts',
            'futsal', 'beach soccer', 'beach', 'virtual', 'esport', 'interactive', 'esports',
            'world cup 2022', 'world cup 2018', 'world cup 2014', 'world cup 2010', 'world cup 2006', 'world cup 2002', 'world cup 1998'
          ];

          const isAllowedChannel = (channelName, channelUrl) => {
            const channelLower = (channelName || '').toLowerCase().trim();
            const channelUrlLower = (channelUrl || '').toLowerCase().trim();
            
            const isFIFA = channelLower === 'fifa' || 
                           channelLower === 'fifatv' || 
                           channelLower === 'fifa (direct)';
            const isFIFAUrl = channelUrlLower === '/@fifa' || 
                              channelUrlLower === '/@fifatv' || 
                              channelUrlLower === '/c/fifa' || 
                              channelUrlLower.includes('ucpctrcxblq78gzrtutlwebw');
                              
            return isFIFA && isFIFAUrl;
          };

          const isFIFAVideo = (v) => {
            return isAllowedChannel(v.channel, v.channelUrl);
          };
          
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
            
            // 2b. Exclude other years to avoid historical matches
            const yearMatch = titleLower.match(/\b(19\d\d|20[0-2][0-5]|202[7-9])\b/);
            if (yearMatch) {
              return false;
            }
            
            // 3. Allowed channel check
            if (!isAllowedChannel(v.channel, v.channelUrl)) {
              return false;
            }
            
            // 4. Exclude if duration is missing, under 60 seconds, or over 10 minutes (600 seconds)
            if (!v.duration) {
              return false;
            }
            const parts = v.duration.split(':');
            if (parts.length === 1) {
              return false; // just seconds
            }
            if (parts.length === 3) {
              return false; // hours, definitely over 10 minutes
            }
            if (parts.length === 2) {
              const minutes = parseInt(parts[0], 10);
              const seconds = parseInt(parts[1], 10);
              if (isNaN(minutes) || isNaN(seconds)) {
                return false;
              }
              const totalSeconds = minutes * 60 + seconds;
              if (totalSeconds < 60 || totalSeconds > 600) {
                return false;
              }
            }
            
            // 5. Match Verification: Title must contain BOTH normalized home team and away team name (or their codes)
            const normTitle = titleLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normHome = normalizeTeamName(home);
            const normAway = normalizeTeamName(away);
            
            const checkTeam = (normName, code) => {
              const aliases = TEAM_ALIASES[normName] || [normName];
              if (code) {
                aliases.push(code.toLowerCase());
              }
              if (aliases.some(alias => normTitle.includes(alias))) {
                return true;
              }
              const words = normName.split(' ').filter(w => w.length > 3);
              if (words.length > 0) {
                return words.every(word => normTitle.includes(word));
              }
              return false;
            };

            if (!checkTeam(normHome, homeCode) || !checkTeam(normAway, awayCode)) {
              return false;
            }
            
            return true;
          });
          
          if (realVideos.length > 0) {
            // Sort to prioritize official FIFA channel
            realVideos.sort((a, b) => {
              const aFIFA = isFIFAVideo(a);
              const bFIFA = isFIFAVideo(b);
              if (aFIFA && !bFIFA) return -1;
              if (!aFIFA && bFIFA) return 1;
              return 0;
            });
            const best = realVideos[0];
            const result = { videoId: best.videoId, url: `https://www.youtube.com/watch?v=${best.videoId}`, title: best.title, channel: best.channel };
            if (homeCode && awayCode) {
              highlightsCache[cacheKey] = result;
              saveCache();
            }
            return res.json(result);
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

let isRatingsRunning = false;
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
  }
}

let isLiveRatingsRunning = false;
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
  
  // Run ESPN sync every 60 seconds
  setInterval(runScrape, 60000);

  // Run ratings sync every 5 minutes (300000 ms)
  setInterval(runRatingsSync, 300000);

  // Run live ratings sync every 5 minutes (300000 ms)
  setInterval(runLiveRatingsSync, 300000);

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
