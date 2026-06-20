import { scrapeFifa } from './fifaScraper.js';

async function run() {
  console.log('Running test scrape...');
  const result = await scrapeFifa();
  console.log('Scrape result:', result);
}

run();
