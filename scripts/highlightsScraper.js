import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Shared constants ---
export const TEAM_ALIASES = {
  'united states': ['usa', 'united states', 'us'],
  'south korea': ['korea republic', 'south korea', 'korea'],
  'czechia': ['czechia', 'czech republic'],
  'turkey': ['turkiye', 'turkey'],
  'ivory coast': ["cote d'ivoire", 'cote divoire', 'ivory coast'],
  'dr congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
  'cape verde': ['cabo verde', 'cape verde'],
  'bosnia  herzegovina': ['bosnia and herzegovina', 'bosnia & herzegovina', 'bosnia']
};

export const EXCLUDE_KEYWORDS = [
  'simulation', 'pes', 'efootball', 'gameplay', 'fifa 23', 'fifa 22', 'fifa 24',
  'game play', 'fifa 25', 'ea sports fc', 'fc 24', 'fc 25', 'fifa 19', 'fifa 20', 'fifa 21',
  'alt cast', 'alt-cast', 'alternative cast', 'prediction',
  'fake', 'concept', 'fan-made', 'fan made', 'parody', 'mockup', 'mock',
  'short', 'shorts', 'women', 'womens', 'wnt',
  'train', 'training', 'press conference', 'press-conference', 'press', 'interview', 'interviews',
  'arrival', 'arrivals', 'tunnel', 'vlog', 'reaction', 'fan react', 'fans react', 'behind the scenes', 'bts',
  'futsal', 'beach soccer', 'beach', 'virtual', 'esport', 'interactive', 'esports'
];

export function normalizeTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

export function durationToSeconds(dur) {
  if (!dur) return 0;
  const parts = dur.split(':');
  if (parts.length === 1) return parseInt(parts[0], 10) || 0;
  if (parts.length === 2) return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  if (parts.length === 3) return (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
  return 0;
}

// --- Cache management ---
const CACHE_FILE = path.join(__dirname, '../src/data/highlights-cache.json');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
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
  console.warn('[Highlights Cache] Failed to load:', err.message);
}

function saveCache() {
  try {
    ensureDirectoryExistence(CACHE_FILE);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(highlightsCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[Highlights Cache] Failed to save:', err.message);
  }
}

/**
 * Parse YouTube search results HTML and find the best highlights video.
 */
export function findBestHighlight(html, home, away, homeCode, awayCode) {
  const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
  if (!dataMatch) return null;

  try {
    const data = JSON.parse(dataMatch[1]);
    const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents
      || data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (!contents) return null;

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
            const duration = vr.lengthText?.simpleText || '';
            if (title && videoId) {
              videos.push({ title, videoId, channel, duration });
            }
          }
        }
      }
    }

    const realVideos = videos.filter(v => {
      const titleLower = v.title.toLowerCase();
      const channelLower = (v.channel || '').toLowerCase();

      // Exclude based on title/channel keywords
      if (EXCLUDE_KEYWORDS.some(kw => titleLower.includes(kw) || channelLower.includes(kw))) return false;

      // Duration filter
      if (!v.duration) return false;
      const parts = v.duration.split(':');
      if (parts.length > 3) return false;
      let totalSeconds = 0;
      if (parts.length === 1) totalSeconds = parseInt(parts[0], 10) || 0;
      else if (parts.length === 2) totalSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      else if (parts.length === 3) totalSeconds = (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
      if (totalSeconds <= 0) return false;

      // Accept FIFA channel clips >= 5s, other channels >= 60s
      const isFIFAChannel = channelLower === 'fifa';
      if (isFIFAChannel && totalSeconds < 5) return false;
      if (!isFIFAChannel && (totalSeconds < 60 || totalSeconds > 900)) return false;
      if (isFIFAChannel && totalSeconds > 1800) return false;

      // Match verification: title must contain both team names
      const normTitle = titleLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normHome = normalizeTeamName(home);
      const normAway = normalizeTeamName(away);

      const checkTeam = (normName, code) => {
        const aliases = TEAM_ALIASES[normName] || [normName];
        if (code) {
          const codeLower = code.toLowerCase();
          if (!aliases.includes(codeLower)) aliases.push(codeLower);
        }
        if (aliases.some(alias => {
          // Short aliases (2-3 chars like "us", "usa") must match as whole words
          if (alias.length <= 3) {
            const regex = new RegExp(`\\b${alias}\\b`, 'i');
            return regex.test(normTitle);
          }
          return normTitle.includes(alias);
        })) return true;
        const words = normName.split(' ').filter(w => w.length > 3);
        return words.length > 0 && words.every(word => normTitle.includes(word));
      };

      if (!checkTeam(normHome, homeCode) || !checkTeam(normAway, awayCode)) return false;

      return true;
    });

    if (realVideos.length === 0) return null;

    // Sort: FIFA "Highlights" videos first, then by duration
    realVideos.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aFIFA = (a.channel || '').toLowerCase() === 'fifa';
      const bFIFA = (b.channel || '').toLowerCase() === 'fifa';
      const aHasHighlight = aTitle.includes('highlight');
      const bHasHighlight = bTitle.includes('highlight');
      // Prefer FIFA channel with "Highlights" in title
      if (aFIFA && aHasHighlight && !(bFIFA && bHasHighlight)) return -1;
      if (bFIFA && bHasHighlight && !(aFIFA && aHasHighlight)) return 1;
      // Then prefer any "Highlights" video
      if (aHasHighlight && !bHasHighlight) return -1;
      if (bHasHighlight && !aHasHighlight) return 1;
      // Then longer videos
      return durationToSeconds(b.duration) - durationToSeconds(a.duration);
    });

    const best = realVideos[0];
    return {
      videoId: best.videoId,
      url: `https://www.youtube.com/embed/${best.videoId}`,
      title: best.title,
      channel: best.channel,
      duration: best.duration
    };
  } catch (err) {
    console.warn('[Highlights] Failed to parse ytInitialData:', err);
    return null;
  }
}

/**
 * Full highlights search: query FIFA search API, falling back to YouTube for iframe embed support.
 */
export async function searchHighlights({ home, away, homeCode, awayCode }) {
  if (!home || !away) {
    return { statusCode: 400, result: { error: 'home and away parameters are required' } };
  }

  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);

  // Check cache: if data exists, assume it's valid for completed matches
  const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
  if (homeCode && awayCode && highlightsCache[cacheKey]) {
    return { statusCode: 200, result: highlightsCache[cacheKey] };
  }

  // If NOT in cache, proceed to fetch and then save
  const saveToCache = (data) => {
    if (homeCode && awayCode) {
      highlightsCache[cacheKey] = data;
      saveCache();
    }
  };

    // 1. FIFA page API (primary source for tournament highlights)
    try {
      const pageUrl = 'https://cxm-api.fifa.com/fifaplusweb/api/pages/en/tournaments/mens/worldcup/canadamexicousa2026/highlights/all-matches';
      const pageResp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (pageResp.ok) {
        const pageData = await pageResp.json();
        const sections = pageData.sections || [];
        for (const section of sections) {
          if (section.entryType !== 'sectionPromoCarousel' || !section.entryEndpoint) continue;
          const carResp = await fetch(`https://cxm-api.fifa.com/fifaplusweb/api/${section.entryEndpoint}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (!carResp.ok) continue;
          const carData = await carResp.json();
          for (const item of carData.items || []) {
            const wdd = item.watchDataDto;
            if (wdd?.type !== 'video') continue;
            const matchPart = (item.title || '').split(' | ')[0];
            if (!matchPart.includes(' v ')) continue;
            const [itemHome, itemAway] = matchPart.split(' v ', 2);
            const checkMatch = (normName, code, itemName) => {
              const normItem = normalizeTeamName(itemName);
              const aliases = TEAM_ALIASES[normName] || [normName];
              if (code) {
                const c = code.toLowerCase();
                if (!aliases.includes(c)) aliases.push(c);
              }
              for (const alias of aliases) {
                if (alias.length <= 3) {
                  if (new RegExp(`\\b${alias}\\b`, 'i').test(normItem)) return true;
                } else {
                  if (normItem.includes(alias)) return true;
                }
              }
              return false;
            };
            // Check both normal and swapped home/away order
            const matchNormal = checkMatch(normHome, homeCode, itemHome) && checkMatch(normAway, awayCode, itemAway);
            const matchSwapped = checkMatch(normHome, homeCode, itemAway) && checkMatch(normAway, awayCode, itemHome);
            if (matchNormal || matchSwapped) {
              const vid = wdd.videoEntryId;
              const dur = wdd.videoDuration || 0;
              const mins = Math.floor(dur / 60);
              const secs = Math.floor(dur % 60);
              const found = {
                videoId: vid,
                url: `https://www.fifa.com/en/watch/${vid}`,
                title: matchPart,
                channel: 'FIFA.com (Direct)',
                duration: `${mins}:${secs.toString().padStart(2, '0')}`
              };
              saveToCache(found);
              return { statusCode: 200, result: found };
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Highlights] Page API failed:', err.message);
    }

  return { statusCode: 200, result: null };
}

/**
 * Shared HTTP request handler for highlights API endpoint.
 * Works with both native Node.js HTTP req/res (Vite middleware) and Express.js.
 */
export async function handleHighlightsRoute(req, res) {
  let query = {};
  if (req.query) {
    query = req.query;
  } else if (req.url) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      query = {
        home: urlObj.searchParams.get('home'),
        away: urlObj.searchParams.get('away'),
        homeCode: urlObj.searchParams.get('homeCode'),
        awayCode: urlObj.searchParams.get('awayCode')
      };
    } catch (e) {
      // Fallback if URL parsing fails
    }
  }
  
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { statusCode, result } = await searchHighlights(query);
    res.statusCode = statusCode;
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
