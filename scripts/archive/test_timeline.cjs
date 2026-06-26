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

  // Let's scroll down to trigger timeline loading
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight / 3);
    await new Promise(r => setTimeout(r, 2000));
    window.scrollTo(0, document.body.scrollHeight / 2);
    await new Promise(r => setTimeout(r, 2000));
  });

  // Dump information about timeline cards
  const cards = await page.evaluate(() => {
    // Find all card elements or text on the page
    const results = [];
    const elements = Array.from(document.querySelectorAll('*'));
    
    // We search for elements containing text like 'commits a foul' or 'attempts an effort'
    const matchElements = elements.filter(el => {
      const text = el.textContent || '';
      return el.children.length === 0 && (
        text.includes('commits a foul') ||
        text.includes('attempts an effort') ||
        text.includes('takes a corner kick') ||
        text.includes('ruled offside') ||
        text.includes('Kick Off')
      );
    });

    matchElements.forEach(el => {
      // Find parent cards to see classes
      let parent = el.parentElement;
      const path = [];
      while (parent && parent !== document.body) {
        path.push({
          tag: parent.tagName,
          className: parent.className
        });
        parent = parent.parentElement;
      }
      results.push({
        text: el.textContent.trim(),
        path: path.slice(0, 4) // Show immediate parents
      });
    });

    return {
      totalMatches: matchElements.length,
      results
    };
  });

  console.log('Timeline info:', JSON.stringify(cards, null, 2));

  // Let's also do a general query for all texts on the page that look like timeline events
  const generalTexts = await page.evaluate(() => {
    const list = [];
    // Timeline events usually have specific class prefixes or structures
    // Let's look for elements that look like:
    // 1. Time (e.g. 2', 1', 0')
    // 2. Event title (e.g. Foul, Attempt at Goal, Corner, Offside, Kick Off)
    // 3. Event description
    const divs = Array.from(document.querySelectorAll('div'));
    divs.forEach(div => {
      // Check if it has classes like "live-blog" or "timeline"
      const className = div.className || '';
      if (className.includes('timeline') || className.includes('event') || className.includes('card')) {
        list.push({ className, text: div.textContent.trim().substring(0, 100) });
      }
    });
    return list.slice(0, 30);
  });
  console.log('General classes:', JSON.stringify(generalTexts, null, 2));

  await browser.close();
})();
