import puppeteer from 'puppeteer-core';
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
  console.log('[Ratings Sync] Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('[Ratings Sync] Navigating to FotMob player ratings page...');
    await page.goto('https://www.fotmob.com/leagues/77/stats/season/24254/players/rating/world-cup-players', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('[Ratings Sync] Waiting for player rows selector...');
    await page.waitForSelector('[class*="LeagueSeasonStatsTableRowCSS"]', { timeout: 20000 });

    console.log('[Ratings Sync] Waiting 3 seconds for data to load completely...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('[Ratings Sync] Extracting player rows...');
    const rawPlayers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[class*="LeagueSeasonStatsTableRowCSS"]'));
      return rows.map(row => {
        const rankEl = row.querySelector('[class*="Rank"]');
        const nameEl = row.querySelector('[class*="TeamOrPlayerName"]');
        const playerImg = row.querySelector('img[class*="PlayerImage"]');
        const teamImg = row.querySelector('img[class*="TeamIcon"]');
        const ratingEl = row.querySelector('[class*="StatValue"]');
        
        const rank = rankEl ? rankEl.textContent.trim() : '';
        const name = nameEl ? nameEl.textContent.trim() : '';
        const playerImgSrc = playerImg ? playerImg.getAttribute('src') : '';
        const teamImgSrc = teamImg ? teamImg.getAttribute('src') : '';
        const rating = ratingEl ? ratingEl.textContent.trim() : '';
        
        const playerIdMatch = playerImgSrc.match(/playerimages\/(\d+)\.png/);
        const teamIdMatch = teamImgSrc.match(/teamlogo\/(\d+)/);
        
        return {
          rank: rank ? parseInt(rank, 10) : null,
          name,
          playerId: playerIdMatch ? playerIdMatch[1] : null,
          teamId: teamIdMatch ? teamIdMatch[1] : null,
          rating: rating ? parseFloat(rating) : null,
          playerImgSrc,
          teamImgSrc
        };
      });
    });

    console.log(`[Ratings Sync] Scraped ${rawPlayers.length} player records from DOM.`);
    
    // Map and filter players
    const cleanedRatings = [];
    rawPlayers.forEach(p => {
      if (!p.name || !p.rating || !p.teamId) return;
      
      const teamAbbr = FOTMOB_TEAM_MAP[p.teamId];
      if (!teamAbbr) {
        // Skip players from non-tournament teams
        return;
      }
      
      cleanedRatings.push({
        rank: p.rank,
        name: p.name,
        team: teamAbbr,
        rating: p.rating,
        playerId: p.playerId
      });
    });

    console.log(`[Ratings Sync] Cleaned and mapped ${cleanedRatings.length} tournament players.`);

    // Define target paths
    const srcPath = path.join(__dirname, '../src/data/fotmobPlayerRatings.json');
    const publicPath = path.join(__dirname, '../public/fotmobPlayerRatings.json');
    const distPath = path.join(__dirname, '../dist/fotmobPlayerRatings.json');

    const outputString = JSON.stringify(cleanedRatings, null, 2);

    // Save to all target paths
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
  } finally {
    await browser.close();
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
