import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'application/json' };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, opts = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal, headers: { ...UA, ...opts.headers } });
    clearTimeout(id);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function extractPlayerInfo(data) {
  const pi = {};
  const infoMap = {};
  for (const item of data.playerInformation || []) {
    const key = item.title || item.translationKey || '';
    const val = item.value;
    let v;
    if (val.numberValue != null) v = val.numberValue;
    else if (val.key === 'left') v = 'Left';
    else if (val.key === 'right') v = 'Right';
    else if (val.key === 'both') v = 'Both';
    else if (val.fallback) v = val.fallback;
    else if (val.dateValue) v = val.dateValue;
    if (v != null) infoMap[key] = v;
  }

  pi.name = data.name;
  pi.position = data.positionDescription?.primaryPosition?.label || '';
  pi.positions = (data.positionDescription?.positions || []).map(p => p.strPosShort?.label || '').filter(Boolean);
  pi.teamName = data.primaryTeam?.teamName || '';
  pi.teamId = data.primaryTeam?.teamId || null;
  pi.teamColors = data.primaryTeam?.teamColors || null;
  pi.shirt = infoMap['Shirt'] || null;
  pi.age = infoMap['Age'] || null;
  pi.height = infoMap['Height'] ? infoMap['Height'] + ' cm' : null;
  pi.foot = infoMap['Preferred foot'] || null;
  pi.country = infoMap['Country'] || null;
  pi.marketValue = infoMap['Market value'] != null
    ? (infoMap['Market value'] > 1000000
      ? '€' + (infoMap['Market value'] / 1000000).toFixed(1) + 'm'
      : '€' + (infoMap['Market value'] / 1000).toFixed(0) + 'k')
    : null;
  pi.contractEnd = infoMap['Contract end']
    ? (typeof infoMap['Contract end'] === 'object' ? (infoMap['Contract end'].utcTime || null) : infoMap['Contract end'])
    : null;
  pi.recentMatches = (data.recentMatches || []).slice(0, 10).map(m => ({
    matchDate: m.matchDate,
    opponentTeamName: m.opponentTeamName,
    isHomeTeam: m.isHomeTeam,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    minutesPlayed: m.minutesPlayed,
    goals: m.goals,
    assists: m.assists,
    rating: m.ratingProps?.rating != null ? Number(m.ratingProps.rating) : null,
    playerOfTheMatch: m.playerOfTheMatch || false,
  }));
  pi.seasonStats = {};
  for (const stat of (data.mainLeague?.stats || [])) {
    let val = stat.value;
    if (stat.title === 'Rating' && typeof val === 'number') val = Math.round(val * 100) / 100;
    pi.seasonStats[stat.title] = val;
  }
  return pi;
}

async function getBuildAndSlugs() {
  const html = await (await (await fetch('https://www.fotmob.com/players/30981/lionel-messi', { headers: UA })).text());
  const buildMatch = html.match(/"buildId":"([^"]+)"/);
  const buildId = buildMatch?.[1];
  // Extract all slug mappings from all page HTML
  // Instead, we'll construct slugs from names
  return buildId;
}

function nameToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function syncPlayerDetails() {
  console.log('[Player Details] Fetching player data from Fotmob...');
  const ratingsPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
  const outputPath = path.join(__dirname, '../../src/data/fotmobPlayerDetails.json');
  const ratings = JSON.parse(fs.readFileSync(ratingsPath, 'utf8'));

  // Load existing progress
  let details = {};
  if (fs.existsSync(outputPath)) {
    try { details = JSON.parse(fs.readFileSync(outputPath, 'utf8')); } catch { /* file not found */ }
  }

  const buildId = await getBuildAndSlugs();
  console.log('[Player Details] BuildId:', buildId);

  const remaining = ratings.filter(p => !details[p.playerId]);
  console.log(`[Player Details] ${Object.keys(details).length} done, ${remaining.length} remaining`);

  let done = Object.keys(details).length;
  let failed = 0;
  const BATCH = 5;

  for (let i = 0; i < remaining.length; i += BATCH) {
    const batch = remaining.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(async (p) => {
      const slug = nameToSlug(p.name);
      const url = `https://www.fotmob.com/_next/data/${buildId}/players/${p.playerId}/${slug}.json`;
      const d = await fetchJSON(url);
      return { id: p.playerId, data: extractPlayerInfo(d.pageProps.data) };
    }));

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        details[r.value.id] = r.value.data;
        done++;
      } else {
        failed++;
        done++;
      }
    }

    if ((i + BATCH) % 50 === 0 || i + BATCH >= remaining.length) {
      console.log(`  [${done}/${ratings.length}] ${failed} failed`);
      fs.writeFileSync(outputPath, JSON.stringify(details, null, 2), 'utf8');
    }

    await sleep(1500);
  }

  fs.writeFileSync(outputPath, JSON.stringify(details, null, 2), 'utf8');
  const totalDone = Object.keys(details).length;
  console.log(`[Player Details] Done: ${totalDone}/${ratings.length}, ${failed} failed`);
  return { count: totalDone, failed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncPlayerDetails().catch(e => { console.error(e); process.exit(1); });
}
