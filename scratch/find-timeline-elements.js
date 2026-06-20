import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('*').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('MODIBA') || text.includes('Modiba') || text.includes('APPOLLIS') || text.includes('Appollis')) {
      const childHasText = $(el).children().toArray().some(child => {
        const ct = $(child).text();
        return ct.includes('MODIBA') || ct.includes('Modiba') || ct.includes('APPOLLIS') || ct.includes('Appollis');
      });
      if (!childHasText) {
        console.log(`Modiba/Appollis element: Tag: ${el.tagName}, Class: ${$(el).attr('class')}`);
        console.log(`  HTML:`, $(el).prop('outerHTML').substring(0, 500));
        console.log('  Parent HTML:', $(el).parent().prop('outerHTML').substring(0, 500));
        console.log('---');
      }
    }
  });
}

main();
