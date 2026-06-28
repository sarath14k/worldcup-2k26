import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchAndGetImage(searchTerm) {
  // Use generator=search with pageimages prop — gets images in one call
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: searchTerm,
    gsrlimit: 10,
    prop: 'pageimages|info',
    piprop: 'thumbnail',
    pithumbsize: 330,
    inprop: 'url',
    format: 'json',
    origin: '*'
  });
  try {
    const data = await fetchJSON(`${WIKI_API}?${params}`);
    const pages = data.query?.pages;
    if (!pages) return null;
    const sorted = Object.values(pages)
      .filter(p => p.thumbnail?.source && !p.title.startsWith('List of') && !p.title.includes('(disambiguation)') && !p.title.includes('(surname)'))
      .sort((a, b) => a.index - b.index);
    return sorted[0]?.thumbnail?.source || null;
  } catch { return null; }
}

async function trySummaryImage(title) {
  try {
    const data = await fetchJSON(`${WIKI_SUMMARY}/${encodeURIComponent(title)}`);
    return data.thumbnail?.source || null;
  } catch { return null; }
}

function generateVariants(name) {
  const variants = new Set();
  variants.add(name);
  // normalized (no accents)
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized !== name) variants.add(normalized);

  // (footballer) suffix
  variants.add(`${name} (footballer)`);

  // Try first + last name only (drop middle names)
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2) {
    const firstLast = `${parts[0]} ${parts[parts.length - 1]}`;
    variants.add(firstLast);
    variants.add(`${firstLast} (footballer)`);
  }

  // Reversed (last, first)
  if (parts.length >= 2) {
    const reversed = `${parts[parts.length - 1]} ${parts[0]}`;
    variants.add(reversed);
  }

  // Try with common diacritic replacements
  const replacements = {
    'c': ['ć', 'č', 'ç'],
    's': ['š', 'ś'],
    'z': ['ž', 'ź'],
    'd': ['đ', 'ð'],
    'e': ['é', 'è', 'ê', 'ë'],
    'a': ['á', 'à', 'â', 'ã', 'ä'],
    'i': ['í', 'ì', 'î', 'ï'],
    'o': ['ó', 'ò', 'ô', 'õ', 'ö'],
    'u': ['ú', 'ù', 'û', 'ü'],
    'n': ['ñ'],
  };

  for (let i = 0; i < parts.length; i++) {
    for (const [ascii, accented] of Object.entries(replacements)) {
      if (parts[i].includes(ascii)) {
        for (const a of accented) {
          const variant = [...parts];
          variant[i] = parts[i].replace(ascii, a);
          variants.add(variant.join(' '));
          variants.add(`${variant.join(' ')} (footballer)`);
        }
      }
    }
  }

  // Try with apostrophe variants
  if (name.includes("'")) {
    variants.add(name.replace(/'/g, ''));
    variants.add(name.replace(/'/g, ''));
  }

  return [...variants];
}

async function main() {
  const missingPath = path.join(__dirname, '../../src/data/playerImages.json');
  const ratingsPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
  const playerImages = JSON.parse(fs.readFileSync(missingPath, 'utf8'));
  const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));

  const missing = ratings.filter(p => !playerImages.byName[p.name]);
  console.log(`Missing: ${missing.length} players`);
  missing.forEach(p => console.log(`  ${p.name} (${p.team})`));

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const player = missing[i];
    const variants = generateVariants(player.name);
    let img = null;
    let usedVariant = null;

    // Level 1: try summary API directly
    for (const v of variants) {
      img = await trySummaryImage(v);
      if (img) { usedVariant = v; break; }
    }

    // Level 2: search and find image
    if (!img) {
      for (const v of variants.slice(0, 5)) {
        img = await searchAndGetImage(v);
        if (img) { usedVariant = `search:${v}`; break; }
        await sleep(300);
      }
    }

    if (img) {
      playerImages.byName[player.name] = img;
      if (player.playerId) playerImages.byId[player.playerId] = img;
      found++;
      console.log(`  [${i + 1}/${missing.length}] FOUND ${player.name} → ${usedVariant}`);
    } else {
      console.log(`  [${i + 1}/${missing.length}] MISS ${player.name}`);
    }

    await sleep(800);
  }

  playerImages.meta = {
    totalPlayers: ratings.length,
    foundImages: Object.keys(playerImages.byName).length,
    missing: ratings.length - Object.keys(playerImages.byName).length,
    fetchedAt: new Date().toISOString()
  };

  fs.writeFileSync(missingPath, JSON.stringify(playerImages, null, 2), 'utf8');
  console.log(`\nDone: +${found} new, ${Object.keys(playerImages.byName).length}/${ratings.length} total`);
}

main().catch(e => { console.error(e); process.exit(1); });
