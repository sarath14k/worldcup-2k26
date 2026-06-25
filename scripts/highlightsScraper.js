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

export const HARDCODED_HIGHLIGHTS = {
  'canada-bosnia  herzegovina': 'https://www.youtube.com/watch?v=w-_rY5morQY',
  'bosnia  herzegovina-canada': 'https://www.youtube.com/watch?v=w-_rY5morQY'
};

export const EXCLUDE_KEYWORDS = [
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

// --- Shared helpers ---
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

export function isAllowedChannel(channelName, channelUrl) {
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
}

export function isFIFAChannel(channelName) {
  const channelLower = (channelName || '').toLowerCase().trim();
  return channelLower === 'fifa' || 
         channelLower === 'fifatv' || 
         channelLower === 'fifa (direct)';
}

// --- Cache management ---
const CACHE_FILE = path.join(__dirname, '../src/data/highlights-cache.json');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Load cache (filter to FIFA-only entries)
let highlightsCache = {};
try {
  if (fs.existsSync(CACHE_FILE)) {
    const rawCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    for (const [key, val] of Object.entries(rawCache)) {
      if (isFIFAChannel(val.channel)) {
        highlightsCache[key] = val;
      }
    }
    ensureDirectoryExistence(CACHE_FILE);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(highlightsCache, null, 2), 'utf8');
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

// --- Core search logic ---

/**
 * Parse YouTube search results HTML and find the best FIFA highlights video.
 * @param {string} html - Raw YouTube search results page HTML
 * @param {string} home - Home team name
 * @param {string} away - Away team name
 * @param {string|null} homeCode - Home team 3-letter code
 * @param {string|null} awayCode - Away team 3-letter code
 * @returns {{ videoId, url, title, channel, duration } | null}
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

    const realVideos = videos.filter(v => {
      const titleLower = v.title.toLowerCase();
      const channelLower = (v.channel || '').toLowerCase();

      // 1. Exclude based on title/channel keywords
      if (EXCLUDE_KEYWORDS.some(kw => titleLower.includes(kw) || channelLower.includes(kw))) return false;

      // 2. Exclude standalone "ai"
      const titleWords = titleLower.split(/[^a-z0-9]/);
      const channelWords = channelLower.split(/[^a-z0-9]/);
      if (titleWords.includes('ai') || channelWords.includes('ai')) return false;

      // 2b. Exclude other years
      const yearMatch = titleLower.match(/\b(19\d\d|20[0-2][0-5]|202[7-9])\b/);
      if (yearMatch) return false;

      // 3. Allowed channel check
      if (!isAllowedChannel(v.channel, v.channelUrl)) return false;

      // 4. Duration filter (60s - 600s)
      if (!v.duration) return false;
      const parts = v.duration.split(':');
      if (parts.length === 1 || parts.length === 3) return false;
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (isNaN(minutes) || isNaN(seconds)) return false;
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds < 60 || totalSeconds > 600) return false;
      }

      // 5. Match verification: title must contain both team names
      const normTitle = titleLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normHome = normalizeTeamName(home);
      const normAway = normalizeTeamName(away);

      const checkTeam = (normName, code) => {
        const aliases = TEAM_ALIASES[normName] || [normName];
        if (code) aliases.push(code.toLowerCase());
        if (aliases.some(alias => normTitle.includes(alias))) return true;
        const words = normName.split(' ').filter(w => w.length > 3);
        return words.length > 0 && words.every(word => normTitle.includes(word));
      };

      if (!checkTeam(normHome, homeCode) || !checkTeam(normAway, awayCode)) return false;

      return true;
    });

    if (realVideos.length === 0) return null;

    // Sort: prefer longer videos (>= 115s)
    realVideos.sort((a, b) => {
      const aLong = durationToSeconds(a.duration) >= 115;
      const bLong = durationToSeconds(b.duration) >= 115;
      if (aLong && !bLong) return -1;
      if (!aLong && bLong) return 1;
      return 0;
    });

    const best = realVideos[0];
    return {
      videoId: best.videoId,
      url: `https://www.youtube.com/watch?v=${best.videoId}`,
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
 * Full highlights search: checks hardcoded, cache, then YouTube.
 * Returns { result, statusCode } where result is the JSON response body.
 */
export async function searchHighlights({ home, away, homeCode, awayCode }) {
  if (!home || !away) {
    return { statusCode: 400, result: { error: 'home and away parameters are required' } };
  }

  // 1. Check hardcoded
  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);
  const fallbackKey = `${normHome}-${normAway}`;
  if (HARDCODED_HIGHLIGHTS[fallbackKey]) {
    return {
      statusCode: 200,
      result: {
        videoId: HARDCODED_HIGHLIGHTS[fallbackKey].split('v=')[1],
        url: HARDCODED_HIGHLIGHTS[fallbackKey],
        title: `Highlights | ${home} vs ${away} | FIFA World Cup 2026™`,
        channel: 'FIFA (Direct)'
      }
    };
  }

  // 2. Check cache
  let cachedShortFallback = null;
  const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
  if (homeCode && awayCode && highlightsCache[cacheKey]) {
    const cached = highlightsCache[cacheKey];
    if (isFIFAChannel(cached.channel)) {
      const cachedSec = durationToSeconds(cached.duration);
      if (cachedSec >= 115) {
        return { statusCode: 200, result: cached };
      }
      cachedShortFallback = cached;
    }
  }

  // 3. Search YouTube
  try {
    const cleanHome = home.replace(/&/g, 'and');
    const cleanAway = away.replace(/&/g, 'and');
    const query = `FIFA ${cleanHome} v ${cleanAway} World Cup highlights`;
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
    const found = findBestHighlight(html, home, away, homeCode, awayCode);

    if (found) {
      if (homeCode && awayCode) {
        highlightsCache[cacheKey] = found;
        saveCache();
      }
      return { statusCode: 200, result: found };
    }

    if (cachedShortFallback) {
      return { statusCode: 200, result: cachedShortFallback };
    }

    return { statusCode: 404, result: { error: 'No video highlights found' } };
  } catch (err) {
    console.error('[Highlights] Error:', err.message);
    if (cachedShortFallback) {
      return { statusCode: 200, result: cachedShortFallback };
    }
    return { statusCode: 500, result: { error: err.message } };
  }
}
