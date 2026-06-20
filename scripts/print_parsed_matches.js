import fs from 'fs';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';

async function run() {
  console.log('Scraping FIFA World Cup 2026 website...');
  const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
  
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  const executablePath = chromePaths.find(p => fs.existsSync(p)) || 'google-chrome';
  
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const html = await page.content();
  const $ = cheerio.load(html);
  const parsedMatches = [];
  let currentDateText = '';
  
  const elements = $('[class*="matches-container_title__"], a[href*="/en/match-centre/match/"]');

  elements.each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    
    if (href.includes('/en/match-centre/match/')) {
      const matchIdMatch = href.match(/\/(\d+)$/);
      if (!matchIdMatch) return;
      const matchId = matchIdMatch[1];
      
      const teams = [];
      $el.find('[class*="match-row_team__"]').each((j, teamEl) => {
        const abbr = $(teamEl).find('[class*="team-abbreviations_container__"] span').first().text().trim();
        const name = $(teamEl).find('span.d-none.d-md-block').first().text().trim();
        teams.push({ abbr, name });
      });
      
      const statusContainer = $el.find('[class*="match-row_matchRowStatus__"]').first();
      let status = '';
      let homeScore = null;
      let awayScore = null;
      let kickoffTime = null;
      
      const ftStatus = statusContainer.find('[class*="match-row_status__"]');
      if (ftStatus.text().trim() === 'FT') {
        status = 'FT';
        const scores = [];
        statusContainer.find('[class*="match-row_score__"]').each((j, scoreEl) => {
          scores.push(parseInt($(scoreEl).text().trim()));
        });
        homeScore = scores[0] ?? null;
        awayScore = scores[1] ?? null;
      } else {
        status = 'SCHEDULED';
        const timeEl = statusContainer.find('[class*="match-row_matchTime__"]');
        if (timeEl.length > 0) {
          kickoffTime = timeEl.text().trim();
        }
      }
      
      const bottomLabel = $el.find('[class*="match-row_bottomLabelWrapper__"]').first();
      const stage = bottomLabel.find('[class*="match-row_bottomLabel__"].justify-content-end').text().trim();
      const group = bottomLabel.find('[class*="match-row_bottomLabel__"]:not(.justify-content-end)').first().text().trim();
      
      parsedMatches.push({
        matchId,
        homeTeam: teams[0] || null,
        awayTeam: teams[1] || null,
        status,
        homeScore,
        awayScore,
        kickoffTime,
        stage,
        group,
        dateText: currentDateText
      });
    } else {
      currentDateText = $el.text().trim();
    }
  });

  console.log("Total parsed matches:", parsedMatches.length);
  console.log("First 15 matches parsed:");
  console.log(JSON.stringify(parsedMatches.slice(0, 15), null, 2));

  await browser.close();
}

run().catch(console.error);
