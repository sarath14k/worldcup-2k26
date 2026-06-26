import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { FOTMOB_TEAM_MAP } from './fotmobTeamMap.js';
import { fetchWithRetry } from './fetchWithRetry.js';

// Helper to fetch html page and parse __NEXT_DATA__
async function fetchNextData(url) {
  const response = await fetchWithRetry(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`Could not find __NEXT_DATA__ in HTML of ${url}`);
  }
  return JSON.parse(match[1]);
}

// Scrape live match ratings
export async function scrapeLiveRatings() {
  console.log('[Live Ratings Sync] Fetching World Cup overview page...');
  const liveRatingsData = {};
  
  try {
    const nextData = await fetchNextData('https://www.fotmob.com/leagues/77/overview/world-cup');
    const pageProps = nextData.props?.pageProps || {};
    const fixtures = pageProps.fixtures || {};
    const allMatches = fixtures.allMatches || [];
    
    console.log(`[Live Ratings Sync] Found ${allMatches.length} tournament matches.`);
    
    // Filter matches that are started (either active or finished)
    const startedMatches = allMatches.filter(m => m.status?.started === true);
    console.log(`[Live Ratings Sync] ${startedMatches.length} matches have started/finished.`);
    
    // Process each match
    for (const match of startedMatches) {
      const homeCode = FOTMOB_TEAM_MAP[match.home?.id];
      const awayCode = FOTMOB_TEAM_MAP[match.away?.id];
      
      if (!homeCode || !awayCode) {
        // Skip matches involving non-tournament teams
        continue;
      }
      
      const matchKey = `${homeCode}-${awayCode}`;
      console.log(`[Live Ratings Sync] Fetching ratings for match ${matchKey} (${match.id})...`);
      
      try {
        const matchUrl = `https://www.fotmob.com${match.pageUrl}`;
        const matchNextData = await fetchNextData(matchUrl);
        const matchProps = matchNextData.props?.pageProps || {};
        const lineup = matchProps.content?.lineup || {};
        
        const homeTeam = lineup.homeTeam || {};
        const awayTeam = lineup.awayTeam || {};
        
        const ratings = {
          [homeCode]: {},
          [awayCode]: {}
        };
        
        // Helper to extract ratings from a list of players
        const processPlayers = (playersList, targetMap) => {
          if (!playersList) return;
          playersList.forEach(p => {
            if (p.name && p.performance?.rating) {
              targetMap[p.name] = p.performance.rating;
            }
          });
        };
        
        // Process starters and subs for both teams
        processPlayers(homeTeam.starters, ratings[homeCode]);
        processPlayers(homeTeam.subs, ratings[homeCode]);
        processPlayers(awayTeam.starters, ratings[awayCode]);
        processPlayers(awayTeam.subs, ratings[awayCode]);
        
        // Only save if we actually collected player ratings
        const homeCount = Object.keys(ratings[homeCode]).length;
        const awayCount = Object.keys(ratings[awayCode]).length;
        
        if (homeCount > 0 || awayCount > 0) {
          liveRatingsData[matchKey] = ratings;
          console.log(`[Live Ratings Sync] Saved ${homeCount} home and ${awayCount} away ratings for ${matchKey}`);
        } else {
          console.log(`[Live Ratings Sync] No player ratings available yet for ${matchKey}`);
        }
        
      } catch (matchErr) {
        console.error(`[Live Ratings Sync] Failed to process match ${matchKey}:`, matchErr.message);
      }
      
      // Small sleep to avoid aggressive crawling rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save to files
    const srcPath = path.join(__dirname, '../../src/data/livePlayerRatings.json');
    const publicPath = path.join(__dirname, '../../public/live-player-ratings.json');
    const distPath = path.join(__dirname, '../../dist/live-player-ratings.json');
    
    const outputString = JSON.stringify(liveRatingsData, null, 2);
    
    fs.writeFileSync(srcPath, outputString, 'utf8');
    fs.writeFileSync(publicPath, outputString, 'utf8');
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, outputString, 'utf8');
    }
    
    console.log('[Live Ratings Sync] Successfully saved live player ratings to files.');
    return { success: true, count: Object.keys(liveRatingsData).length };
    
  } catch (err) {
    console.error('[Live Ratings Sync] Critical error:', err.message);
    return { success: false, error: err.message };
  }
}

// Support direct command-line execution for testing
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeLiveRatings().then(res => {
    console.log('[Live Ratings Sync] Completed direct execution:', res);
  }).catch(err => {
    console.error('[Live Ratings Sync] Failed direct execution:', err);
  });
}
