import { useState, useEffect, useCallback } from 'react';
import { Activity, CheckCircle, XCircle, Timer, Server, Wifi, WifiOff, RefreshCw, Zap, AlertTriangle } from 'lucide-react';

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < 60000) return `in ${Math.floor(absDiff / 1000)}s`;
    if (absDiff < 3600000) return `in ${Math.floor(absDiff / 60000)}m`;
    return `in ${Math.floor(absDiff / 3600000)}h`;
  }
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function formatDuration(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatInterval(ms) {
  if (ms == null) return '-';
  if (ms < 60000) return `every ${ms / 1000}s`;
  if (ms < 3600000) return `every ${ms / 60000}m`;
  return `every ${ms / 3600000}h`;
}

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const MODE_CONFIG = {
  live: { emoji: '🟢', label: 'Live', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  'pre-match': { emoji: '🟡', label: 'Pre-Match', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
  standby: { emoji: '🔵', label: 'Standby', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/20' },
  idle: { emoji: '⚪', label: 'Idle', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/40', glow: 'shadow-slate-500/10' }
};

function ScraperCard({ data, scraperKey, onSync }) {
  const mode = MODE_CONFIG[data.mode] || MODE_CONFIG.idle;
  const successRate = data.totalRuns > 0 ? Math.round((data.successCount / data.totalRuns) * 100) : 0;
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (syncing || data.isRunning) return;
    setSyncing(true);
    try {
      await onSync(scraperKey);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={`relative rounded-2xl border ${mode.border} ${mode.bg} backdrop-blur-sm p-5 transition-all duration-500 shadow-lg ${mode.glow}`}>
      {/* Running indicator */}
      {(data.isRunning || syncing) && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${mode.bg} border ${mode.border} flex items-center justify-center text-lg`}>
          {mode.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-sm">{data.name}</h3>
            <button
              onClick={handleSync}
              disabled={syncing || data.isRunning}
              className={`p-1 rounded-lg transition-all cursor-pointer border-0 shrink-0 ${
                syncing || data.isRunning
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-500 hover:text-brand-neon hover:bg-slate-800/50'
              }`}
              title={`Sync ${data.name}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <span className={`text-xs font-semibold ${mode.color} uppercase tracking-wider`}>{mode.label}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Last Run</div>
          <div className="text-xs text-slate-200 font-mono">{formatRelativeTime(data.lastRun)}</div>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Duration</div>
          <div className="text-xs text-slate-200 font-mono">{formatDuration(data.lastDuration)}</div>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Interval</div>
          <div className="text-xs text-slate-200 font-mono">{formatInterval(data.currentInterval)}</div>
        </div>
        <div className="bg-slate-900/40 rounded-lg p-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Next Run</div>
          <div className="text-xs text-slate-200 font-mono">{formatRelativeTime(data.nextScheduledRun)}</div>
        </div>
      </div>

      {/* Counters row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 rounded-full px-2.5 py-1">
          <CheckCircle className="w-3 h-3" />
          <span className="text-[11px] font-bold">{data.successCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-red-500/10 text-red-400 rounded-full px-2.5 py-1">
          <XCircle className="w-3 h-3" />
          <span className="text-[11px] font-bold">{data.failureCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 rounded-full px-2.5 py-1">
          <Timer className="w-3 h-3" />
          <span className="text-[11px] font-bold">{data.timeoutCount}</span>
        </div>
        <div className="ml-auto text-[11px] text-slate-500 font-mono">
          {data.totalRuns} runs
        </div>
      </div>

      {/* Success rate bar */}
      <div className="relative h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${successRate}%`,
            background: successRate >= 90 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444'
          }}
        />
      </div>
      <div className="text-right text-[10px] text-slate-500 mt-1">{successRate}% success</div>

      {/* ESPN-specific: extra info */}
      {scraperKey === 'espn' && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Matches tracked</span>
            <span className="text-slate-300 font-mono">{data.matchCount || 0}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-slate-500">Live now</span>
            <span className={`font-mono font-bold ${data.liveCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {data.liveCount || 0}
            </span>
          </div>
          {data.nextMatchTime && (
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className="text-slate-500">Next kickoff</span>
              <span className="text-amber-400 font-mono">{formatRelativeTime(data.nextMatchTime)}</span>
            </div>
          )}
        </div>
      )}

      {/* Last error */}
      {data.lastError && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <div className="flex items-start gap-2 text-[11px] text-red-400/80">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="truncate">{data.lastError}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RecentRunsTimeline({ runs }) {
  if (!runs || runs.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-6">No runs recorded yet</div>
    );
  }

  return (
    <div className="space-y-1.5">
      {runs.map((run, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
            run.success ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-red-500/5 hover:bg-red-500/10'
          }`}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${run.success ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-[11px] text-slate-400 font-mono w-16 shrink-0">{formatRelativeTime(run.time)}</span>
          <span className="text-[11px] text-slate-500 font-mono w-14 shrink-0">{formatDuration(run.duration)}</span>
          {run.error && (
            <span className="text-[11px] text-red-400/70 truncate">{run.error}</span>
          )}
          {run.success && (
            <span className="text-[11px] text-emerald-500/50">OK</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SystemTab() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [, forceUpdate] = useState(0);

  const triggerSync = useCallback(async (type) => {
    const apiType = type === 'liveRatings' ? 'live-ratings' : type;
    try {
      const res = await fetch(`/api/trigger-scrape/${apiType}`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await new Promise(r => setTimeout(r, 500));
      await fetchAnalytics();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }, [fetchAnalytics]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/scraper-analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
      setError(null);
      setLastFetch(new Date().toISOString());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Fetch analytics once on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Update relative timestamps on minute boundaries instead of every second
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) forceUpdate(t => t + 1);
    }, 60000);
  }, []);

  if (error && !analytics) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-8 text-center">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-red-300 font-bold text-lg mb-2">Connection Error</h3>
          <p className="text-red-400/70 text-sm mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-3 text-slate-400 py-12">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
            <Server className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">System Monitor</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Uptime: {formatUptime(analytics.server?.uptime)}</span>
              <span className="text-slate-700">•</span>
              <span>Started {formatRelativeTime(analytics.server?.startedAt)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Scraper cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ScraperCard data={analytics.espn} scraperKey="espn" onSync={triggerSync} />
        <ScraperCard data={analytics.ratings} scraperKey="ratings" onSync={triggerSync} />
        <ScraperCard data={analytics.liveRatings} scraperKey="liveRatings" onSync={triggerSync} />
      </div>

      {/* Scheduling explanation */}
      <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 backdrop-blur-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-bold text-sm">Smart Scheduling Engine</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
          {[
            { condition: 'Live matches', interval: '30s', mode: 'live', emoji: '🟢' },
            { condition: 'Pre-match (< 10 min)', interval: '30s', mode: 'pre-match', emoji: '🟡' },
            { condition: 'Match ended (< 30 min)', interval: '30s', mode: 'live', emoji: '🟢' },
            { condition: 'Upcoming (10–60 min)', interval: '5 min', mode: 'standby', emoji: '🔵' },
            { condition: 'No matches soon', interval: '1 hour', mode: 'idle', emoji: '⚪' },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-900/30 rounded-lg px-3 py-2">
              <span>{row.emoji}</span>
              <span className="text-slate-400">{row.condition}</span>
              <span className="ml-auto text-slate-200 font-mono font-bold">{row.interval}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent ESPN runs timeline */}
      <div className="rounded-2xl border border-slate-700/30 bg-slate-800/20 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-bold text-sm">Recent ESPN Runs</h3>
          <span className="text-[10px] text-slate-500 ml-auto">Last {analytics.espn?.recentRuns?.length || 0} runs</span>
        </div>
        
        {/* Dot summary */}
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          {(analytics.espn?.recentRuns || []).map((run, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                run.success ? 'bg-emerald-400/80 hover:bg-emerald-400' : 'bg-red-400/80 hover:bg-red-400'
              }`}
              title={`${formatRelativeTime(run.time)} - ${run.success ? 'OK' : run.error} (${formatDuration(run.duration)})`}
            />
          ))}
        </div>

        <RecentRunsTimeline runs={analytics.espn?.recentRuns} />
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-[10px] text-slate-600">
        Last fetch: {formatRelativeTime(lastFetch)}
        {error && <span className="text-amber-500 ml-2">⚠ {error}</span>}
      </div>
    </div>
  );
}
