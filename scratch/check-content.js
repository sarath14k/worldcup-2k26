import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  console.log('H1:', $('h1').text());
  console.log('H2:', $('h2').text());
  console.log('Body class list:', $('body').attr('class'));
  
  // Print some divs or text
  const visibleText = $('body').text().replace(/\s+/g, ' ').substring(0, 1000);
  console.log('Visible Text Snippet:', visibleText);
}

main();
