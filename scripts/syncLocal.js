import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeFifa } from './fifaScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../public/live-matches.json');

// Read config from env or defaults
const SYNC_URL = process.env.SYNC_URL || 'https://worldcup-2k26.onrender.com/api/sync-matches';
const SYNC_TOKEN = process.env.SYNC_TOKEN;

async function runSync() {
  if (!SYNC_TOKEN) {
    console.error('Error: SYNC_TOKEN environment variable is not defined.');
    console.error('Please run with: SYNC_TOKEN=your_token node scripts/syncLocal.js');
    process.exit(1);
  }

  console.log('1. Starting local scrape...');
  const scrapeResult = await scrapeFifa();
  
  if (!scrapeResult.success) {
    console.error('Scrape failed locally:', scrapeResult.error);
    process.exit(1);
  }

  console.log(`Scrape succeeded! Found ${scrapeResult.count} matches.`);
  
  if (!fs.existsSync(filePath)) {
    console.error('Error: public/live-matches.json was not generated.');
    process.exit(1);
  }

  console.log(`2. Reading scraped data from ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`3. Pushing data to remote URL: ${SYNC_URL}...`);
  try {
    const response = await fetch(SYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Token': SYNC_TOKEN
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
      console.log('🎉 Sync successful! Response:', result);
    } else {
      console.error('❌ Sync failed with status:', response.status, result);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Network error during sync:', err.message);
    process.exit(1);
  }
}

runSync().catch(console.error);
