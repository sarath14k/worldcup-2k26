import { TEAMS } from '../data/worldcupData';

export const LiveMatchesList = ({ activeLiveMatchesList, setSelectedMatch }) => {
  return (
    <div className="flex flex-wrap gap-2.5 mt-2">
      {activeLiveMatchesList.map(live => {
        const homeTeam = TEAMS[live.home] || { flag: '🏳️', name: live.home || 'TBD' };
        const awayTeam = TEAMS[live.away] || { flag: '🏳️', name: live.away || 'TBD' };
        return (
          <div 
            key={live.id} 
            onClick={() => setSelectedMatch(live.originalMatch)}
            title="Click to view live stats & timeline commentary"
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 text-[10px] sm:text-xs font-mono font-bold text-slate-200 cursor-pointer select-none transition-all"
          >
            <span className="text-[8px] bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-1.5 py-0.5 rounded font-black shrink-0">
              {live.minute}'
            </span>
            <span className="flex items-center gap-1 font-bold">
              <span>{homeTeam.flag}</span>
              <span className="text-slate-100">{live.home}</span>
            </span>
            <span className="text-brand-neon font-black px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800/80">
              {live.homeScore} - {live.awayScore}
            </span>
            <span className="flex items-center gap-1 font-bold">
              <span className="text-slate-100">{live.away}</span>
              <span>{awayTeam.flag}</span>
            </span>
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
