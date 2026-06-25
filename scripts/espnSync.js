import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateGroupMatches } from '../src/data/worldcupData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../public/live-matches.json');
const distPath = path.join(__dirname, '../dist/live-matches.json');

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

// Fetch match details (stats, scorers, timeline) from ESPN match summary API
async function fetchMatchDetails(eventId, homeTeamAbbr, awayTeamAbbr, homeTeamId, awayTeamId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  console.log(`[ESPN Sync] Fetching match details for event ${eventId} (${homeTeamAbbr} vs ${awayTeamAbbr})`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    
    const boxscore = data.boxscore || {};
    const teamsStats = boxscore.teams || [];
    
    const homeStats = teamsStats.find(t => t.team?.abbreviation === homeTeamAbbr)?.statistics || [];
    const awayStats = teamsStats.find(t => t.team?.abbreviation === awayTeamAbbr)?.statistics || [];
    
    const getStatVal = (statsArr, name, defaultVal = 0) => {
      const s = statsArr.find(x => x.name === name);
      return s ? parseFloat(s.displayValue) : defaultVal;
    };
    
    const stats = {
      possession: [getStatVal(homeStats, 'possessionPct', 50), getStatVal(awayStats, 'possessionPct', 50)],
      shots: [getStatVal(homeStats, 'totalShots'), getStatVal(awayStats, 'totalShots')],
      shotsOnTarget: [getStatVal(homeStats, 'shotsOnTarget'), getStatVal(awayStats, 'shotsOnTarget')],
      corners: [getStatVal(homeStats, 'wonCorners'), getStatVal(awayStats, 'wonCorners')],
      fouls: [getStatVal(homeStats, 'foulsCommitted'), getStatVal(awayStats, 'foulsCommitted')],
      yellowCards: [getStatVal(homeStats, 'yellowCards'), getStatVal(awayStats, 'yellowCards')],
      redCards: [getStatVal(homeStats, 'redCards'), getStatVal(awayStats, 'redCards')]
    };
    
    const events = [];
    const timeline = [];
    
    if (data.keyEvents) {
      data.keyEvents.forEach(ke => {
        const typeText = ke.type?.text || '';
        const textVal = ke.text || '';
        const displayClock = ke.clock?.displayValue || '';
        
        let minute = 0;
        if (displayClock) {
          const clean = displayClock.replace(/[^0-9+-]/g, '');
          if (clean.includes('+')) {
            const parts = clean.split('+');
            minute = (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0);
          } else {
            minute = parseInt(clean) || 0;
          }
        }
        
        timeline.push({
          type: typeText,
          text: textVal,
          minute: minute,
          minuteStr: displayClock
        });
        
        if (ke.scoringPlay || typeText.toLowerCase().includes('goal')) {
          const isHome = homeTeamId 
            ? String(ke.team?.id) === String(homeTeamId) 
            : ke.team?.abbreviation === homeTeamAbbr;
          let player = '';
          if (ke.participants && ke.participants.length > 0) {
            player = ke.participants[0].athlete?.displayName || '';
          } else if (ke.shortText) {
            player = ke.shortText.replace(/\s+Goal/gi, '').trim();
          }
          
          events.push({
            team: isHome ? 'home' : 'away',
            player: player,
            minute: minute
          });
        }
      });
    }
    
    return { stats, events, timeline };
  } catch (error) {
    console.error(`[ESPN Sync] Failed to fetch details for event ${eventId}:`, error.message);
    return null;
  }
}

export async function syncWithEspn() {
  console.log('[ESPN Sync] Starting synchronization cycle...');
  
  let existingLiveData = {};
  if (fs.existsSync(filePath)) {
    try {
      existingLiveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error('[ESPN Sync] Error reading existing live-matches.json:', err.message);
    }
  }
  
  try {
    // 1. Fetch 104 matches of the tournament
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=120';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`HTTP error fetching scoreboard: ${res.status}`);
    }
    const data = await res.json();
    const events = data.events || [];
    console.log(`[ESPN Sync] Fetched ${events.length} events from ESPN API.`);
    
    const liveData = {};
    const appGroupMatches = generateGroupMatches();
    
    // Split events into Group Stage and Knockout Stage
    const groupEvents = events.filter(e => {
      const note = e.competitions?.[0]?.altGameNote || '';
      return note.startsWith('FIFA World Cup, Group');
    });
    
    const knockoutEvents = events.filter(e => {
      const note = e.competitions?.[0]?.altGameNote || '';
      return note === 'FIFA World Cup';
    });
    
    // Sort knockout events chronologically by date ascending
    knockoutEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`[ESPN Sync] Found ${groupEvents.length} Group events and ${knockoutEvents.length} Knockout events.`);
    
    // Map Group Stage Matches
    for (const appMatch of appGroupMatches) {
      const espnEvent = groupEvents.find(e => {
        const competitors = e.competitions?.[0]?.competitors || [];
        if (competitors.length < 2) return false;
        const c0 = competitors[0].team?.abbreviation;
        const c1 = competitors[1].team?.abbreviation;
        return (c0 === appMatch.home && c1 === appMatch.away) || 
               (c0 === appMatch.away && c1 === appMatch.home);
      });
      
      if (espnEvent) {
        await processEvent(espnEvent, appMatch.id, existingLiveData, liveData, appMatch.home, appMatch.away);
      }
    }
    
    // Map Knockout Stage Matches
    Object.keys(knockoutMapping).forEach((appId) => {
      const idx = knockoutMapping[appId];
      const espnEvent = knockoutEvents[idx];
      if (espnEvent) {
        processEventSync(espnEvent, appId, existingLiveData, liveData, null, null);
      }
    });
    
    // Fetch details in parallel batches for active/completed matches that need detail updates
    let liveCount = 0;
    const BATCH_SIZE = 5;
    const detailEntries = [];
    for (const appId of Object.keys(liveData)) {
      const match = liveData[appId];
      if (match.isLive) {
        liveCount++;
      }
      if (match.needsDetailFetch) {
        detailEntries.push(appId);
      }
    }

    // Process detail fetches in batches of BATCH_SIZE
    for (let i = 0; i < detailEntries.length; i += BATCH_SIZE) {
      const batch = detailEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(appId => {
          const match = liveData[appId];
          return fetchMatchDetails(
            match.eventId,
            match.homeAbbr,
            match.awayAbbr,
            match.homeTeamId,
            match.awayTeamId
          ).then(details => ({ appId, details }));
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.details) {
          const { appId, details } = result.value;
          const match = liveData[appId];
          match.stats = details.stats;
          match.events = details.events;
          match.timeline = details.timeline;
          match.isDetailedScraped = true;
          match.isScorersFixed = true;
        }
      }
    }

    // Clean up internal fields from all matches
    for (const appId of Object.keys(liveData)) {
      const match = liveData[appId];
      match.home = match.homeAbbr;
      match.away = match.awayAbbr;

      // ALWAYS delete internal fields
      delete match.isLive;
      delete match.needsDetailFetch;
      delete match.eventId;
      delete match.homeAbbr;
      delete match.awayAbbr;
      delete match.homeTeamId;
      delete match.awayTeamId;
    }
    
    // Write out the output JSON atomically (temp file then rename) to avoid
    // triggering Vite HMR from a partial/in-progress write
    const outputString = JSON.stringify(liveData, null, 2);
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, outputString, 'utf8');
    fs.renameSync(tempPath, filePath);
    // Write to dist (Vite build output folder) if it exists so changes are reflected immediately
    if (fs.existsSync(path.dirname(distPath))) {
      fs.writeFileSync(distPath, outputString, 'utf8');
    }
    
    console.log(`[ESPN Sync] Sync complete. Saved ${Object.keys(liveData).length} active/completed matches. Live matches currently: ${liveCount}`);
    return { success: true, count: Object.keys(liveData).length, liveCount };
    
  } catch (error) {
    console.error('[ESPN Sync] Sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Helpers to process events
async function processEvent(espnEvent, appId, existingLiveData, liveData, appHome, appAway) {
  const comp = espnEvent.competitions?.[0] || {};
  const status = comp.status || {};
  const state = status.type?.state || 'pre';
  
  if (state === 'pre') {
    // Scheduled matches: skip to keep liveData clean
    return;
  }
  
  const competitors = comp.competitors || [];
  const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0];
  const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1];
  
  let homeAbbr = homeComp?.team?.abbreviation;
  let awayAbbr = awayComp?.team?.abbreviation;
  let homeTeamId = homeComp?.team?.id;
  let awayTeamId = awayComp?.team?.id;
  
  let homeScore = parseInt(homeComp?.score || '0', 10);
  let awayScore = parseInt(awayComp?.score || '0', 10);
  
  if (appHome && appAway && homeAbbr === appAway && awayAbbr === appHome) {
    [homeAbbr, awayAbbr] = [awayAbbr, homeAbbr];
    [homeScore, awayScore] = [awayScore, homeScore];
    [homeTeamId, awayTeamId] = [awayTeamId, homeTeamId];
  }
  
  const isCompleted = state === 'post';
  const isLive = state === 'in';
  
  const minute = isCompleted ? 'FT' : (status.displayClock || 'LIVE');
  
  const cached = existingLiveData[appId];
  const needsDetailFetch = !cached || !cached.isDetailedScraped || isLive || !cached.isScorersFixed;
  
  liveData[appId] = {
    homeScore,
    awayScore,
    minute,
    second: 0,
    isCompleted,
    isDetailedScraped: cached?.isDetailedScraped || false,
    isScorersFixed: cached?.isScorersFixed || false,
    events: cached?.events || [],
    stats: cached?.stats || {
      possession: [50, 50],
      shots: [10, 10],
      shotsOnTarget: [5, 5],
      corners: [5, 5],
      fouls: [10, 10],
      yellowCards: [0, 0],
      redCards: [0, 0]
    },
    timeline: cached?.timeline || [],
    // Internal fields for details fetching
    eventId: espnEvent.id,
    homeAbbr,
    awayAbbr,
    homeTeamId,
    awayTeamId,
    isLive,
    needsDetailFetch
  };
}

function processEventSync(espnEvent, appId, existingLiveData, liveData, appHome, appAway) {
  const comp = espnEvent.competitions?.[0] || {};
  const status = comp.status || {};
  const state = status.type?.state || 'pre';
  
  if (state === 'pre') {
    return;
  }
  
  const competitors = comp.competitors || [];
  const homeComp = competitors.find(c => c.homeAway === 'home') || competitors[0];
  const awayComp = competitors.find(c => c.homeAway === 'away') || competitors[1];
  
  let homeAbbr = homeComp?.team?.abbreviation;
  let awayAbbr = awayComp?.team?.abbreviation;
  let homeTeamId = homeComp?.team?.id;
  let awayTeamId = awayComp?.team?.id;
  
  let homeScore = parseInt(homeComp?.score || '0', 10);
  let awayScore = parseInt(awayComp?.score || '0', 10);
  
  if (appHome && appAway && homeAbbr === appAway && awayAbbr === appHome) {
    [homeAbbr, awayAbbr] = [awayAbbr, homeAbbr];
    [homeScore, awayScore] = [awayScore, homeScore];
    [homeTeamId, awayTeamId] = [awayTeamId, homeTeamId];
  }
  
  const isCompleted = state === 'post';
  const isLive = state === 'in';
  
  const minute = isCompleted ? 'FT' : (status.displayClock || 'LIVE');
  
  const cached = existingLiveData[appId];
  const needsDetailFetch = !cached || !cached.isDetailedScraped || isLive || !cached.isScorersFixed;
  
  liveData[appId] = {
    homeScore,
    awayScore,
    minute,
    second: 0,
    isCompleted,
    isDetailedScraped: cached?.isDetailedScraped || false,
    isScorersFixed: cached?.isScorersFixed || false,
    events: cached?.events || [],
    stats: cached?.stats || {
      possession: [50, 50],
      shots: [10, 10],
      shotsOnTarget: [5, 5],
      corners: [5, 5],
      fouls: [10, 10],
      yellowCards: [0, 0],
      redCards: [0, 0]
    },
    timeline: cached?.timeline || [],
    eventId: espnEvent.id,
    homeAbbr,
    awayAbbr,
    homeTeamId,
    awayTeamId,
    isLive,
    needsDetailFetch
  };
}
