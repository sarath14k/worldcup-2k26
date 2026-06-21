import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { scrapeFifa } from './scripts/fifaScraper.js'

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
              if (!home || !away) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'home and away parameters are required' }));
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
                      'short', 'shorts'
                    ];
                    
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
                        if (normName === 'usa') {
                          return normTitle.includes('usa') || normTitle.includes('united states');
                        }
                        if (normName === 'uae') {
                          return normTitle.includes('uae') || normTitle.includes('united arab emirates');
                        }
                        if (normTitle.includes(normName)) {
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
                      foundVideoId = best.videoId;
                      foundUrl = `https://www.youtube.com/watch?v=${best.videoId}`;
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
      ignored: ['**/public/live-matches.json']
    }
  }
})
