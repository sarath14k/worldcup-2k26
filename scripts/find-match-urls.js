import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
const tempHtmlPath = path.join(__dirname, 'temp_fifa_links.html');

console.log('Fetching main page...');
execSync(`google-chrome --headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "${url}" > "${tempHtmlPath}"`, { stdio: 'ignore' });

if (fs.existsSync(tempHtmlPath)) {
  const html = fs.readFileSync(tempHtmlPath, 'utf8');
  fs.unlinkSync(tempHtmlPath);
  const $ = cheerio.load(html);
  
  console.log('Found match links:');
  $('a[href*="/en/match-centre/match/"]').each((i, el) => {
    console.log(`- Text: ${$(el).text().trim().replace(/\s+/g, ' ')}`);
    console.log(`  Href: ${$(el).attr('href')}`);
  });
} else {
  console.log('Failed to fetch page.');
}
