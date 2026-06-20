import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temp_dump.html', 'utf8');
const $ = cheerio.load(html);

const firstMatch = $('a[href*="/en/match-centre/match/"]').first();
console.log('--- Entire HTML of Completed Match Row ---');
console.log(firstMatch.html());

console.log('--- All text elements and their class names ---');
firstMatch.find('*').each((i, el) => {
  const text = $(el).text().trim();
  const className = $(el).attr('class') || '';
  if (text) {
    console.log(`Class: ${className.substring(0, 50)} | Text: "${text}"`);
  }
});
