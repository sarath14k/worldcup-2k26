import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('/home/sarath/.gemini/antigravity/scratch/dom_budget.html', 'utf8');
const $ = cheerio.load(html);

// Find elements that look like date headers
console.log('--- DATE HEADERS ---');
$('[class*="matches-container_title"], [class*="matches-container_header"], [class*="dateText"], [class*="date-header"]').each((i, el) => {
  console.log(`Class: ${$(el).attr('class')}, Text: ${$(el).text().trim()}`);
});

// Let's also find all headers of type h2, h3, h4
console.log('\n--- H2, H3, H4 HEADERS ---');
$('h2, h3, h4').each((i, el) => {
  console.log(`Tag: ${el.tagName}, Class: ${$(el).attr('class') || ''}, Text: ${$(el).text().trim()}`);
});
