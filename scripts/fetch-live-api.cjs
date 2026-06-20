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
