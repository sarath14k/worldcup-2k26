export const scraperAnalytics = {
  espn: {
    name: 'ESPN Match Sync',
    isRunning: false,
    mode: 'idle',
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    matchCount: 0,
    liveCount: 0,
    nextMatchTime: null,
    recentRuns: []
  },
  ratings: {
    name: 'FotMob Ratings',
    isRunning: false,
    mode: 'idle',
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    recentRuns: []
  },
  liveRatings: {
    name: 'Live Player Ratings',
    isRunning: false,
    mode: 'idle',
    currentInterval: null,
    totalRuns: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    lastRun: null,
    lastDuration: null,
    lastSuccess: null,
    lastError: null,
    nextScheduledRun: null,
    recentRuns: []
  },
  server: {
    startedAt: new Date().toISOString(),
    get uptime() { return Math.floor((Date.now() - new Date(this.startedAt).getTime()) / 1000); }
  }
};

export function recordRun(scraperKey, { success, duration, error }) {
  const s = scraperAnalytics[scraperKey];
  s.totalRuns++;
  if (success) s.successCount++;
  else s.failureCount++;
  s.lastDuration = duration;
  s.lastSuccess = success;
  s.lastError = error || null;

  s.recentRuns.unshift({
    time: new Date().toISOString(),
    success,
    duration,
    error: error || null
  });
  if (s.recentRuns.length > 20) s.recentRuns.pop();
}
