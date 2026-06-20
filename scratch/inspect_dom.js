import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temp_dump.html', 'utf8');
const $ = cheerio.load(html);

const matches = $('a[href*="/en/match-centre/match/"]');
console.log(`Found ${matches.length} match elements.`);

if (matches.length > 0) {
  const firstMatch = matches.first();
  console.log('--- First Match Attributes ---');
  console.log(firstMatch.attr());
  console.log('--- First Match HTML ---');
  console.log(firstMatch.html()?.substring(0, 1500));
}
