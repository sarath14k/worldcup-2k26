import { TEAMS } from '../data/worldcupData';

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
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-850 hover:border-brand-neon/60 hover:bg-slate-900/30 cursor-pointer select-none transition-all duration-300 shadow-glass group w-full"
          >
            {/* Mobile Layout (Stacked Vertically) */}
            <div className="flex sm:hidden flex-col gap-3">
              {/* Header: Live status */}
              <div className="flex justify-between items-center border-b border-slate-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon"></span>
                  </span>
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
                  <div className="flex items-center gap-3 font-extrabold text-slate-100 text-sm">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{homeTeam.flag}</span>
                    <span className="uppercase tracking-wide truncate max-w-[200px]">{homeTeam.name}</span>
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900 border border-slate-800/80 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-inner">
                    {live.homeScore}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 font-extrabold text-slate-100 text-sm">
                    <span className="text-2xl shrink-0 drop-shadow-sm">{awayTeam.flag}</span>
                    <span className="uppercase tracking-wide truncate max-w-[200px]">{awayTeam.name}</span>
                  </div>
                  <div className="text-brand-neon font-black font-mono text-sm bg-slate-900 border border-slate-800/80 px-3 py-1 rounded-xl min-w-[38px] text-center shadow-inner">
                    {live.awayScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (Side-by-Side Horizontal) */}
            <div className="hidden sm:flex items-center justify-between gap-4 w-full">
              {/* Live Indicator & Status */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon"></span>
                </span>
                <span className="text-xs bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-3 py-1 rounded-xl font-black tracking-widest uppercase animate-pulse">
                  LIVE {live.minute}'
                </span>
              </div>

              {/* Teams & Score Row */}
              <div className="flex items-center justify-between gap-4 md:gap-8 flex-1">
                {/* Home Team */}
                <div className="flex items-center gap-3 font-extrabold text-slate-100 sm:text-base md:text-lg justify-end flex-1 truncate">
                  <span className="truncate uppercase tracking-wide">{homeTeam.name}</span>
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{homeTeam.flag}</span>
                </div>

                {/* Big Score Box */}
                <div className="text-brand-neon font-black px-5 py-2 sm:px-6 sm:py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-lg sm:text-xl md:text-2xl font-mono shadow-inner group-hover:scale-105 transition-transform shrink-0 tracking-wider">
                  {live.homeScore} <span className="text-slate-600 font-normal px-0.5">:</span> {live.awayScore}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 font-extrabold text-slate-100 sm:text-base md:text-lg flex-1 truncate">
                  <span className="text-2xl sm:text-3xl shrink-0 drop-shadow">{awayTeam.flag}</span>
                  <span className="truncate uppercase tracking-wide">{awayTeam.name}</span>
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
    <div className="mb-6 p-4 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden animate-fadeIn">
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-brand-neon/5 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10 w-full">
        <span className="flex h-3 w-3 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon animate-pulse"></span>
        </span>
        <div className="w-full">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            LIVE MATCH TRACKER ACTIVE
          </h2>
          <LiveMatchesList 
            activeLiveMatchesList={activeLiveMatchesList} 
            setSelectedMatch={setSelectedMatch} 
          />
        </div>
      </div>
    </div>
  );
};
