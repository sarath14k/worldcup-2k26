/**
 * Fetches player images from Wikipedia REST API.
 * Saves mapping of player name → image URL + playerId → image URL.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchImage(playerName, retries = 2) {
  const encoded = encodeURIComponent(playerName);
  const url = `${WIKI_API}/${encoded}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'WorldCup2026Roadmap/1.0 (sarath14k@gmail.com)',
          'Accept': 'application/json'
        }
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
        console.warn(`  Rate limited for "${playerName}", waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.thumbnail?.source) {
        // Use the 330px thumbnail
        return data.thumbnail.source;
      }

      return null;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`  Retry ${attempt + 1} for "${playerName}": ${err.message}`);
        await sleep(1000 * (attempt + 1));
      } else {
        console.warn(`  Failed for "${playerName}": ${err.message}`);
      }
    }
  }
  return null;
}

async function fetchPlayerImages() {
  console.log('[Player Images] Loading player data...');
  const ratingsPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
  const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));

  console.log(`[Player Images] Found ${ratings.length} players.`);

  const nameImageMap = {};
  const idImageMap = {};
  let fetched = 0;
  let found = 0;

  // Process in batches with delay to be nice to Wikipedia
  const batchSize = 10;
  const batchDelay = 1500;

  for (let i = 0; i < ratings.length; i += batchSize) {
    const batch = ratings.slice(i, i + batchSize);
    const promises = batch.map(async (player) => {
      if (nameImageMap[player.name]) return;
      fetched++;
      const img = await fetchImage(player.name);
      if (img) {
        nameImageMap[player.name] = img;
        if (player.playerId) {
          idImageMap[player.playerId] = img;
        }
        found++;
      }
      const pct = ((fetched / ratings.length) * 100).toFixed(1);
      process.stdout.write(`\r  [${fetched}/${ratings.length}] ${pct}% – Found: ${found}`);
    });

    await Promise.all(promises);

    if (i + batchSize < ratings.length) {
      await sleep(batchDelay);
    }
  }

  console.log('\n');

  // Save to JSON
  const outputPath = path.join(__dirname, '../../src/data/playerImages.json');
  const output = {
    byName: nameImageMap,
    byId: idImageMap,
    meta: {
      totalPlayers: ratings.length,
      foundImages: found,
      missing: ratings.length - found,
      fetchedAt: new Date().toISOString()
    }
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[Player Images] Saved to ${outputPath}`);
  console.log(`[Player Images] Found: ${found} / ${ratings.length} (${((found/ratings.length)*100).toFixed(1)}%)`);

  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchPlayerImages().catch(err => {
    console.error('[Player Images] Fatal:', err);
    process.exit(1);
  });
}

export { fetchPlayerImages };
