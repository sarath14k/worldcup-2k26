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

              let cachedShortFallback = null;
              const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
              if (homeCode && awayCode && highlightsCache[cacheKey]) {
                const cached = highlightsCache[cacheKey];
                const channelLower = (cached.channel || '').toLowerCase().trim();
                const isFIFA = channelLower === 'fifa' || 
                               channelLower === 'fifatv' || 
                               channelLower === 'fifa (direct)';
                if (isFIFA) {
                  const cachedSec = durationToSeconds(cached.duration);
                  if (cachedSec >= 115) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(cached));
                    return;
                  }
                  cachedShortFallback = cached;
                }
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

                    const durationToSeconds = (dur) => {
                      if (!dur) return 0;
                      const parts = dur.split(':');
                      if (parts.length === 1) return parseInt(parts[0], 10) || 0;
                      if (parts.length === 2) return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
                      if (parts.length === 3) return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
                      return 0;
                    };

                    const isFIFAVideo = (v) => {
                      return isAllowedChannel(v.channel, v.channelUrl);
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
                      // Sort to prioritize long videos (>= 115s)
                      realVideos.sort((a, b) => {
                        const aSec = durationToSeconds(a.duration);
                        const bSec = durationToSeconds(b.duration);
                        const aLong = aSec >= 115;
                        const bLong = bSec >= 115;
                        if (aLong && !bLong) return -1;
                        if (!aLong && bLong) return 1;
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
                          channel: best.channel,
                          duration: best.duration
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
              } else if (cachedShortFallback) {
                res.end(JSON.stringify(cachedShortFallback));
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
        }
      }
    }
  },
  server: {
    watch: {
      ignored: [
        '**/public/live-matches.json',
        '**/public/live-player-ratings.json',
        '**/public/*.tmp'
      ]
    }
  }
})
