import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
const tempHtmlPath = path.join(__dirname, 'temp_fifa_scripts.html');

console.log('Fetching main page HTML...');
execSync(`google-chrome --headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "${url}" > "${tempHtmlPath}"`, { stdio: 'ignore' });

if (fs.existsSync(tempHtmlPath)) {
  const html = fs.readFileSync(tempHtmlPath, 'utf8');
  fs.unlinkSync(tempHtmlPath);
  const $ = cheerio.load(html);
  
  console.log('--- Searching for Next.js / state scripts ---');
  
  // 1. Check __NEXT_DATA__
  const nextData = $('#__NEXT_DATA__');
  if (nextData.length > 0) {
    console.log(`Found #__NEXT_DATA__, size: ${nextData.html().length} characters`);
    fs.writeFileSync(path.join(__dirname, 'next_data.json'), nextData.html());
  } else {
    console.log('#__NEXT_DATA__ not found.');
  }

  // 2. Check other scripts containing window.__ or REDUX_STATE or similar
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const content = $(el).html() || '';
    if (content.includes('__NEXT_DATA__') || content.includes('window.__') || content.includes('bootstrap') || content.includes('apollo') || content.includes('hydration')) {
      console.log(`Found script matching keywords, size: ${content.length} characters`);
    }
    if (content.includes('400021507')) {
      console.log(`Found script containing match ID 400021507, size: ${content.length} characters`);
      fs.writeFileSync(path.join(__dirname, `match_script_${i}.txt`), content);
    }
  });
} else {
  console.log('Failed to fetch main page.');
}
