import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Let's test with Match 400021466 (Ecuador vs Germany) or any other.
// Let's pick a match link from the scraper output
const matchUrl = 'https://www.fifa.com/en/match-centre/match/17/285023/289273/400021507';
const tempPath = '/home/sarath/.gemini/antigravity/brain/a1cc961f-d7a6-4aac-b25d-5d9b477ecdd3/scratch/temp_match_detail.html';

console.log(`Fetching match detail page: ${matchUrl}`);
execSync(`google-chrome --headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "${matchUrl}" > "${tempPath}"`, { stdio: 'ignore' });

if (fs.existsSync(tempPath)) {
  const html = fs.readFileSync(tempPath, 'utf8');
  
  const $ = cheerio.load(html);
  
  console.log('--- HTML DUMP SEARCH ---');
  
  // Try to find the scorer class
  const leftScorersContainer = $('[class*="match-details-new-header-section_GoalScorersLeft__"]');
  const rightScorersContainer = $('[class*="match-details-new-header-section_GoalScorersRight__"]');
  
  console.log('Left Scorer HTML:', leftScorersContainer.html());
  console.log('Right Scorer HTML:', rightScorersContainer.html());
  console.log('Left Scorer Text:', leftScorersContainer.text().trim());
  console.log('Right Scorer Text:', rightScorersContainer.text().trim());
  
  const events = [];
  const parseScorers = (container, team) => {
    container.find('*').each((idx, el) => {
      const txt = $(el).text().trim();
      if (!txt) return;
      const minMatch = txt.match(/(\d+)'/);
      if (minMatch) {
        const minute = parseInt(minMatch[1]);
        const player = txt.replace(minMatch[0], '').replace(/[⚽⚽️]/g, '').replace(/\s+/g, ' ').trim();
        const isDup = events.some(e => e.player === player && e.minute === minute && e.team === team);
        if (!isDup && player.length > 2) {
          events.push({ player, minute, team, type: 'goal' });
        }
      }
    });
    
    // Flat text fallback
    if (events.filter(e => e.team === team).length === 0) {
      const text = container.text().trim();
      if (text) {
        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          const trimmed = line.trim();
          const minMatch = trimmed.match(/(\d+)'/);
          if (minMatch) {
            const minute = parseInt(minMatch[1]);
            const player = trimmed.replace(minMatch[0], '').replace(/[⚽⚽️]/g, '').replace(/\s+/g, ' ').trim();
            const isDup = events.some(e => e.player === player && e.minute === minute && e.team === team);
            if (!isDup && player.length > 2) {
              events.push({ player, minute, team, type: 'goal' });
            }
          }
        });
      }
    }
  };
  
  parseScorers(leftScorersContainer, 'home');
  parseScorers(rightScorersContainer, 'away');
  
  console.log('Parsed Events:', events);
  
  // Stats
  const stats = {
    possession: [50, 50],
    shots: [10, 10],
    shotsOnTarget: [5, 5],
    corners: [5, 5],
    fouls: [10, 10],
    yellowCards: [0, 0],
    redCards: [0, 0]
  };
  
  $('[class*="match-stats-tab-component_statRow__"], tr').each((idx, el) => {
    const row = $(el);
    const title = row.find('[class*="match-stats-tab-component_statTitle__"], td:nth-child(2)').text().trim().toLowerCase();
    
    if (title.includes('possession')) {
      const leftVal = parseInt(row.find('[class*="single-stat-possession-component_Left__"]').text().replace('%', '').trim()) || 50;
      const rightVal = parseInt(row.find('[class*="single-stat-possession-component_Right__"]').text().replace('%', '').trim()) || 50;
      stats.possession = [leftVal, rightVal];
    } else if (title.includes('attempts') || title.includes('total attempts') || title.includes('shots')) {
      const leftVal = parseInt(row.find('[class*="single-stat-component_Left__"], td:nth-child(1)').text().trim()) || 10;
      const rightVal = parseInt(row.find('[class*="single-stat-component_Right__"], td:nth-child(3)').text().trim()) || 10;
      if (title.includes('target')) {
        stats.shotsOnTarget = [leftVal, rightVal];
      } else {
        stats.shots = [leftVal, rightVal];
      }
    } else if (title.includes('corner')) {
      const leftVal = parseInt(row.find('[class*="single-stat-component_Left__"], td:nth-child(1)').text().trim()) || 5;
      const rightVal = parseInt(row.find('[class*="single-stat-component_Right__"], td:nth-child(3)').text().trim()) || 5;
      stats.corners = [leftVal, rightVal];
    } else if (title.includes('foul')) {
      const leftVal = parseInt(row.find('[class*="single-stat-component_Left__"], td:nth-child(1)').text().trim()) || 10;
      const rightVal = parseInt(row.find('[class*="single-stat-component_Right__"], td:nth-child(3)').text().trim()) || 10;
      stats.fouls = [leftVal, rightVal];
    } else if (title.includes('yellow')) {
      const leftVal = parseInt(row.find('[class*="single-stat-component_Left__"], td:nth-child(1)').text().trim()) || 0;
      const rightVal = parseInt(row.find('[class*="single-stat-component_Right__"], td:nth-child(3)').text().trim()) || 0;
      stats.yellowCards = [leftVal, rightVal];
    } else if (title.includes('red')) {
      const leftVal = parseInt(row.find('[class*="single-stat-component_Left__"], td:nth-child(1)').text().trim()) || 0;
      const rightVal = parseInt(row.find('[class*="single-stat-component_Right__"], td:nth-child(3)').text().trim()) || 0;
      stats.redCards = [leftVal, rightVal];
    }
  });
  
  console.log('Parsed Stats:', stats);
  
} else {
  console.log('Failed to fetch match details page.');
}
