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

export function normalizeTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
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
 * Search official FIFA.com search API.
 * Returns { result, statusCode } where result is the JSON response body.
 */
export async function searchHighlights({ home, away, homeCode, awayCode }) {
  if (!home || !away) {
    return { statusCode: 400, result: { error: 'home and away parameters are required' } };
  }

  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);

  // Check cache
  const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
  if (homeCode && awayCode && highlightsCache[cacheKey]) {
    return { statusCode: 200, result: highlightsCache[cacheKey] };
  }

  // Search official FIFA.com search API
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

        // STRICT FILTERING: Reject any youth, futsal, womens, interactive, or historical years
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
          // Reject other years (e.g. 1982, 2022, etc.)
          (/\b(19\d\d|20[0-2][0-5]|202[7-9])\b/.test(titleLower)) ||
          // Reject tags
          tags.some(tag => 
            tag.includes('women') || 
            tag.includes('futsal') || 
            tag.includes('u-17') || 
            tag.includes('u-20') || 
            tag.includes('u-23') || 
            tag.includes('under-') || 
            tag.includes('interactive') ||
            // Must not be a past world cup
            (tag.includes('world cup') && !tag.includes('2026'))
          );

        if (isExcluded) continue;

        // Must match either 2026 or World Cup 2026 in title or tags
        const has2026 = titleLower.includes('2026') || tags.some(tag => tag.includes('2026'));
        if (!has2026) continue;

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

          if (homeCode && awayCode) {
            highlightsCache[cacheKey] = found;
            saveCache();
          }
          return { statusCode: 200, result: found };
        }
      }
    }
    
    return { statusCode: 404, result: { error: 'No video highlights found' } };
  } catch (err) {
    console.error('[Highlights] FIFA Search API failed:', err.message);
    return { statusCode: 500, result: { error: err.message } };
  }
}
