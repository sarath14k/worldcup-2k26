import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
const tempHtmlPath = path.join(__dirname, 'temp_fifa_completed.html');

console.log('Fetching main page...');
execSync(`google-chrome --headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "${url}" > "${tempHtmlPath}"`, { stdio: 'ignore' });

if (fs.existsSync(tempHtmlPath)) {
  const html = fs.readFileSync(tempHtmlPath, 'utf8');
  fs.unlinkSync(tempHtmlPath);
  const $ = cheerio.load(html);
  
  console.log('Completed / Live matches:');
  $('a[href*="/en/match-centre/match/"]').each((i, el) => {
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, ' ').trim();
    const href = $el.attr('href');
    
    // Let's see if there is score or status FT
    const statusContainer = $el.find('[class*="match-row_matchRowStatus__"]').first();
    const statusText = statusContainer.find('[class*="match-row_status__"]').text().trim();
    const scores = [];
    statusContainer.find('[class*="match-row_score__"]').each((j, scoreEl) => {
      scores.push($(scoreEl).text().trim());
    });
    
    if (statusText === 'FT' || scores.length > 0) {
      console.log(`- Match: ${text}`);
      console.log(`  Status: ${statusText}, Scores: ${scores.join('-')}`);
      console.log(`  Href: ${href}`);
    }
  });
} else {
  console.log('Failed to fetch page.');
}
