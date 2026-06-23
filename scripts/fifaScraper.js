import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { generateGroupMatches } from '../src/data/worldcupData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../public/live-matches.json');

// Helper to scrape details of a single match using Puppeteer page
async function scrapeMatchDetails(page, href) {
  const url = 'https://www.fifa.com' + href;
  console.log(`Scraping match details from: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for the page content to load and scripts to execute
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const detailData = await page.evaluate(async () => {
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
          const goalIcon = ev.querySelector('[class*="goalIcon"], [class*="ownGoal"]');
          if (nameEl && goalIcon) {
            const player = nameEl.textContent.trim();
            let minuteStr = timeEl ? timeEl.textContent.trim() : '';
            minuteStr = minuteStr.replace(player, '').trim();
            
            // Clean minute string and parse to number
            const clean = minuteStr.replace(/[^0-9+-]/g, '');
            let minute = 0;
            if (clean.includes('+')) {
              const parts = clean.split('+');
              minute = (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
            } else {
              minute = parseInt(clean) || 0;
            }

            const ogOrP = ogEl ? ogEl.textContent.trim() : '';
            const finalPlayer = ogOrP ? `${player} ${ogOrP}` : player;

            homeScorers.push({
              team: 'home',
              player: finalPlayer,
              minute
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
          const goalIcon = ev.querySelector('[class*="goalIcon"], [class*="ownGoal"]');
          if (nameEl && goalIcon) {
            const player = nameEl.textContent.trim();
            let minuteStr = timeEl ? timeEl.textContent.trim() : '';
            minuteStr = minuteStr.replace(player, '').trim();
            
            // Clean minute string and parse to number
            const clean = minuteStr.replace(/[^0-9+-]/g, '');
            let minute = 0;
            if (clean.includes('+')) {
              const parts = clean.split('+');
              minute = (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
            } else {
              minute = parseInt(clean) || 0;
            }

            const ogOrP = ogEl ? ogEl.textContent.trim() : '';
            const finalPlayer = ogOrP ? `${player} ${ogOrP}` : player;

            awayScorers.push({
              team: 'away',
              player: finalPlayer,
              minute
            });
          }
        });
      }

      const scorersList = [...homeScorers, ...awayScorers];
      scorersList.sort((a, b) => a.minute - b.minute);

      // 2. Find and click the STATS tab if present
      const divs = Array.from(document.querySelectorAll('div'));
      const statsTab = divs.find(d => d.textContent.trim() === 'STATS');
      if (statsTab) {
        statsTab.click();
        // Wait 2.5 seconds for stats to render in the browser
        await new Promise(r => setTimeout(r, 2500));
      }

      // 3. Extract statistics
      const stats = {
        possession: [50, 50],
        shots: [10, 10],
        shotsOnTarget: [5, 5],
        corners: [5, 5],
        fouls: [10, 10],
        yellowCards: [0, 0],
        redCards: [0, 0]
      };
      
      // Possession
      const possessionHomeEl = document.querySelector('[class*="single-stat-possession-component_Left__"]');
      const possessionAwayEl = document.querySelector('[class*="single-stat-possession-component_Right__"]');
      if (possessionHomeEl && possessionAwayEl) {
        stats.possession = [
          parseInt(possessionHomeEl.textContent.trim()) || 50,
          parseInt(possessionAwayEl.textContent.trim()) || 50
        ];
      }

      // Other stats
      const statItems = document.querySelectorAll('[class*="match-stats-tab-component_statsGroupInner__"] > div');
      statItems.forEach(item => {
        const titleEl = item.querySelector('[class*="match-stats-tab-component_statTitle__"]');
        const leftEl = item.querySelector('[class*="single-stat-component_Left__"]');
        const rightEl = item.querySelector('[class*="single-stat-component_Right__"]');
        
        if (titleEl && leftEl && rightEl) {
          const title = titleEl.textContent.trim().toLowerCase().trim();
          const leftVal = parseInt(leftEl.textContent.trim()) || 0;
          const rightVal = parseInt(rightEl.textContent.trim()) || 0;
          
          if (title === 'total' && item.closest('[class*="match-stats-tab-component_statsGroup__"]')?.innerHTML.toLowerCase().includes('attempts')) {
            stats.shots = [leftVal, rightVal];
          } else if (title === 'on target') {
            stats.shotsOnTarget = [leftVal, rightVal];
          } else if (title === 'corners') {
            stats.corners = [leftVal, rightVal];
          } else if (title === 'fouls against') {
            stats.fouls = [leftVal, rightVal];
          } else if (title === 'yellow cards') {
            stats.yellowCards = [leftVal, rightVal];
          } else if (title === 'red cards') {
            stats.redCards = [leftVal, rightVal];
          }
        }
      });

      // 4. Extract timeline events from JSON-LD
      let timeline = [];
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
            // Find period starts and ends
            const starts = json.liveBlogUpdate
              .filter(e => e.headline === 'Start Time' || e.headline === 'Kick Off')
              .map(e => new Date(e.datePublished).getTime());
            
            const ends = json.liveBlogUpdate
              .filter(e => e.headline === 'End Time' || e.headline === 'Half Time' || e.headline === 'Match end')
              .map(e => new Date(e.datePublished).getTime());

            const p1Start = starts[0] || new Date(json.coverageStartTime).getTime();
            const p1End = ends[0] || (p1Start + 45 * 60 * 1000);
            const p2Start = starts[1];

            timeline = json.liveBlogUpdate.map(update => {
              const headline = update.headline;
              const time = new Date(update.datePublished).getTime();
              
              let min = 0;
              let minuteStr = '';
              
              if (headline === 'Coin Toss') {
                min = 0;
                minuteStr = "0'";
              } else if (p2Start && time >= p2Start) {
                // Second half
                const diffMin = Math.ceil((time - p2Start) / 60000);
                min = 45 + diffMin;
                if (min > 90) {
                  minuteStr = `90'+${min - 90}`;
                } else {
                  minuteStr = `${min}'`;
                }
              } else if (time > p1End && (!p2Start || time < p2Start)) {
                // Halftime
                min = 45;
                minuteStr = 'HT';
              } else {
                // First half
                const diffMin = Math.ceil((time - p1Start) / 60000);
                min = diffMin;
                if (min < 1) min = 1;
                if (min > 45) {
                  minuteStr = `45'+${min - 45}`;
                } else {
                  minuteStr = `${min}'`;
                }
              }

              return {
                type: headline,
                text: update.articleBody || '',
                minute: min,
                minuteStr
              };
            });
            break;
          }
        } catch (e) {
          // ignore
        }
      }

      return {
        scorers: scorersList,
        stats,
        timeline
      };
    });

    return detailData;
  } catch (err) {
    console.error(`Error scraping detail page ${href}:`, err);
    return null;
  }
}

// Helper to check if cached detailed data is valid and not dummy
function isRealDetailedData(cached, homeScore, awayScore) {
  if (!cached || !cached.isDetailedScraped) return false;
  
  // If there are goals but 0 events, it must be dummy/empty
  const totalGoals = (homeScore || 0) + (awayScore || 0);
  if (totalGoals > 0 && (!cached.events || cached.events.length === 0)) {
    return false;
  }

  // Force re-scrape if match timeline is empty/missing
  if (!cached.timeline || cached.timeline.length === 0) {
    return false;
  }
  
  // If stats are exactly default, it's highly likely to be dummy
  const stats = cached.stats;
  if (stats) {
    const isDefaultPossession = stats.possession?.[0] === 50 && stats.possession?.[1] === 50;
    const isDefaultShots = stats.shots?.[0] === 10 && stats.shots?.[1] === 10;
    const isDefaultCorners = stats.corners?.[0] === 5 && stats.corners?.[1] === 5;
    if (isDefaultPossession && isDefaultShots && isDefaultCorners) {
      return false;
    }
  } else {
    return false;
  }
  
  return true;
}

// Helper to check if stats are default dummy values
function isDummyStats(stats) {
  if (!stats) return true;
  const isDefaultPossession = stats.possession?.[0] === 50 && stats.possession?.[1] === 50;
  const isDefaultShots = stats.shots?.[0] === 10 && stats.shots?.[1] === 10;
  const isDefaultCorners = stats.corners?.[0] === 5 && stats.corners?.[1] === 5;
  return isDefaultPossession && isDefaultShots && isDefaultCorners;
}

export async function scrapeFifa() {
  let browser = null;
  try {
    console.log('Scraping FIFA World Cup 2026 website...');
    const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
    
    // Find Chrome executable path
    const chromePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser'
    ];
    const executablePath = chromePaths.find(p => fs.existsSync(p)) || 'google-chrome';
    
    // Launch Chrome
    browser = await puppeteer.launch({
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
    
    console.log('Navigating to FIFA scores-fixtures page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for the fixtures page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    const parsedMatches = [];
    let currentDateText = '';
    
    // Find all elements that are either date titles or match links
    const elements = $('[class*="matches-container_title__"], a[href*="/en/match-centre/match/"]');

    elements.each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      
      if (href.includes('/en/match-centre/match/')) {
        const matchIdMatch = href.match(/\/(\d+)$/);
        if (!matchIdMatch) return;
        const matchId = matchIdMatch[1];
        
        // Teams
        const teams = [];
        $el.find('[class*="match-row_team__"]').each((j, teamEl) => {
          const abbr = $(teamEl).find('[class*="team-abbreviations_container__"] span').first().text().trim();
          const name = $(teamEl).find('span.d-none.d-md-block').first().text().trim();
          teams.push({ abbr, name });
        });
        
        // Scores & Status
        const statusContainer = $el.find('[class*="match-row_matchRowStatus__"]').first();
        let status = '';
        let homeScore = null;
        let awayScore = null;
        let kickoffTime = null;
        let winner = null;
        
        const scoreEls = statusContainer.find('[class*="match-row_score__"]');
        const ftStatus = statusContainer.find('[class*="match-row_status__"]');
        const statusText = ftStatus.text().trim();

        if (scoreEls.length > 0) {
          // If score elements exist, the match has started (either FT or LIVE)
          if (statusText === 'FT') {
            status = 'FT';
          } else {
            status = statusText || 'LIVE';
          }
          
          const scores = [];
          scoreEls.each((j, scoreEl) => {
            scores.push(parseInt($(scoreEl).text().trim()));
          });
          homeScore = scores[0] ?? null;
          awayScore = scores[1] ?? null;
          
          const homeScoreEl = scoreEls.eq(0);
          const awayScoreEl = scoreEls.eq(1);
          if (homeScoreEl.attr('class') && homeScoreEl.attr('class').includes('scoreWinner')) {
            winner = 'home';
          } else if (awayScoreEl.attr('class') && awayScoreEl.attr('class').includes('scoreWinner')) {
            winner = 'away';
          }
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
          href,
          homeTeam: teams[0] || null,
          awayTeam: teams[1] || null,
          status,
          homeScore,
          awayScore,
          winner,
          stage,
          group,
          dateText: currentDateText
        });
      } else {
        currentDateText = $el.text().trim();
      }
    });

    if (parsedMatches.length === 0) {
      throw new Error('No matches parsed from the DOM. Page selector structures may have changed.');
    }

    const groupStageParsed = parsedMatches.filter(pm => pm.group && pm.group.startsWith('Group'));
    const knockoutsParsed = parsedMatches.filter(pm => !pm.group || !pm.group.startsWith('Group'));

    const appGroupMatches = generateGroupMatches();

    const knockoutMapping = {
      // Round of 32
      'r32_1': 0, 'r32_2': 1, 'r32_3': 2, 'r32_4': 3, 'r32_5': 4, 'r32_6': 5, 'r32_7': 6, 'r32_8': 7,
      'r32_9': 8, 'r32_10': 9, 'r32_11': 10, 'r32_12': 11, 'r32_13': 12, 'r32_14': 13, 'r32_15': 14, 'r32_16': 15,
      // Round of 16
      'r16_1': 16, 'r16_2': 17, 'r16_3': 18, 'r16_4': 19, 'r16_5': 20, 'r16_6': 21, 'r16_7': 22, 'r16_8': 23,
      // Quarter-finals
      'qf_1': 24, 'qf_2': 25, 'qf_3': 26, 'qf_4': 27,
      // Semi-finals
      'sf_1': 28, 'sf_2': 29,
      // Bronze / Final
      'bronze': 30, 'final': 31
    };

    let existingLiveData = {};
    if (fs.existsSync(filePath)) {
      try {
        existingLiveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error('Error reading live-matches.json:', err);
      }
    }

    // Detailed Scraping Loop
    for (let i = 0; i < parsedMatches.length; i++) {
      const pm = parsedMatches[i];
      const isCompleted = pm.status === 'FT';
      const isLive = pm.status !== 'FT' && pm.status !== 'SCHEDULED';
      
      if (!isCompleted && !isLive) {
        continue;
      }

      // Determine the appId
      let appId = null;
      if (pm.group && pm.group.startsWith('Group')) {
        const appMatch = appGroupMatches.find(am => {
          return (pm.homeTeam?.abbr === am.home && pm.awayTeam?.abbr === am.away) ||
                 (pm.homeTeam?.abbr === am.away && pm.awayTeam?.abbr === am.home);
        });
        if (appMatch) {
          appId = appMatch.id;
        }
      } else {
        const parsedIdx = knockoutsParsed.indexOf(pm);
        if (parsedIdx !== -1) {
          const foundKey = Object.keys(knockoutMapping).find(k => knockoutMapping[k] === parsedIdx);
          if (foundKey) {
            appId = foundKey;
          }
        }
      }

      // Check cache (we only reuse cache if the match is completed and has valid detailed data)
      const cached = appId ? existingLiveData[appId] : null;
      const hasRealCache = cached && isCompleted && isRealDetailedData(cached, pm.homeScore, pm.awayScore);

      if (hasRealCache) {
        console.log(`Cache HIT for App ID: ${appId} (${pm.homeTeam?.abbr} vs ${pm.awayTeam?.abbr})`);
        pm.detailedData = {
          scorers: cached.events || [],
          stats: cached.stats || {
            possession: [50, 50],
            shots: [10, 10],
            shotsOnTarget: [5, 5],
            corners: [5, 5],
            fouls: [10, 10],
            yellowCards: [0, 0],
            redCards: [0, 0]
          },
          timeline: cached.timeline || []
        };
        pm.isDetailedScraped = true;
        pm.fromCache = true;
      } else {
        console.log(`Cache MISS for App ID: ${appId || 'unknown'} (${pm.homeTeam?.abbr} vs ${pm.awayTeam?.abbr}). Scraping details...`);
        const details = await scrapeMatchDetails(page, pm.href);
        if (details) {
          const hasRealCachedStats = cached && cached.stats && !isDummyStats(cached.stats);
          const scrapedIsDummy = isDummyStats(details.stats);

          if (hasRealCachedStats && scrapedIsDummy) {
            console.log(`Preserving cached real stats for App ID ${appId} (new scrape returned dummy stats)`);
            details.stats = cached.stats;
          }

          if (cached && cached.events && cached.events.length > 0 && (!details.scorers || details.scorers.length === 0)) {
            details.scorers = cached.events;
          }

          if (cached && cached.timeline && cached.timeline.length > 0 && (!details.timeline || details.timeline.length === 0)) {
            details.timeline = cached.timeline;
          }

          pm.detailedData = details;
          pm.isDetailedScraped = isCompleted || (cached ? cached.isDetailedScraped : false);
        } else {
          pm.detailedData = {
            scorers: cached?.events || [],
            stats: cached?.stats || {
              possession: [50, 50],
              shots: [10, 10],
              shotsOnTarget: [5, 5],
              corners: [5, 5],
              fouls: [10, 10],
              yellowCards: [0, 0],
              redCards: [0, 0]
            },
            timeline: cached?.timeline || []
          };
          pm.isDetailedScraped = cached ? cached.isDetailedScraped : false;
        }
      }

      // Map current state and save incrementally
      const incrementalLiveData = {};

      // 1. Group Stage
      appGroupMatches.forEach(appMatch => {
        const parsedMatch = groupStageParsed.find(pmVal => {
          return (pmVal.homeTeam?.abbr === appMatch.home && pmVal.awayTeam?.abbr === appMatch.away) ||
                 (pmVal.homeTeam?.abbr === appMatch.away && pmVal.awayTeam?.abbr === appMatch.home);
        });

        if (parsedMatch) {
          const isReversed = parsedMatch.homeTeam?.abbr === appMatch.away;
          const homeScore = isReversed ? parsedMatch.awayScore : parsedMatch.homeScore;
          const awayScore = isReversed ? parsedMatch.homeScore : parsedMatch.awayScore;

          let events = [];
          let stats = {
            possession: [50, 50],
            shots: [10, 10],
            shotsOnTarget: [5, 5],
            corners: [5, 5],
            fouls: [10, 10],
            yellowCards: [0, 0],
            redCards: [0, 0]
          };

          let timeline = [];
          if (parsedMatch.detailedData) {
            timeline = parsedMatch.detailedData.timeline || [];
            if (isReversed && !parsedMatch.fromCache) {
              events = parsedMatch.detailedData.scorers.map(e => ({
                ...e,
                team: e.team === 'home' ? 'away' : 'home'
              }));
              
              Object.keys(parsedMatch.detailedData.stats).forEach(k => {
                const val = parsedMatch.detailedData.stats[k];
                stats[k] = [val[1], val[0]];
              });
            } else {
              events = parsedMatch.detailedData.scorers;
              stats = parsedMatch.detailedData.stats;
            }
          } else {
            const prevCached = existingLiveData[appMatch.id];
            if (prevCached) {
              events = prevCached.events || [];
              stats = prevCached.stats || stats;
              timeline = prevCached.timeline || [];
            }
          }

          incrementalLiveData[appMatch.id] = {
            homeScore,
            awayScore,
            minute: parsedMatch.status === 'FT' ? 'FT' : (parsedMatch.status === 'SCHEDULED' ? null : parsedMatch.status),
            second: 0,
            isCompleted: parsedMatch.status === 'FT',
            isDetailedScraped: parsedMatch.isDetailedScraped || false,
            events,
            stats,
            timeline
          };
        } else {
          if (existingLiveData[appMatch.id]) {
            incrementalLiveData[appMatch.id] = existingLiveData[appMatch.id];
          }
        }
      });

      // 2. Knockouts
      Object.keys(knockoutMapping).forEach(appIdVal => {
        const parsedIdx = knockoutMapping[appIdVal];
        const parsedMatch = knockoutsParsed[parsedIdx];

        if (parsedMatch) {
          let winnerCode = null;
          if (parsedMatch.status === 'FT' && parsedMatch.winner) {
            winnerCode = parsedMatch.winner === 'home' ? parsedMatch.homeTeam?.abbr : parsedMatch.awayTeam?.abbr;
          }

          let events = [];
          let stats = {
            possession: [50, 50],
            shots: [10, 10],
            shotsOnTarget: [5, 5],
            corners: [5, 5],
            fouls: [10, 10],
            yellowCards: [0, 0],
            redCards: [0, 0]
          };
          let timeline = [];

          if (parsedMatch.detailedData) {
            events = parsedMatch.detailedData.scorers || [];
            stats = parsedMatch.detailedData.stats || stats;
            timeline = parsedMatch.detailedData.timeline || [];
          } else {
            const prevCached = existingLiveData[appIdVal];
            if (prevCached) {
              events = prevCached.events || [];
              stats = prevCached.stats || stats;
              timeline = prevCached.timeline || [];
            }
          }

          incrementalLiveData[appIdVal] = {
            homeScore: parsedMatch.homeScore,
            awayScore: parsedMatch.awayScore,
            minute: parsedMatch.status === 'FT' ? 'FT' : (parsedMatch.status === 'SCHEDULED' ? null : parsedMatch.status),
            isCompleted: parsedMatch.status === 'FT',
            isDetailedScraped: parsedMatch.isDetailedScraped || false,
            winner: winnerCode,
            home: parsedMatch.homeTeam?.abbr,
            away: parsedMatch.awayTeam?.abbr,
            events,
            stats,
            timeline
          };
        } else {
          if (existingLiveData[appIdVal]) {
            incrementalLiveData[appIdVal] = existingLiveData[appIdVal];
          }
        }
      });

      const tempPath = filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(incrementalLiveData, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
    }

    // Map into the final liveData structure (redundant but ensures everything is finalized)
    const liveData = {};

    // 1. Group Stage
    appGroupMatches.forEach(appMatch => {
      const parsedMatch = groupStageParsed.find(pm => {
        return (pm.homeTeam?.abbr === appMatch.home && pm.awayTeam?.abbr === appMatch.away) ||
               (pm.homeTeam?.abbr === appMatch.away && pm.awayTeam?.abbr === appMatch.home);
      });

      if (parsedMatch) {
        const isReversed = parsedMatch.homeTeam?.abbr === appMatch.away;
        const homeScore = isReversed ? parsedMatch.awayScore : parsedMatch.homeScore;
        const awayScore = isReversed ? parsedMatch.homeScore : parsedMatch.awayScore;

        let events = [];
        let stats = {
          possession: [50, 50],
          shots: [10, 10],
          shotsOnTarget: [5, 5],
          corners: [5, 5],
          fouls: [10, 10],
          yellowCards: [0, 0],
          redCards: [0, 0]
        };

        let timeline = [];
        if (parsedMatch.detailedData) {
          timeline = parsedMatch.detailedData.timeline || [];
          if (isReversed && !parsedMatch.fromCache) {
            events = parsedMatch.detailedData.scorers.map(e => ({
              ...e,
              team: e.team === 'home' ? 'away' : 'home'
            }));
            
            Object.keys(parsedMatch.detailedData.stats).forEach(k => {
              const val = parsedMatch.detailedData.stats[k];
              stats[k] = [val[1], val[0]];
            });
          } else {
            events = parsedMatch.detailedData.scorers;
            stats = parsedMatch.detailedData.stats;
          }
        } else {
          const prevCached = existingLiveData[appMatch.id];
          if (prevCached) {
            events = prevCached.events || [];
            stats = prevCached.stats || stats;
            timeline = prevCached.timeline || [];
          }
        }

        liveData[appMatch.id] = {
          homeScore,
          awayScore,
          minute: parsedMatch.status === 'FT' ? 'FT' : (parsedMatch.status === 'SCHEDULED' ? null : parsedMatch.status),
          second: 0,
          isCompleted: parsedMatch.status === 'FT',
          isDetailedScraped: parsedMatch.isDetailedScraped || false,
          events,
          stats,
          timeline
        };
      } else {
        if (existingLiveData[appMatch.id]) {
          liveData[appMatch.id] = existingLiveData[appMatch.id];
        }
      }
    });

    // 2. Knockouts
    Object.keys(knockoutMapping).forEach(appId => {
      const parsedIdx = knockoutMapping[appId];
      const parsedMatch = knockoutsParsed[parsedIdx];

      if (parsedMatch) {
        let winnerCode = null;
        if (parsedMatch.status === 'FT' && parsedMatch.winner) {
          winnerCode = parsedMatch.winner === 'home' ? parsedMatch.homeTeam?.abbr : parsedMatch.awayTeam?.abbr;
        }

        let events = [];
        let stats = {
          possession: [50, 50],
          shots: [10, 10],
          shotsOnTarget: [5, 5],
          corners: [5, 5],
          fouls: [10, 10],
          yellowCards: [0, 0],
          redCards: [0, 0]
        };
        let timeline = [];

        if (parsedMatch.detailedData) {
          events = parsedMatch.detailedData.scorers || [];
          stats = parsedMatch.detailedData.stats || stats;
          timeline = parsedMatch.detailedData.timeline || [];
        } else {
          const prevCached = existingLiveData[appId];
          if (prevCached) {
            events = prevCached.events || [];
            stats = prevCached.stats || stats;
            timeline = prevCached.timeline || [];
          }
        }

        liveData[appId] = {
          homeScore: parsedMatch.homeScore,
          awayScore: parsedMatch.awayScore,
          minute: parsedMatch.status === 'FT' ? 'FT' : (parsedMatch.status === 'SCHEDULED' ? null : parsedMatch.status),
          isCompleted: parsedMatch.status === 'FT',
          isDetailedScraped: parsedMatch.isDetailedScraped || false,
          winner: winnerCode,
          home: parsedMatch.homeTeam?.abbr,
          away: parsedMatch.awayTeam?.abbr,
          events,
          stats,
          timeline
        };
      } else {
        if (existingLiveData[appId]) {
          liveData[appId] = existingLiveData[appId];
        }
      }
    });

    // Write the output to live-matches.json
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(liveData, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    console.log(`Sync complete. Saved ${Object.keys(liveData).length} matches to public/live-matches.json.`);
    
    return { success: true, count: Object.keys(liveData).length };
  } catch (error) {
    console.error('Error in scrapeFifa:', error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
