import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temp_dump.html', 'utf8');
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

const scheduled = parsedMatches.filter(m => m.status === 'SCHEDULED');
console.log(`Parsed ${scheduled.length} scheduled matches out of ${parsedMatches.length} total matches.`);
console.log('Sample scheduled matches:');
scheduled.slice(0, 20).forEach(m => {
  console.log(`ID: ${m.matchId} | ${m.homeTeam?.abbr} vs ${m.awayTeam?.abbr} | Date: ${m.dateText} | Kickoff: ${m.kickoffTime} | Group: ${m.group}`);
});
