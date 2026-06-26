import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UA = { 'User-Agent': 'WorldCup2026Roadmap/1.0 (worldcup)' };
const API = 'https://en.wikipedia.org/w/api.php';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchAPI(params) {
  const r = await fetch(API + '?' + new URLSearchParams(params).toString(), { headers: UA });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function getImageFor(searchTerm) {
  // Use generator=search with pageimages to get images in one call
  try {
    const data = await fetchAPI({
      action: 'query', generator: 'search', gsrsearch: searchTerm,
      gsrlimit: 5, prop: 'pageimages', piprop: 'thumbnail',
      pithumbsize: 330, format: 'json', origin: '*'
    });
    const pages = Object.values(data.query?.pages || {});
    const valid = pages.filter(p =>
      p.thumbnail?.source && !p.title.startsWith('List of') &&
      !p.title.includes('(disambiguation)') && !p.title.includes('(surname)')
    ).sort((a, b) => a.index - b.index);
    return valid[0]?.thumbnail?.source || null;
  } catch { return null; }
}

async function main() {
  const imgPath = path.join(__dirname, '../../src/data/playerImages.json');
  const ratingsPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
  const imgs = JSON.parse(fs.readFileSync(imgPath, 'utf8'));
  const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));
  const missing = ratings.filter(p => !imgs.byName[p.name]);

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const p = missing[i];
    await sleep(2500);

    let img = await getImageFor(p.name + ' footballer');
    if (!img && p.name.split(/\s+/).length > 2) {
      const parts = p.name.split(/\s+/);
      await sleep(2000);
      img = await getImageFor(parts[0] + ' ' + parts[parts.length - 1] + ' footballer');
    }
    if (!img) {
      await sleep(2000);
      img = await getImageFor(p.name);
    }

    if (img) {
      imgs.byName[p.name] = img;
      if (p.playerId) imgs.byId[p.playerId] = img;
      found++;
      fs.writeFileSync(imgPath, JSON.stringify(imgs, null, 2), 'utf8');
      console.log(`[${i+1}/${missing.length}] FOUND ${p.name}`);
    } else {
      console.log(`[${i+1}/${missing.length}] MISS  ${p.name}`);
    }
  }

  const total = Object.keys(imgs.byName).length;
  imgs.meta = { totalPlayers: 874, foundImages: total, missing: 874 - total, fetchedAt: new Date().toISOString() };
  fs.writeFileSync(imgPath, JSON.stringify(imgs, null, 2), 'utf8');
  console.log(`\nDone: ${found} new, ${total}/874 total`);
}

main().catch(e => { console.error(e); process.exit(1); });
