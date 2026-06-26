import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { FOTMOB_TEAM_MAP } from './fotmobTeamMap.js';
import { fetchWithRetry } from './fetchWithRetry.js';

export async function syncRatings() {
  console.log('[Ratings Sync] Fetching player ratings from FotMob API...');
  
  try {
    const response = await fetchWithRetry('https://www.fotmob.com/api/data/leagueseasondeepstats?id=77&season=24254&type=players&stat=rating&slug=world-cup-players', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const data = await response.json();
    const statsData = data.statsData || [];
    
    console.log(`[Ratings Sync] Received ${statsData.length} player records from API.`);
    
    const cleanedRatings = [];
    statsData.forEach(p => {
      if (!p.name || !p.statValue?.value || !p.teamId) return;
      
      const teamAbbr = FOTMOB_TEAM_MAP[String(p.teamId)];
      if (!teamAbbr) {
        // Skip players from non-tournament teams
        return;
      }
      
      cleanedRatings.push({
        rank: p.rank,
        name: p.name,
        team: teamAbbr,
        rating: p.statValue.value,
        playerId: String(p.id)
      });
    });
    
    console.log(`[Ratings Sync] Cleaned and mapped ${cleanedRatings.length} tournament players.`);
    
    // Sort by rank ascending / rating descending
    cleanedRatings.sort((a, b) => a.rank - b.rank || b.rating - a.rating);
    
    // Update ranks to be sequential starting at 1
    cleanedRatings.forEach((p, index) => {
      p.rank = index + 1;
    });

    const srcPath = path.join(__dirname, '../../src/data/fotmobPlayerRatings.json');
    const publicPath = path.join(__dirname, '../../public/fotmobPlayerRatings.json');
    const distPath = path.join(__dirname, '../../dist/fotmobPlayerRatings.json');

    const outputString = JSON.stringify(cleanedRatings, null, 2);

    fs.writeFileSync(srcPath, outputString, 'utf8');
    fs.writeFileSync(publicPath, outputString, 'utf8');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, outputString, 'utf8');
    }

    console.log(`[Ratings Sync] Successfully saved player ratings data.`);
    return { success: true, count: cleanedRatings.length };
    
  } catch (err) {
    console.error('[Ratings Sync] Error during execution:', err);
    return { success: false, error: err.message };
  }
}

// Support direct command-line execution for testing
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncRatings().then(res => {
    console.log('[Ratings Sync] Completed direct execution:', res);
  }).catch(err => {
    console.error('[Ratings Sync] Failed direct execution:', err);
  });
}
