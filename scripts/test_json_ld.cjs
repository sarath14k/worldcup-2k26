const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  const executablePath = chromePaths.find(p => fs.existsSync(p)) || 'google-chrome';

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const url = 'https://www.fifa.com/en/match-centre/match/17/285023/289273/400021446';
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6000));

  const parsedEvents = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
          // Find Start Time to calculate event minutes
          const startEvent = json.liveBlogUpdate.find(e => e.headline === 'Start Time' || e.headline === 'Kick Off');
          const startTimeMs = startEvent ? new Date(startEvent.datePublished).getTime() : new Date(json.coverageStartTime).getTime();

          const events = json.liveBlogUpdate.map(update => {
            const timeMs = new Date(update.datePublished).getTime();
            let minDiff = Math.floor((timeMs - startTimeMs) / 60000);
            if (minDiff < 0) minDiff = 0;
            
            // Format minute string
            let minuteStr = `${minDiff}'`;
            if (update.headline === 'Start Time' || update.headline === 'Coin Toss' || update.headline === 'Kick Off') {
              minuteStr = '0\'';
            }

            return {
              type: update.headline,
              text: update.articleBody || '',
              minute: minDiff,
              minuteStr,
              timestamp: update.datePublished
            };
          });

          // Sort descending (latest events first) or ascending
          return events;
        }
      } catch (e) {
        // Ignore JSON parse error
      }
    }
    return null;
  });

  console.log('Extracted timeline events:', JSON.stringify(parsedEvents, null, 2));
  await browser.close();
})();
