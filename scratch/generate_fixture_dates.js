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

// Known times for the first 24 completed matches in IST
const completedTimes = {
  "MEX-RSA": "06:30 AM",
  "KOR-CZE": "06:30 AM",
  "CAN-BIH": "03:30 AM",
  "USA-PAR": "06:30 AM",
  "QAT-SUI": "00:30 AM",
  "BRA-MAR": "03:30 AM",
  "HAI-SCO": "06:30 AM",
  "AUS-TUR": "09:30 AM",
  "GER-CUW": "09:30 PM",
  "NED-JPN": "00:30 AM",
  "CIV-ECU": "03:30 AM",
  "SWE-TUN": "06:30 AM",
  "ESP-CPV": "09:30 PM",
  "BEL-EGY": "00:30 AM",
  "KSA-URU": "03:30 AM",
  "ALG-JOR": "06:30 AM",
  "AUT-IRQ": "09:30 AM",
  "ARG-FRA": "09:30 PM",
  "ENG-UZB": "00:30 AM",
  "SEN-NOR": "03:30 AM",
  "DEN-PAN": "06:30 AM",
  "JPN-SWE": "09:30 AM",
  "GHA-UGA": "09:30 PM",
  "ITA-HON": "00:30 AM"
};

const dateMap = {};

parsedMatches.forEach(m => {
  if (!m.homeTeam?.abbr || !m.awayTeam?.abbr) return;
  const key1 = `${m.homeTeam.abbr}-${m.awayTeam.abbr}`;
  const key2 = `${m.awayTeam.abbr}-${m.homeTeam.abbr}`;
  
  // Format Date text
  // e.g. "Thursday 18 June 2026" -> "June 18"
  const dateParts = m.dateText.split(' ');
  const day = dateParts[1];
  const month = dateParts[2];
  
  let timeStr = "";
  if (m.status === 'FT') {
    timeStr = completedTimes[key1] || completedTimes[key2] || "05:30 AM";
  } else if (m.kickoffTime) {
    // Convert e.g. "21:30" to "09:30 PM"
    const [hourStr, minStr] = m.kickoffTime.split(':');
    let hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    timeStr = `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
  } else {
    timeStr = "05:30 AM";
  }
  
  const finalDateStr = `${month} ${day}, ${timeStr} IST`;
  dateMap[key1] = finalDateStr;
  dateMap[key2] = finalDateStr;
});

fs.writeFileSync('src/data/realMatchDates.json', JSON.stringify(dateMap, null, 2), 'utf8');
console.log('Saved realMatchDates.json. Total mapped match pairs:', Object.keys(dateMap).length);
