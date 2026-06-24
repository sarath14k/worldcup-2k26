import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOTMOB_TEAM_MAP = {
  '5796': 'URU',
  '5810': 'CAN',
  '5816': 'JOR',
  '5819': 'IRQ',
  '5820': 'NZL',
  '5888': 'CPV',
  '5902': 'QAT',
  '5922': 'PAN',
  '5934': 'HAI',
  '6262': 'MAR',
  '6316': 'RSA',
  '6317': 'ALG',
  '6321': 'COD',
  '6395': 'SEN',
  '6595': 'TUR',
  '6706': 'ARG',
  '6707': 'ECU',
  '6708': 'NED',
  '6709': 'CIV',
  '6710': 'MEX',
  '6711': 'IRN',
  '6713': 'USA',
  '6714': 'GHA',
  '6715': 'JPN',
  '6716': 'AUS',
  '6717': 'SUI',
  '6719': 'TUN',
  '6720': 'ESP',
  '6723': 'FRA',
  '6724': 'PAR',
  '7795': 'KSA',
  '7804': 'KOR',
  '8255': 'AUT',
  '8256': 'BRA',
  '8258': 'COL',
  '8263': 'BEL',
  '8361': 'POR',
  '8491': 'ENG',
  '8492': 'NOR',
  '8496': 'CZE',
  '8498': 'SCO',
  '8520': 'SWE',
  '8570': 'GER',
  '8700': 'UZB',
  '10106': 'BIH',
  '10155': 'CRO',
  '10255': 'EGY',
  '287981': 'CUW'
};

export async function syncRatings() {
  console.log('[Ratings Sync] Fetching player ratings from FotMob API...');
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch('https://www.fotmob.com/api/data/leagueseasondeepstats?id=77&season=24254&type=players&stat=rating&slug=world-cup-players', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} fetching deepstats`);
    }
    
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

    const srcPath = path.join(__dirname, '../src/data/fotmobPlayerRatings.json');
    const publicPath = path.join(__dirname, '../public/fotmobPlayerRatings.json');
    const distPath = path.join(__dirname, '../dist/fotmobPlayerRatings.json');

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
