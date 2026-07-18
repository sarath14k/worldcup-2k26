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
const CACHE_FILE = path.join(__dirname, '../../src/data/highlights-cache.json');

function ensureDirectoryExistence(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
 * Full highlights search: query FIFA search API, falling back to YouTube for iframe embed support.
 */
export async function searchHighlights({ home, away, homeCode, awayCode }) {
  if (!home || !away) {
    return { statusCode: 400, result: { error: 'home and away parameters are required' } };
  }

  const normHome = normalizeTeamName(home);
  const normAway = normalizeTeamName(away);

  // Check cache: skip stale entries with missing videoId
  const cacheKey = `${homeCode || ''}_vs_${awayCode || ''}`.toLowerCase();
  const cached = homeCode && awayCode && highlightsCache[cacheKey];
  if (cached && cached.videoId) {
    return { statusCode: 200, result: cached };
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
          if (!section.entryEndpoint) continue;
          if (section.entryType !== 'sectionPromoCarousel' && section.entryType !== 'news') continue;
          const ep = section.entryEndpoint.startsWith('/') ? section.entryEndpoint.slice(1) : section.entryEndpoint;
          const carResp = await fetch(`https://cxm-api.fifa.com/fifaplusweb/api/${ep}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (!carResp.ok) continue;
          const carData = await carResp.json();
          for (const item of carData.items || []) {
            const wdd = item.watchDataDto;
            if (wdd?.type !== 'video') continue;
            const matchPart = (item.title || '').split(/\s*\|\s*/)[0];
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
                duration: `${mins}:${secs.toString().padStart(2, '0')}`,
                thumbnail: item.image?.src || null
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
    } catch {
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
