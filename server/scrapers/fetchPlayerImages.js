import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKI_SEARCH = 'https://en.wikipedia.org/w/api.php';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WorldCup2026Roadmap/1.0 (sarath14k@gmail.com)',
      'Accept': 'application/json',
      ...opts.headers
    },
    ...opts
  });
  if (res.status === 429) throw Object.assign(new Error('Rate limited'), { status: 429, retryAfter: parseInt(res.headers.get('Retry-After') || '5', 10) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getSummaryImage(title, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchJSON(`${WIKI_SUMMARY}/${encodeURIComponent(title)}`);
      if (data.thumbnail?.source) return data.thumbnail.source;
      return null;
    } catch (err) {
      if (err.status === 429) { await sleep(err.retryAfter * 1000); continue; }
      if (err.message.includes('HTTP 404')) return null;
      if (attempt < retries) await sleep(500);
    }
  }
  return null;
}

async function searchPage(searchTerm) {
  const params = new URLSearchParams({
    action: 'query', list: 'search', srsearch: searchTerm,
    format: 'json', origin: '*', srlimit: 5, srprop: ''
  });
  try {
    const data = await fetchJSON(`${WIKI_SEARCH}?${params}`);
    return (data.query?.search || []).map(r => r.title);
  } catch { return []; }
}

// Phase 1: Quick check via exact name on summary API
async function phase1(ratings) {
  console.log('[Phase 1] Quick check — exact name match...');
  const nameImageMap = {};
  const idImageMap = {};
  let fetched = 0, found = 0;

  for (let i = 0; i < ratings.length; i += 10) {
    const batch = ratings.slice(i, i + 10);
    await Promise.all(batch.map(async (player) => {
      if (nameImageMap[player.name]) return;
      fetched++;
      const img = await getSummaryImage(player.name);
      if (img) {
        nameImageMap[player.name] = img;
        if (player.playerId) idImageMap[player.playerId] = img;
        found++;
      }
      process.stdout.write(`\r  [${fetched}/${ratings.length}] Found: ${found}`);
    }));
    if (i + 10 < ratings.length) await sleep(1500);
  }
  console.log(`\n  Phase 1 done: ${found} found`);
  return { nameImageMap, idImageMap, found };
}

// Phase 2: Search fallback for missing players
async function phase2(ratings, existingNames, existingIds) {
  const missing = ratings.filter(p => !existingNames[p.name]);
  console.log(`[Phase 2] Search fallback for ${missing.length} missing players...`);

  const nameImageMap = { ...existingNames };
  const idImageMap = { ...existingIds };
  let fetched = 0, found = 0;

  for (let i = 0; i < missing.length; i += 5) {
    const batch = missing.slice(i, i + 5);
    await Promise.all(batch.map(async (player) => {
      if (nameImageMap[player.name]) return;
      fetched++;
      let img = null;

      // Try search: "player name footballer"
      const titles = await searchPage(`${player.name} footballer`);
      const valid = titles.filter(t =>
        !t.startsWith('List of') && !t.startsWith('Wikipedia:') && !t.includes('(disambiguation)') && !t.includes('(surname)')
      );
      for (const title of valid) {
        img = await getSummaryImage(title);
        if (img) break;
      }

      // Try name variations
      if (!img) {
        const parts = player.name.trim().split(/\s+/);
        const variants = [];
        if (parts.length >= 2) {
          const reversed = [...parts.slice(1), parts[0]].join(' ');
          variants.push(reversed, `${reversed} (footballer)`);
        }
        // Add (footballer) suffix to original
        variants.push(`${player.name} (footballer)`);
        // Normalize accents
        const normalized = player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized !== player.name) variants.push(normalized);

        for (const v of variants) {
          if (img) break;
          img = await getSummaryImage(v);
          if (!img) {
            const moreTitles = await searchPage(`${v} footballer`);
            const moreValid = moreTitles.filter(t =>
              !t.startsWith('List of') && !t.startsWith('Wikipedia:')
            );
            for (const t of moreValid) {
              img = await getSummaryImage(t);
              if (img) break;
            }
          }
        }
      }

      if (img) {
        nameImageMap[player.name] = img;
        if (player.playerId) idImageMap[player.playerId] = img;
        found++;
      }
      process.stdout.write(`\r  [${fetched}/${missing.length}] Found: ${Object.keys(nameImageMap).length}`);
    }));
    if (i + 5 < missing.length) await sleep(2000);
  }
  console.log(`\n  Phase 2 done: +${found} new images`);
  return { nameImageMap, idImageMap, totalFound: Object.keys(nameImageMap).length };
}

async function fetchPlayerImages() {
  console.log('[Player Images] Loading player data...');
  const ratingsPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
  const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
  console.log(`[Player Images] ${ratings.length} players total.`);

  // Phase 1: quick exact-name match
  const phase1Result = await phase1(ratings);

  // Save phase1 results (in case phase2 times out)
  const outputPath = path.join(__dirname, '../../src/data/playerImages.json');
  const phase1Output = {
    byName: phase1Result.nameImageMap,
    byId: phase1Result.idImageMap,
    meta: { totalPlayers: ratings.length, foundImages: phase1Result.found, missing: ratings.length - phase1Result.found, fetchedAt: new Date().toISOString() }
  };
  fs.writeFileSync(outputPath, JSON.stringify(phase1Output, null, 2), 'utf8');
  console.log(`[Phase 1] Interim save: ${phase1Result.found}/${ratings.length}`);

  // Phase 2: search fallback for missing
  const result = await phase2(ratings, phase1Result.nameImageMap, phase1Result.idImageMap);
  const output = {
    byName: result.nameImageMap,
    byId: result.idImageMap,
    meta: {
      totalPlayers: ratings.length,
      foundImages: result.totalFound,
      missing: ratings.length - result.totalFound,
      fetchedAt: new Date().toISOString()
    }
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[Player Images] Saved → ${outputPath}`);
  console.log(`[Player Images] Result: ${result.totalFound}/${ratings.length} (${((result.totalFound/ratings.length)*100).toFixed(1)}%)`);
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchPlayerImages().catch(err => {
    console.error('[Player Images] Fatal:', err);
    process.exit(1);
  });
}

export { fetchPlayerImages };
