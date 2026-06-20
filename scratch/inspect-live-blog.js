import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
        console.log(`LiveBlogPosting updates count: ${json.liveBlogUpdate.length}`);
        
        // Print all updates
        json.liveBlogUpdate.forEach((update, idx) => {
          console.log(`[${idx}] Headline: "${update.headline}", Published: ${update.datePublished}`);
          console.log(`    Body: "${update.articleBody}"`);
          console.log('---');
        });
      }
    } catch (e) {
      // ignore
    }
  });
}

main();
