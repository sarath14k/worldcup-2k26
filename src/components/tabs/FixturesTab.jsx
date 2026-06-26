import { useState } from 'react';
import { Award } from 'lucide-react';
import { TEAMS } from '../../data/worldcupData';
import { formatDisplayDate, formatLiveMatchTime, getPossessionWithContest, isMobile, FifaRankBadge } from '../../utils/matchHelpers';
import { LiveMatchesList } from '../LiveMatchesBanner';
import { ScrollingText } from '../ScrollingText';

export const FixturesTab = ({ 
  hasLiveMatches, 
  activeLiveMatchesList, 
  upcomingFixtures, 
  feedMatches, 
  liveMatches, 
  highlightsMap, 
  loadingHighlightsMap, 
  isLiveMatch, 
  setSelectedMatch,
  activeGoalFlashMatchIds = []
}) => {
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      {/* Active Live Matches (Rendered directly only when active) */}
      {hasLiveMatches && activeLiveMatchesList.length > 0 && (
        <div className="mb-2 animate-fadeIn w-full">
          <LiveMatchesList 
            activeLiveMatchesList={activeLiveMatchesList} 
            setSelectedMatch={setSelectedMatch} 
            activeGoalFlashMatchIds={activeGoalFlashMatchIds}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left side: Upcoming Fixtures */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          {/* Upcoming Fixtures widget */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/60 to-slate-950/80 border border-brand-purple/20 backdrop-blur-md relative overflow-hidden shadow-glass">
            {/* Glow accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-neon"></span>
                </span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                  Upcoming Fixtures
                </h3>
              </div>
              <span className="text-[9px] bg-brand-neon/10 border border-brand-neon/20 text-brand-neon px-2.5 py-1 rounded-full font-bold font-mono">
                LIVE STATUS
              </span>
            </div>

            <div className="flex flex-col gap-3.5 relative z-10 max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              {(showAllUpcoming ? upcomingFixtures : upcomingFixtures.slice(0, 3)).map(match => {
                const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
                const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
                const live = liveMatches[match.id];
                const isMatchLive = isLiveMatch(live);
                const isLiveOrDone = isMatchLive || match.isCompleted || (live && (live.minute === 'FT' || live.isCompleted));
                const isFlashing = activeGoalFlashMatchIds.includes(String(match.id));
                return (
                  <div 
                    key={`today-${match.id}`} 
                    onClick={() => setSelectedMatch(match)}
                    className={`p-3.5 sm:p-4 bg-slate-950/50 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative overflow-hidden shrink-0 card-shimmer ${
                      isFlashing
                        ? 'animate-goalFlash'
                        : isMatchLive 
                          ? 'border-brand-neon bg-gradient-to-br from-brand-neon/5 to-slate-950/80 shadow-[0_0_15px_rgba(0,242,254,0.1)] ring-1 ring-brand-neon/20' 
                          : 'border-slate-900/85 hover:border-slate-800 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                      <span className="text-brand-neon uppercase font-extrabold flex items-center gap-1">
                        Group {match.group} • Match {((match.id - 1) % 6) + 1}
                        {isFlashing ? (
                          <span className="bg-brand-neon text-slate-950 text-[8px] px-1 py-0.5 rounded font-black animate-bounce ml-1.5 shadow-[0_0_8px_rgba(0,255,135,0.4)]">⚽ GOAL!</span>
                        ) : isMatchLive ? (
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-neon"></span>
                          </span>
                        ) : null}
                      </span>
                      <span className="text-slate-400 font-mono">{formatDisplayDate(match.date)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 py-1">
                      {/* Home Team */}
                      <div className={`flex items-center gap-1.5 font-bold flex-1 min-w-0 ${isMatchLive ? 'text-sm text-slate-100 font-black' : 'text-xs text-slate-200'}`}>
                        <span className={`shrink-0 ${isMatchLive ? 'text-xl' : 'text-lg'}`}>{home.flag}</span>
                        <ScrollingText text={home.name} className={`${isMatchLive ? 'text-sm text-slate-100 font-black' : 'text-xs text-slate-200'}`} />
                        <FifaRankBadge teamCode={match.home} />
                      </div>

                      {/* Live score / VS */}
                      {isLiveOrDone ? (
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <div className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg font-bold font-mono ${
                            isMatchLive 
                              ? 'bg-brand-neon/20 border border-brand-neon/30 text-brand-neon text-sm' 
                              : 'bg-slate-800/80 border border-slate-700/50 text-slate-330 text-xs'
                          }`}>
                            <span>{match.isCompleted ? match.homeScore : live.homeScore}</span>
                            <span>-</span>
                            <span>{match.isCompleted ? match.awayScore : live.awayScore}</span>
                          </div>
                          <span className={`font-extrabold tracking-wide uppercase ${isMatchLive ? 'text-[9px] text-brand-neon animate-pulse' : 'text-[8px] text-slate-400'}`}>
                            {match.isCompleted ? 'FT' : formatLiveMatchTime(live)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-1 rounded-md font-mono shrink-0">
                          VS
                        </span>
                      )}

                      {/* Away Team */}
                      <div className={`flex items-center gap-1.5 font-bold flex-1 justify-end min-w-0 ${isMatchLive ? 'text-sm text-slate-100 font-black' : 'text-xs text-slate-200'}`}>
                        <FifaRankBadge teamCode={match.away} />
                        <ScrollingText text={away.name} className={`${isMatchLive ? 'text-sm text-slate-100 font-black' : 'text-xs text-slate-200'} text-right justify-end`} />
                        <span className={`shrink-0 ${isMatchLive ? 'text-xl' : 'text-lg'}`}>{away.flag}</span>
                      </div>
                    </div>

                    {/* Live match stats expansion */}
                    {isMatchLive && live.stats && (
                      <div className="mt-2 pt-3 border-t border-slate-800/60 flex flex-col gap-2.5 text-[10px] text-slate-400 font-bold">
                        {/* Possession Row */}
                        {(() => {
                          const [homePoss, awayPoss, contestPoss] = getPossessionWithContest(live.stats.possession, match.id);
                          return (
                            <>
                              <div className="flex justify-between items-center font-mono text-slate-400 text-[9px] font-bold">
                                <span>{home.name}</span>
                                <span className="text-slate-500 font-sans uppercase tracking-wider text-[8px] font-black">POSSESSION</span>
                                <span>{away.name}</span>
                              </div>
                              <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex text-[9px] font-mono font-black text-center relative">
                                <div className="possession-flow-home h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${homePoss}%` }}>
                                  {homePoss}%
                                </div>
                                <div className="bg-slate-700 h-full transition-all duration-500 flex items-center justify-center text-slate-200 font-extrabold whitespace-nowrap" style={{ width: `${contestPoss}%` }}>
                                  {contestPoss}%
                                </div>
                                <div className="possession-flow-away h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${awayPoss}%` }}>
                                  {awayPoss}%
                                </div>
                              </div>
                            </>
                          );
                        })()}

                        {/* Stats Summary Row */}
                        <div className="flex justify-around items-center text-[9px] font-mono text-slate-400 pt-1">
                          <div className="flex items-center gap-2">
                            <span>🎯 Shots:</span>
                            <span className="text-slate-200 font-black">{live.stats.shots?.[0] || 0} - {live.stats.shots?.[1] || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🚩 Corners:</span>
                            <span className="text-slate-200 font-black">{live.stats.corners?.[0] || 0} - {live.stats.corners?.[1] || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⚡ Fouls:</span>
                            <span className="text-slate-200 font-black">{live.stats.fouls?.[0] || 0} - {live.stats.fouls?.[1] || 0}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {upcomingFixtures.length > 3 && (
              <button
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="mt-3 w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-350 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                {showAllUpcoming ? 'View Less' : 'View More'}
              </button>
            )}
          </div>
        </div>

        {/* Right side: Done Matches feed */}
        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6">
          {/* Match Timeline Feed Widget */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Award className="w-4 h-4 text-brand-neon" />
                Done Matches
                <span className="text-[10px] font-mono font-black bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded-md ml-1">{feedMatches.length}</span>
              </h2>
              <p className="text-xs text-slate-400">Timeline of completed tournament fixtures.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[680px] overflow-y-auto pr-1.5 custom-scrollbar">
              {(showAllDone ? feedMatches : feedMatches.slice(0, 3)).map(match => {
                const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
                const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
                return (
                  <div 
                    key={`feed-${match.id}`} 
                    onClick={() => setSelectedMatch(match)}
                    className="p-3 rounded-xl border transition-all bg-slate-950/70 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/50 cursor-pointer flex flex-col gap-2 card-shimmer shrink-0"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded text-[9px]">FT</span>
                        <span className="text-slate-500 font-mono">Group {match.group} • Match {((match.id - 1) % 6) + 1}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">{formatDisplayDate(match.date)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-200">
                      {/* Home */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="shrink-0">{home.flag}</span>
                        <ScrollingText text={home.name} className="text-xs text-slate-200" />
                        <FifaRankBadge teamCode={match.home} />
                      </div>

                      {/* Scores */}
                      <div className="px-2.5 py-0.5 bg-slate-950 rounded border border-slate-900 font-extrabold font-mono text-xs min-w-[40px] text-center shrink-0">
                        <span className="text-brand-neon">{match.homeScore} - {match.awayScore}</span>
                      </div>

                      {/* Away */}
                      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                        <FifaRankBadge teamCode={match.away} />
                        <ScrollingText text={away.name} className="text-xs text-slate-200 text-right justify-end" />
                        <span className="shrink-0">{away.flag}</span>
                      </div>
                    </div>

                    {/* Highlights Button */}
                    {(() => {
                      const url = highlightsMap[match.id];
                      const isLoading = loadingHighlightsMap[match.id];
                      if (isLoading) {
                        return (
                          <div className="mt-1 py-1.5 rounded-lg bg-slate-950/80 border border-slate-900/40 text-[9px] font-bold text-slate-600 flex items-center justify-center gap-1.5 select-none">
                            <span className="w-2.5 h-2.5 border border-slate-700 border-t-red-500 rounded-full animate-spin"></span>
                            <span>Searching highlights...</span>
                          </div>
                        );
                      }
                      if (url) {
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="mt-1 w-full py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500/40 text-[10px] font-black text-white flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer select-none"
                          >
                            <svg className="w-2.5 h-2.5 fill-white shrink-0" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>Watch Highlights ↗</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>
            {feedMatches.length > 3 && (
              <button
                onClick={() => setShowAllDone(!showAllDone)}
                className="mt-3 w-full py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-350 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                {showAllDone ? 'View Less' : 'View More'}
              </button>
            )}
          </div>
        </div>
      </div>
      

    </div>
  );
};
