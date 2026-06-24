import { TEAMS } from '../data/worldcupData';
import { ScrollingText } from './ScrollingText';

export const LiveMatchesList = ({ activeLiveMatchesList, setSelectedMatch }) => {
  return (
    <div className="flex flex-col gap-3.5 mt-4 w-full">
      {activeLiveMatchesList.map(live => {
        const homeTeam = TEAMS[live.home] || { flag: '🏳️', name: live.home || 'TBD' };
        const awayTeam = TEAMS[live.away] || { flag: '🏳️', name: live.away || 'TBD' };
        return (
          <div 
            key={live.id} 
            onClick={() => setSelectedMatch(live.originalMatch)}
            title="Click to view live stats & timeline commentary"
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-900/80 hover:border-brand-neon/60 hover:bg-slate-900/30 cursor-pointer select-none transition-all duration-300 shadow-glass group w-full"
          >
            {/* Mobile Layout (Stacked Vertically) */}
            <div className="flex sm:hidden flex-col gap-3">
              {/* Header: Live status */}
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-brand-neon tracking-wider uppercase animate-pulse">
                    LIVE {live.minute}'
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
                  Match {live.id}
                </span>
              </div>

              {/* Rows for teams */}
              <div className="flex flex-col gap-2.5 py-0.5">
                {/* Home Team */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 font-extrabold text-slate-100 text-sm min-w-0 flex-1">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{homeTeam.flag}</span>
                    <div className="max-w-[200px] overflow-hidden flex-1">
                      <ScrollingText text={homeTeam.name} className="uppercase tracking-wide text-slate-100" />
                    </div>
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900/80 border border-brand-neon/20 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-neon">
                    {live.homeScore}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 font-extrabold text-slate-100 text-sm min-w-0 flex-1">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{awayTeam.flag}</span>
                    <div className="max-w-[200px] overflow-hidden flex-1">
                      <ScrollingText text={awayTeam.name} className="uppercase tracking-wide text-slate-100" />
                    </div>
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900/80 border border-brand-neon/20 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-neon">
                    {live.awayScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (Side-by-Side Horizontal) */}
            <div className="hidden sm:flex items-center justify-between gap-4 w-full">
              {/* Live Indicator & Status */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-3 py-1 rounded-xl font-black tracking-widest uppercase animate-pulse">
                  LIVE {live.minute}'
                </span>
              </div>

              {/* Teams & Score Row */}
              <div className="flex items-center justify-between gap-4 md:gap-8 flex-1">
                {/* Home Team */}
                <div className="flex items-center gap-3 font-extrabold text-slate-100 sm:text-base md:text-lg justify-end flex-1 min-w-0">
                  <ScrollingText text={homeTeam.name} className="uppercase tracking-wide text-slate-100 text-right justify-end" />
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{homeTeam.flag}</span>
                </div>

                {/* Big Score Box */}
                <div className="text-brand-neon font-black px-5 py-2 sm:px-6 sm:py-2.5 bg-slate-900/80 border border-brand-neon/20 rounded-2xl text-lg sm:text-xl md:text-2xl font-mono shadow-neon group-hover:scale-105 transition-transform shrink-0 tracking-wider">
                  {live.homeScore} <span className="text-slate-600 font-normal px-0.5">:</span> {live.awayScore}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 font-extrabold text-slate-100 sm:text-base md:text-lg flex-1 min-w-0">
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{awayTeam.flag}</span>
                  <ScrollingText text={awayTeam.name} className="uppercase tracking-wide text-slate-100" />
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
};

export const LiveMatchesBanner = ({ hasLiveMatches, activeLiveMatchesList, setSelectedMatch }) => {
  if (!hasLiveMatches || activeLiveMatchesList.length === 0) return null;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-900 flex flex-col gap-4 relative overflow-hidden shadow-glass group/live animate-fadeIn">
      {/* Glow accent */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-neon/5 rounded-full blur-3xl pointer-events-none group-hover/live:bg-brand-neon/10 transition-colors duration-500" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 w-full">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Pulsating Signal Radar Icon */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border border-slate-800/80 shrink-0">
            <span className="absolute inline-flex h-7 w-7 rounded-full opacity-75 animate-ping bg-brand-neon/20"></span>
            <span className="absolute inline-flex h-4 w-4 rounded-full opacity-40 animate-pulse bg-brand-neon/30"></span>
            <span className="relative w-2.5 h-2.5 rounded-full bg-brand-neon shadow-neon"></span>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-widest">
                Live Scores Feed
              </h2>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-brand-neon/10 border-brand-neon/40 text-brand-neon animate-pulse">
                STATUS: ACTIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 leading-relaxed">
              Real-time FIFA World Cup match statistics and events are streaming.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900/60 pt-4 relative z-10 w-full">
        <LiveMatchesList 
          activeLiveMatchesList={activeLiveMatchesList} 
          setSelectedMatch={setSelectedMatch} 
        />
      </div>
    </div>
  );
};
