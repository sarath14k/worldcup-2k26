import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
        // Print keys of the first update
        const first = json.liveBlogUpdate[0];
        console.log('Update keys:', Object.keys(first));
        console.log('Sample update:', JSON.stringify(first, null, 2));
      }
    } catch (e) {
      // ignore
    }
  });
}

main();
