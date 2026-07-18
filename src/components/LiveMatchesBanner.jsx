import { memo } from 'react';
import { TEAMS } from '../data/worldcupData';
import { ScrollingText } from './ScrollingText';
import { FifaRankBadge } from '../utils/matchHelpers';

const ROUND_NAMES = {
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-final',
  sf: 'Semi-final',
  bronze: 'Bronze Final',
  final: 'Final'
};

const getRoundName = (match) => {
  if (!match) return null;
  const key = String(match.id).split('_')[0];
  return ROUND_NAMES[key] || null;
};

export const LiveMatchesList = memo(({ activeLiveMatchesList, setSelectedMatch, activeGoalFlashMatchIds = [] }) => {
  return (
    <div className="flex flex-col gap-3.5 mt-4 w-full">
      {activeLiveMatchesList.map(live => {
        const homeTeam = TEAMS[live.home] || { flag: '🏳️', name: live.home || 'TBD' };
        const awayTeam = TEAMS[live.away] || { flag: '🏳️', name: live.away || 'TBD' };
        const isFlashing = activeGoalFlashMatchIds.includes(String(live.id));
        const match = live.originalMatch;
        const isGroup = match?.type === 'group';
        const matchLabel = isGroup 
          ? `Group ${match.group} • Match ${(match.id && !isNaN(match.id) ? ((match.id - 1) % 6) + 1 : match.id)}`
          : (getRoundName(match) || match?.title || `${match?.round || live.round || 'Knockout'} • Match ${match?.id || live.id}`);

        return (
          <div 
            key={live.id} 
            onClick={() => setSelectedMatch(live.originalMatch)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMatch(live.originalMatch); } }}
            role="button"
            tabIndex={0}
            title="Click to view live stats & timeline commentary"
            className={`p-4 sm:p-5 rounded-2xl bg-slate-950/80 border shadow-glass group w-full transition-all duration-300 ${
              isFlashing 
                ? 'animate-goalFlash' 
                : 'border-slate-900/80 hover:border-brand-neon/60 hover:bg-slate-900/30 cursor-pointer select-none'
            }`}
          >
            {/* Mobile Layout (Stacked Vertically) */}
            <div className="flex sm:hidden flex-col gap-3">
              {/* Header: Live status */}
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-brand-neon tracking-wider uppercase animate-pulse">
                    LIVE {live.minute}'
                  </span>
                  {isFlashing && (
                    <span className="bg-brand-neon text-slate-950 text-[8px] px-1 py-0.5 rounded font-black animate-bounce shadow-[0_0_8px_rgba(0,255,135,0.4)]">⚽ GOAL!</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
                  {matchLabel}
                </span>
              </div>

              {/* Rows for teams */}
              <div className="flex flex-col gap-2.5 py-0.5">
                {/* Home Team */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 font-extrabold text-slate-100 text-sm min-w-0 flex-1">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{homeTeam.flag}</span>
                    <div className="max-w-[130px] sm:max-w-[170px] overflow-hidden min-w-0 flex-1">
                      <ScrollingText text={homeTeam.name} className="uppercase tracking-wide text-slate-100" />
                    </div>
                    <FifaRankBadge teamCode={live.home} />
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900/80 border border-brand-neon/20 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-neon shrink-0 ml-2">
                    {live.homeScore}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 font-extrabold text-slate-100 text-sm min-w-0 flex-1">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{awayTeam.flag}</span>
                    <div className="max-w-[130px] sm:max-w-[170px] overflow-hidden min-w-0 flex-1">
                      <ScrollingText text={awayTeam.name} className="uppercase tracking-wide text-slate-100" />
                    </div>
                    <FifaRankBadge teamCode={live.away} />
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900/80 border border-brand-neon/20 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-neon shrink-0 ml-2">
                    {live.awayScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (Side-by-Side Horizontal) */}
            <div className="hidden sm:flex items-center justify-between gap-4 w-full">
              {/* Live Indicator & Status */}
              <div className="flex flex-col items-start gap-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-3 py-1 rounded-xl font-black tracking-widest uppercase animate-pulse">
                    LIVE {live.minute}'
                  </span>
                  {isFlashing && (
                    <span className="bg-brand-neon text-slate-950 text-[9px] px-1.5 py-0.5 rounded-lg font-black animate-bounce shadow-[0_0_8px_rgba(0,255,135,0.4)] ml-2">⚽ GOAL!</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-mono mt-0.5">
                  {matchLabel}
                </span>
              </div>

              {/* Teams & Score Row */}
              <div className="flex items-center justify-between gap-4 md:gap-8 flex-1">
                {/* Home Team */}
                <div className="flex items-center gap-2 font-extrabold text-slate-100 sm:text-base md:text-lg justify-end flex-1 min-w-0">
                  <FifaRankBadge teamCode={live.home} />
                  <div className="max-w-[140px] md:max-w-[200px] overflow-hidden shrink-0">
                    <ScrollingText text={homeTeam.name} className="uppercase tracking-wide text-slate-100 text-right justify-end" />
                  </div>
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{homeTeam.flag}</span>
                </div>

                {/* Big Score Box */}
                <div className="text-brand-neon font-black px-5 py-2 sm:px-6 sm:py-2.5 bg-slate-900/80 border border-brand-neon/20 rounded-2xl text-lg sm:text-xl md:text-2xl font-mono shadow-neon group-hover:scale-105 transition-transform shrink-0 tracking-wider">
                  {live.homeScore} <span className="text-slate-600 font-normal px-0.5">:</span> {live.awayScore}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-2 font-extrabold text-slate-100 sm:text-base md:text-lg flex-1 min-w-0">
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{awayTeam.flag}</span>
                  <div className="max-w-[140px] md:max-w-[200px] overflow-hidden shrink-0">
                    <ScrollingText text={awayTeam.name} className="uppercase tracking-wide text-slate-100" />
                  </div>
                  <FifaRankBadge teamCode={live.away} />
                </div>
              </div>

              {/* Click to expand hint for accessibility */}
              <div className="hidden lg:flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest gap-1 group-hover:text-brand-neon transition-colors shrink-0">
                <span>Stats</span>
                <span>→</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export const LiveMatchesBanner = memo(({ hasLiveMatches, activeLiveMatchesList, setSelectedMatch, activeGoalFlashMatchIds = [] }) => {
  if (!hasLiveMatches || activeLiveMatchesList.length === 0) return null;

  return (
    <div className="mb-6 animate-fadeIn w-full">
      <LiveMatchesList 
        activeLiveMatchesList={activeLiveMatchesList} 
        setSelectedMatch={setSelectedMatch} 
        activeGoalFlashMatchIds={activeGoalFlashMatchIds}
      />
    </div>
  );
});
