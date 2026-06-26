import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('/home/sarath/.gemini/antigravity/scratch/dom_budget.html', 'utf8');
const $ = cheerio.load(html);

const matches = [];
let currentDateText = '';

// Find all elements that are either date titles or match links
const elements = $('[class*="matches-container_title__"], a[href*="/en/match-centre/match/"]');

elements.each((i, el) => {
  const $el = $(el);
  const href = $el.attr('href') || '';
  
  if (href.includes('/en/match-centre/match/')) {
    // It's a match link!
    const matchIdMatch = href.match(/\/(\d+)$/);
    if (!matchIdMatch) return;
    const matchId = matchIdMatch[1];
    
    // Teams
    const teams = [];
    $el.find('[class*="match-row_team__"]').each((j, teamEl) => {
      // Abbr
      const abbr = $(teamEl).find('[class*="team-abbreviations_container__"] span').first().text().trim();
      // Full name
      const name = $(teamEl).find('span.d-none.d-md-block').first().text().trim();
      teams.push({ abbr, name });
    });
    
    // Scores & Status
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
    
    // Bottom label details (Group, Stage, Stadium, City)
    const bottomLabel = $el.find('[class*="match-row_bottomLabelWrapper__"]').first();
    const stage = bottomLabel.find('[class*="match-row_bottomLabel__"].justify-content-end').text().trim();
    const group = bottomLabel.find('[class*="match-row_bottomLabel__"]:not(.justify-content-end)').first().text().trim();
    const stadiumCity = bottomLabel.find('[class*="match-row_stadiumCityLabels__"]').text().trim();
    
    matches.push({
      matchId,
      href,
      dateText: currentDateText,
      stage,
      group,
      stadiumCity,
      homeTeam: teams[0] || null,
      awayTeam: teams[1] || null,
      status,
      homeScore,
      awayScore,
      kickoffTime
    });
  } else {
    // It's a date header!
    currentDateText = $el.text().trim();
  }
});

console.log('Total matches parsed:', matches.length);
if (matches.length > 0) {
  console.log('Sample parsed match 1 (Mexico):', matches.find(m => m.homeTeam?.name === 'Mexico'));
  console.log('Sample parsed match 10 (Netherlands):', matches.find(m => m.homeTeam?.name === 'Netherlands'));
  console.log('Sample parsed match 15 (Scheduled):', matches.find(m => m.status === 'SCHEDULED'));
}
