const path = require('path');

console.log('====================================================');
console.log('   FIFA Official Scores Scraper Daemon Started      ');
console.log('   Updating public/live-matches.json from FIFA website');
console.log('====================================================');

let isRunning = false;

// Dynamic import of the ES module scraper
import('./fifaScraper.js').then(({ scrapeFifa }) => {
  function runScrape() {
    if (isRunning) {
      console.log('Scraper is already running. Skipping this interval.');
      return;
    }
    isRunning = true;
    scrapeFifa()
      .then(async (result) => {
        if (result && result.success) {
          const SYNC_URL = process.env.SYNC_URL || 'https://worldcup-2k26.onrender.com/api/sync-matches';
          const SYNC_TOKEN = process.env.SYNC_TOKEN || 'default_secret_sync_token_2k26';
          
          try {
            const fs = require('fs');
            const filePath = path.join(__dirname, '../public/live-matches.json');
            if (fs.existsSync(filePath)) {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              console.log(`[Daemon] Syncing ${result.count} matches to remote ${SYNC_URL}...`);
              const response = await fetch(SYNC_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Sync-Token': SYNC_TOKEN
                },
                body: JSON.stringify(data)
              });
              const resJson = await response.json();
              if (response.ok) {
                console.log('[Daemon] Remote sync successful!', resJson);
              } else {
                console.error('[Daemon] Remote sync failed:', response.status, resJson);
              }
            }
          } catch (syncErr) {
            console.error('[Daemon] Remote sync network error:', syncErr.message);
          }
        }
      })
      .catch(err => {
        console.error('Scrape failed:', err);
      })
      .finally(() => {
        isRunning = false;
      });
  }

  // Scrape once immediately on startup
  runScrape();
  
  // Scrape every 60 seconds to keep live-matches.json fresh
  setInterval(runScrape, 60000);
}).catch(err => {
  console.error('Failed to import fifaScraper:', err);
});
