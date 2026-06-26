import { scrapeFifa } from '../server/scrapers/fifa.js';

async function run() {
  console.log('Running test scrape...');
  const result = await scrapeFifa();
  console.log('Scrape result:', result);
}

run();
