import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  const homeContainer = $('[class*="match-details-header-events-component_home__"]');
  const awayContainer = $('[class*="match-details-header-events-component_away__"]');
  
  console.log('HOME EVENTS HTML:');
  homeContainer.find('[class*="match-details-header-events-component_event__"]').each((i, el) => {
    console.log(`[Event ${i}]:`);
    console.log($(el).html());
    console.log('---');
  });
  
  console.log('\nAWAY EVENTS HTML:');
  awayContainer.find('[class*="match-details-header-events-component_event__"]').each((i, el) => {
    console.log(`[Event ${i}]:`);
    console.log($(el).html());
    console.log('---');
  });
}

main();
