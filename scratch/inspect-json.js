import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('script').each((i, el) => {
    const type = $(el).attr('type') || '';
    const text = $(el).text();
    
    if (type.includes('json') || text.includes('SportsEvent') || text.includes('LiveBlogPosting') || text.includes('Montes')) {
      console.log(`Script index: ${i}, Type: ${type}, Length: ${text.length}`);
      if (text.length > 0) {
        try {
          const json = JSON.parse(text);
          console.log('  JSON Type/Context:', json['@type'] || json['@context']);
          if (JSON.stringify(json).includes('Montes')) {
            console.log('  FOUND MONTES IN JSON-LD!');
          }
        } catch (e) {
          // Check if it has Montes in raw text
          if (text.includes('Montes') || text.includes('MONTES')) {
            console.log('  FOUND MONTES IN RAW SCRIPT TEXT!');
            console.log(text.substring(0, 500));
          }
        }
      }
    }
  });
}

main();
