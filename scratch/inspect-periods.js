import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
        json.liveBlogUpdate.forEach((update, idx) => {
          const headline = update.headline.toLowerCase();
          if (headline.includes('start') || headline.includes('end') || headline.includes('half') || headline.includes('whistle') || headline.includes('kick off') || headline.includes('period')) {
            console.log(`[${idx}] Headline: "${update.headline}", Time: ${update.datePublished}`);
          }
        });
      }
    } catch (e) {
      // ignore
    }
  });
}

main();
