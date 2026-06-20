import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  // Find elements that contain Montes
  $('*').each((i, el) => {
    const text = $(el).text().trim();
    const htmlText = $(el).html() || '';
    
    // We want the most specific elements that contain 'Montes' (i.e. elements with no children that contain 'Montes')
    if (text.includes('Montes') || text.includes('MONTES')) {
      const childHasMontes = $(el).children().toArray().some(child => $(child).text().includes('Montes') || $(child).text().includes('MONTES'));
      if (!childHasMontes) {
        console.log(`Montes element: Tag: ${el.tagName}, Class: ${$(el).attr('class')}`);
        console.log(`  HTML:`, $(el).prop('outerHTML').substring(0, 500));
        console.log('  Parent HTML:', $(el).parent().prop('outerHTML').substring(0, 500));
        console.log('---');
      }
    }
  });
}

main();
