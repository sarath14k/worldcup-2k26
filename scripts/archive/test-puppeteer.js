import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: 'new', // or true
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Argentina vs Algeria match page...');
    await page.goto('https://www.fifa.com/en/match-centre/match/17/285023/289273/400021496', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Waiting 5 seconds for page content and scripts to execute...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Finding and clicking STATS tab...');
    await page.evaluate(async () => {
      // Find element containing "STATS" text
      const divs = Array.from(document.querySelectorAll('div'));
      const statsTab = divs.find(d => d.textContent.trim() === 'STATS');
      if (statsTab) {
        statsTab.click();
      } else {
        console.error('STATS tab not found');
      }
    });

    console.log('Waiting 3 seconds for stats to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Extracting page content (scorers & stats)...');
    const result = await page.evaluate(() => {
      // 1. Extract goal scorers
      const homeScorers = [];
      const awayScorers = [];

      // Find the Home scorers container
      const homeContainer = document.querySelector('[class*="match-details-header-events-component_home__"]');
      if (homeContainer) {
        const events = homeContainer.querySelectorAll('[class*="match-details-header-events-component_event__"]');
        events.forEach(ev => {
          const nameEl = ev.querySelector('[class*="match-details-header-events-component_playerNameLeft__"]');
          const timeEl = ev.querySelector('[class*="match-details-header-events-component_timeBox__"]');
          const ogEl = ev.querySelector('[class*="match-details-header-events-component_ownGoal__"]');
          if (nameEl) {
            const player = nameEl.textContent.trim();
            let minute = timeEl ? timeEl.textContent.trim() : '';
            minute = minute.replace(player, '').trim();
            homeScorers.push({
              player,
              minute,
              isOwnGoalOrPenalty: ogEl ? ogEl.textContent.trim() : ''
            });
          }
        });
      }

      // Find the Away scorers container
      const awayContainer = document.querySelector('[class*="match-details-header-events-component_away__"]');
      if (awayContainer) {
        const events = awayContainer.querySelectorAll('[class*="match-details-header-events-component_event__"]');
        events.forEach(ev => {
          const nameEl = ev.querySelector('[class*="match-details-header-events-component_playerNameRight__"]');
          const timeEl = ev.querySelector('[class*="match-details-header-events-component_timeBox__"]');
          const ogEl = ev.querySelector('[class*="match-details-header-events-component_ownGoal__"]');
          if (nameEl) {
            const player = nameEl.textContent.trim();
            let minute = timeEl ? timeEl.textContent.trim() : '';
            minute = minute.replace(player, '').trim();
            awayScorers.push({
              player,
              minute,
              isOwnGoalOrPenalty: ogEl ? ogEl.textContent.trim() : ''
            });
          }
        });
      }

      // 2. Extract match stats
      const stats = {};
      
      // Let's find possession values
      const possessionHomeEl = document.querySelector('[class*="single-stat-possession-component_Left__"]');
      const possessionAwayEl = document.querySelector('[class*="single-stat-possession-component_Right__"]');
      if (possessionHomeEl && possessionAwayEl) {
        stats.possession = [
          parseInt(possessionHomeEl.textContent.trim()) || 50,
          parseInt(possessionAwayEl.textContent.trim()) || 50
        ];
      } else {
        stats.possession = [50, 50];
      }

      // Let's find other stats by looking at the title and values
      const statItems = document.querySelectorAll('[class*="match-stats-tab-component_statsGroupInner__"] > div');
      const debugRows = [];
      statItems.forEach(item => {
        const titleEl = item.querySelector('[class*="match-stats-tab-component_statTitle__"]');
        const leftEl = item.querySelector('[class*="single-stat-component_Left__"]');
        const rightEl = item.querySelector('[class*="single-stat-component_Right__"]');
        
        if (titleEl && leftEl && rightEl) {
          const title = titleEl.textContent.trim();
          const leftVal = parseInt(leftEl.textContent.trim()) || 0;
          const rightVal = parseInt(rightEl.textContent.trim()) || 0;
          debugRows.push({ title, leftVal, rightVal });
          
          const lowerTitle = title.toLowerCase().trim();
          if (lowerTitle === 'total' && item.closest('[class*="match-stats-tab-component_statsGroup__"]')?.innerHTML.toLowerCase().includes('attempts')) {
            stats.shots = [leftVal, rightVal];
          } else if (lowerTitle === 'on target') {
            stats.shotsOnTarget = [leftVal, rightVal];
          } else if (lowerTitle === 'corners') {
            stats.corners = [leftVal, rightVal];
          } else if (lowerTitle === 'fouls against') {
            stats.fouls = [leftVal, rightVal];
          } else if (lowerTitle === 'yellow cards') {
            stats.yellowCards = [leftVal, rightVal];
          } else if (lowerTitle === 'red cards') {
            stats.redCards = [leftVal, rightVal];
          }
        }
      });

      return {
        title: document.title,
        homeScorers,
        awayScorers,
        stats,
        debugRows
      };
    });

    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
}

run();
