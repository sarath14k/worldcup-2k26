import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { scrapeFifa } from './scripts/fifaScraper.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    highlightsCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }
} catch (err) {
  console.warn('[Cache] Failed to load highlights cache in vite:', err.message);
}

// Save cache
function saveCache() {
  try {
    ensureDirectoryExistence(CACHE_FILE);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(highlightsCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[Cache] Failed to save highlights cache in vite:', err.message);
  }
}

export default defineConfig({
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
            try {
              const urlObj = new URL(req.url, 'http://localhost');
              const home = urlObj.searchParams.get('home');
              const away = urlObj.searchParams.get('away');
              const homeCode = urlObj.searchParams.get('homeCode');
              const awayCode = urlObj.searchParams.get('awayCode');
              if (!home || !away) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'home and away parameters are required' }));
                return;
              }
              
              const normHome = home.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
              const normAway = away.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
              const fallbackKey = `${normHome}-${normAway}`;
              const HARDCODED_HIGHLIGHTS = {
                'canada-bosnia  herzegovina': 'https://www.youtube.com/watch?v=w-_rY5morQY',
                'bosnia  herzegovina-canada': 'https://www.youtube.com/watch?v=w-_rY5morQY'
              };
              if (HARDCODED_HIGHLIGHTS[fallbackKey]) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  videoId: HARDCODED_HIGHLIGHTS[fallbackKey].split('v=')[1],
                  url: HARDCODED_HIGHLIGHTS[fallbackKey],
                  title: `Highlights | ${home} vs ${away} | FIFA World Cup 2026™`,
                  channel: 'FIFA (Direct)'
                }));
                return;
              }

              const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
              if (homeCode && awayCode && highlightsCache[cacheKey]) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(highlightsCache[cacheKey]));
                return;
              }

              const query = `FIFA ${home} v ${away} World Cup highlights`;
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
              let foundUrl = null;
              let foundVideoId = null;
              
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
                      'arrival', 'arrivals', 'tunnel', 'vlog', 'reaction', 'fan react', 'fans react', 'behind the scenes', 'bts'
                    ];

                    const isAllowedChannel = (channelName, channelUrl) => {
                      const channelLower = (channelName || '').toLowerCase();
                      const channelUrlLower = (channelUrl || '').toLowerCase();
                      
                      if (channelLower === 'fifa' || 
                          channelLower === 'fifatv' || 
                          channelUrlLower === '/@fifa' || 
                          channelUrlLower.includes('ucpctrcxblq78gzrtutlwebw') || 
                          channelUrlLower.includes('fifatv') || 
                          channelUrlLower === '/c/fifa') {
                        return true;
                      }
                      
                      const whitelisted = [
                        'fifa', 'fifatv', 'fox soccer', 'fox sports', 'bbc sport', 'itv sport', 
                        'ndtv', 'moneycontrol', 'sportytv', 'bpc media', 'optus sport', 
                        'sbs sport', 'supersport', 'bein sports', 'telemundo deportes', 
                        'tsn', 'sky sports', 'espn', 'toffee'
                      ];
                      
                      return whitelisted.some(ch => channelLower.includes(ch));
                    };

                    const isFIFAVideo = (v) => {
                      const channelLower = (v.channel || '').toLowerCase();
                      const channelUrlLower = (v.channelUrl || '').toLowerCase();
                      return channelLower === 'fifa' || 
                        channelLower === 'fifatv' || 
                        channelUrlLower === '/@fifa' || 
                        channelUrlLower.includes('ucpctrcxblq78gzrtutlwebw') || 
                        channelUrlLower.includes('fifatv') || 
                        channelUrlLower === '/c/fifa';
                    };
                    
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

                    // Helper to normalize team names
                    const normalizeTeamName = (name) => {
                      return name
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
                        .toLowerCase()
                        .replace(/[^a-z0-9\s]/g, '') // keep alphanumeric and spaces
                        .trim();
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
                      foundVideoId = best.videoId;
                      foundUrl = `https://www.youtube.com/watch?v=${best.videoId}`;
                      if (homeCode && awayCode) {
                        highlightsCache[cacheKey] = {
                          videoId: foundVideoId,
                          url: foundUrl,
                          title: best.title,
                          channel: best.channel
                        };
                        saveCache();
                      }
                    }
                  }
                } catch (err) {
                  console.warn('[Highlights API] Failed to parse ytInitialData, falling back to regex:', err);
                }
              }

              res.setHeader('Content-Type', 'application/json');
              if (foundUrl) {
                res.end(JSON.stringify({ videoId: foundVideoId, url: foundUrl }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'No video highlights found' }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    watch: {
      ignored: [
        '**/public/live-matches.json',
        '**/public/*.tmp'
      ]
    }
  }
})
