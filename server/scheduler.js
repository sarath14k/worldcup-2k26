import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scraperAnalytics, recordRun } from './analytics.js';
import { syncWithEspn } from './scrapers/espn.js';
import { syncRatings } from './scrapers/fotmobRatings.js';
import { scrapeLiveRatings } from './scrapers/liveRatings.js';
import { searchHighlights } from './scrapers/highlights.js';
import { TEAMS } from '../src/data/worldcupData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function computeScrapeDelay({ liveCount, nextMatchTime, lastMatchEndTime }) {
  const now = Date.now();

  if (liveCount > 0) {
    return { delay: 30000, mode: 'live', reason: `${liveCount} live match(es)` };
  }

  if (lastMatchEndTime) {
    const endedAgo = now - new Date(lastMatchEndTime).getTime();
    if (endedAgo >= 0 && endedAgo < 30 * 60 * 1000) {
      return { delay: 120000, mode: 'live', reason: `Match ended ${Math.floor(endedAgo / 60000)}min ago` };
    }
  }

  if (nextMatchTime) {
    const timeToMatch = new Date(nextMatchTime).getTime() - now;
    if (timeToMatch > 0 && timeToMatch <= 2 * 60 * 1000) {
      return { delay: 30000, mode: 'pre-match', reason: `Next match in ${Math.floor(timeToMatch / 60000)}min` };
    }
    if (timeToMatch > 2 * 60 * 1000 && timeToMatch <= 20 * 60 * 1000) {
      return { delay: 120000, mode: 'pre-match', reason: `Next match in ${Math.floor(timeToMatch / 60000)}min` };
    }
    if (timeToMatch > 20 * 60 * 1000 && timeToMatch <= 120 * 60 * 1000) {
      return { delay: 3600000, mode: 'standby', reason: `Next match in ${Math.floor(timeToMatch / 60000)}min` };
    }
  }

  return { delay: 3600000, mode: 'idle', reason: 'No upcoming matches' };
}

let scrapeTimeout = null;
let ratingsTimeout = null;
let liveRatingsTimeout = null;
let currentlyLiveMatches = false;
let schedulersStarted = false;

const SCRAPE_TIMEOUT_MS = 120000; // 2 minutes max per scrape

async function runScrape() {
  const analytics = scraperAnalytics.espn;
  if (analytics.isRunning) return;
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();

  // Safety timeout: release isRunning lock if scrape hangs
  const hangTimer = setTimeout(() => {
    if (analytics.isRunning) {
      console.warn('[ESPN Scraper] Timeout reached — releasing isRunning lock');
      analytics.isRunning = false;
    }
  }, SCRAPE_TIMEOUT_MS);

  let scheduleData = { liveCount: 0, nextMatchTime: null, lastMatchEndTime: null };

  try {
    const result = await syncWithEspn();
    const duration = Date.now() - startTime;
    analytics.matchCount = result.count || 0;
    analytics.liveCount = result.liveCount || 0;
    analytics.nextMatchTime = result.nextMatchTime || null;

    scheduleData = {
      liveCount: result.liveCount || 0,
      nextMatchTime: result.nextMatchTime,
      lastMatchEndTime: result.lastMatchEndTime
    };

    currentlyLiveMatches = scheduleData.liveCount > 0;
    recordRun('espn', { success: result.success, duration, error: result.error });
    console.log(`[ESPN Scraper] Completed in ${duration}ms. ${result.count} matches, ${result.liveCount} live.`);

    // Auto-fetch highlights for newly completed matches
    try {
      const livePath = path.join(__dirname, '../public', 'live-matches.json');
      const cachePath = path.join(__dirname, '../src/data/highlights-cache.json');

      if (fs.existsSync(livePath)) {
        const liveData = JSON.parse(fs.readFileSync(livePath, 'utf8'));
        const cacheData = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

        for (const [, match] of Object.entries(liveData)) {
          if (!match.isCompleted) continue;
          const homeCode = (match.home || '').toLowerCase();
          const awayCode = (match.away || '').toLowerCase();
          const cacheKey = `${homeCode}_vs_${awayCode}`;
          if (cacheData[cacheKey]) continue;

          const homeTeam = TEAMS[match.home];
          const awayTeam = TEAMS[match.away];
          if (!homeTeam || !awayTeam) continue;

          console.log(`[Highlights Auto] Fetching for ${homeTeam.name} vs ${awayTeam.name}`);
          const res = await searchHighlights({
            home: homeTeam.name,
            away: awayTeam.name,
            homeCode: match.home,
            awayCode: match.away
          });
          if (res.result) {
            console.log(`[Highlights Auto] ✅ ${res.result.title}`);
          } else {
            console.log(`[Highlights Auto] ❌ No FIFA highlight available`);
          }
        }
      }
    } catch (hlErr) {
      console.error('[Highlights Auto] Error:', hlErr.message);
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('espn', { success: false, duration, error: err.message });
    console.error('[ESPN Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    clearTimeout(hangTimer);
    if (scrapeTimeout) clearTimeout(scrapeTimeout);

    const { delay, mode, reason } = computeScrapeDelay(scheduleData);
    analytics.mode = mode;
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();

    console.log(`[ESPN Scraper] Mode: ${mode} | Next run in ${delay / 1000}s | Reason: ${reason}`);
    scrapeTimeout = setTimeout(runScrape, delay);
  }
}

async function runRatingsSync() {
  const analytics = scraperAnalytics.ratings;
  if (analytics.isRunning) return;
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();

  const hangTimer = setTimeout(() => {
    if (analytics.isRunning) {
      console.warn('[Ratings Scraper] Timeout reached — releasing isRunning lock');
      analytics.isRunning = false;
    }
  }, SCRAPE_TIMEOUT_MS);

  try {
    await syncRatings();
    const duration = Date.now() - startTime;
    recordRun('ratings', { success: true, duration });
    console.log(`[Ratings Scraper] Completed in ${duration}ms.`);
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('ratings', { success: false, duration, error: err.message });
    console.error('[Ratings Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    clearTimeout(hangTimer);
    if (ratingsTimeout) clearTimeout(ratingsTimeout);
    const delay = currentlyLiveMatches ? 1800000 : 10800000;
    analytics.mode = currentlyLiveMatches ? 'live' : 'standby';
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();
    console.log(`[Ratings Scraper] Next run in ${delay / 1000}s`);
    ratingsTimeout = setTimeout(runRatingsSync, delay);
  }
}

async function runLiveRatingsSync() {
  const analytics = scraperAnalytics.liveRatings;
  if (analytics.isRunning) return;
  analytics.isRunning = true;
  analytics.lastRun = new Date().toISOString();
  const startTime = Date.now();

  const hangTimer = setTimeout(() => {
    if (analytics.isRunning) {
      console.warn('[Live Ratings Scraper] Timeout reached — releasing isRunning lock');
      analytics.isRunning = false;
    }
  }, SCRAPE_TIMEOUT_MS);

  try {
    await scrapeLiveRatings();
    const duration = Date.now() - startTime;
    recordRun('liveRatings', { success: true, duration });
    console.log(`[Live Ratings Scraper] Completed in ${duration}ms.`);
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') analytics.timeoutCount++;
    recordRun('liveRatings', { success: false, duration, error: err.message });
    console.error('[Live Ratings Scraper] Failed:', err.message);
  } finally {
    analytics.isRunning = false;
    clearTimeout(hangTimer);
    if (liveRatingsTimeout) clearTimeout(liveRatingsTimeout);
    const delay = currentlyLiveMatches ? 120000 : 10800000;
    analytics.mode = currentlyLiveMatches ? 'live' : 'standby';
    analytics.currentInterval = delay;
    analytics.nextScheduledRun = new Date(Date.now() + delay).toISOString();
    console.log(`[Live Ratings Scraper] Next run in ${delay / 1000}s`);
    liveRatingsTimeout = setTimeout(runLiveRatingsSync, delay);
  }
}

export function startSchedulers() {
  if (schedulersStarted) {
    console.warn('[Scheduler] Already started — ignoring duplicate call');
    return;
  }
  schedulersStarted = true;
  // Clear any existing timers before starting fresh
  if (scrapeTimeout) clearTimeout(scrapeTimeout);
  if (ratingsTimeout) clearTimeout(ratingsTimeout);
  if (liveRatingsTimeout) clearTimeout(liveRatingsTimeout);
  runScrape();
  runRatingsSync();
  runLiveRatingsSync();
}

export function triggerEspnScrape() {
  runScrape();
}

export function triggerRatingsScrape() {
  runRatingsSync();
}

export function triggerLiveRatingsScrape() {
  runLiveRatingsSync();
}
