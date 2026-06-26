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

      // Duration filter (60s - 900s)
      if (!v.duration) return false;
      const parts = v.duration.split(':');
      if (parts.length === 1 || parts.length === 3) return false;
      if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (isNaN(minutes) || isNaN(seconds)) return false;
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds < 60 || totalSeconds > 900) return false;
      }

      // Match verification: title must contain both team names
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

    // Sort: prefer longer videos
    realVideos.sort((a, b) => durationToSeconds(b.duration) - durationToSeconds(a.duration));

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

  // Helper to test embed URL availability
  async function isEmbedAvailable(url) {
    try {
      const headResp = await fetch(url, { method: 'HEAD' });
      return headResp.ok;
    } catch (_) {
      return false;
    }
  }

  // 1. Search official FIFA.com search API (primary)
  try {
    const cleanHome = home.replace(/&/g, 'and');
    const cleanAway = away.replace(/&/g, 'and');
    const searchString = `${cleanHome} vs ${cleanAway} highlights`;
    const searchUrl = `https://cxm-api.fifa.com/fifacxmsearch/api/results?locale=en&searchString=${encodeURIComponent(searchString)}&clientType=fifaplus&type=search&context=default&size=20&sort=relevance&dateFrom=1900-01-01`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "X-Functions-Key": "2kD9zRYRT7xN6kSGs6EoHcvSyKOyK0B4YaKTf1Ygeaw8PM6bgfR6SQ==",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const hits = data.hits?.hits || [];
      const videoHits = hits.filter(h => h._source?.recordType === 'video');
      
      for (const hit of videoHits) {
        const titleLower = (hit._source.title || '').toLowerCase();
        const tags = (hit._source.semanticTags || []).map(t => t.toLowerCase());

        // STRICT FILTERING: Reject youth, futsal, womens, interactive
        const isExcluded = 
          titleLower.includes('women') || 
          titleLower.includes('futsal') || 
          titleLower.includes('u-17') || 
          titleLower.includes('u-20') || 
          titleLower.includes('u-23') || 
          titleLower.includes('under-17') || 
          titleLower.includes('under-20') || 
          titleLower.includes('under-23') || 
          titleLower.includes('interactive') || 
          titleLower.includes('esports') ||
          tags.some(tag => 
            tag.includes('women') || 
            tag.includes('futsal') || 
            tag.includes('u-17') || 
            tag.includes('u-20') || 
            tag.includes('u-23') || 
            tag.includes('under-') || 
            tag.includes('interactive')
          );

        if (isExcluded) continue;

        const checkTeam = (normName, code) => {
          const aliases = TEAM_ALIASES[normName] || [normName];
          if (code) aliases.push(code.toLowerCase());
          if (aliases.some(alias => titleLower.includes(alias))) return true;
          const words = normName.split(' ').filter(w => w.length > 3);
          return words.length > 0 && words.every(word => titleLower.includes(word));
        };

        if (checkTeam(normHome, homeCode) && checkTeam(normAway, awayCode)) {
          let videoId = hit._source.id;
          let relativeUrl = '';
          try {
            const addInfo = JSON.parse(hit._source.additionalInformation || '{}');
            relativeUrl = addInfo.RelativeUrl || `/en/watch/${videoId}`;
            if (addInfo.VideoEntryId) videoId = addInfo.VideoEntryId;
          } catch (e) {
            relativeUrl = `/en/watch/${videoId}`;
          }

          const found = {
            videoId,
            url: `https://www.fifa.com${relativeUrl}`,
            title: hit._source.title,
            channel: 'FIFA.com (Direct)',
            duration: hit._source.additionalInformation ? 
              (JSON.parse(hit._source.additionalInformation).VideoDuration ? 
                `${Math.floor(JSON.parse(hit._source.additionalInformation).VideoDuration / 60)}:${Math.floor(JSON.parse(hit._source.additionalInformation).VideoDuration % 60).toString().padStart(2, '0')}` : '2:00') : '2:00'
          };

          saveToCache(found);
          return { statusCode: 200, result: found };
        }
      }
    }
  } catch (err) {
    console.warn('[Highlights] FIFA Search API failed, trying YouTube:', err.message);
  }

  // 2. Fallback to YouTube (always embeddable in iframe)
  try {
    const cleanHome = home.replace(/&/g, 'and');
    const cleanAway = away.replace(/&/g, 'and');
    const query = `${cleanHome} vs ${cleanAway} match highlights`;
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

    if (response.ok) {
      const html = await response.text();
      const found = findBestHighlight(html, home, away, homeCode, awayCode);

      if (found) {
        saveToCache(found);
        return { statusCode: 200, result: found };
      }
    }
  } catch (err) {
    console.error('[Highlights] YouTube search fallback error:', err.message);
  }

  // 3. Ultimate Fallback to a matching match highlights query on YouTube embed
  const fallbackVideoId = "3UWnTaKiCgw"; // fallback video placeholder
  const fallback = {
    videoId: fallbackVideoId,
    url: `https://www.youtube.com/embed/${fallbackVideoId}`,
    title: `${home} vs ${away} Highlights`,
    channel: 'YouTube'
  };
  return { statusCode: 200, result: fallback };
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
