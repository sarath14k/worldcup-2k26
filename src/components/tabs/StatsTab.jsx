import { TEAMS } from '../../data/worldcupData';
import { WorldCupTrophyIcon, GoldenBootTrophyIcon, PlaymakerIcon } from '../../utils/matchHelpers';
import { ScrollingText } from '../ScrollingText';

export const StatsTab = ({ playerStats }) => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      {/* Header info */}
      <div className="p-4 rounded-2xl bg-brand-cardBg border border-slate-800/80">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <WorldCupTrophyIcon className="w-5 h-5 text-brand-gold" />
          Tournament Player Statistics
        </h2>
        <p className="text-xs text-slate-400">
          Track the tournament's top goal scorers and playmakers in real time. Stats automatically accumulate across all completed and simulated matches.
        </p>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Scorers Table */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
            <GoldenBootTrophyIcon className="w-5 h-5 text-brand-gold" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Golden Boot (Top Scorers)
            </h3>
          </div>
          
          {playerStats.topScorers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-medium">
              No goals recorded yet. Simulate or complete matches to update standings!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">
                <span className="col-span-2">Rank</span>
                <span className="col-span-7">Player</span>
                <span className="col-span-3 text-right">Goals</span>
              </div>
              {playerStats.topScorers.map((player, idx) => (
                <div 
                  key={player.name} 
                  className="grid grid-cols-12 items-center bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 text-xs font-bold text-slate-200 hover:border-brand-neon/30 transition-all"
                >
                  <div className="col-span-2 flex justify-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded font-black text-[9px] border ${
                      idx === 0 
                        ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
                        : idx === 1 
                          ? 'bg-slate-400/10 border-slate-400/30 text-slate-350' 
                          : idx === 2 
                            ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                  </div>
                  {(() => {
                    const teamInfo = TEAMS[player.team] || { name: player.team, flag: '🏳️' };
                    return (
                      <div className="col-span-7 flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono shrink-0">
                          {player.team}
                        </span>
                        <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                          {teamInfo.flag}
                        </span>
                        <ScrollingText text={player.name} className="text-slate-100 ml-1" />
                      </div>
                    );
                  })()}
                  <span className="col-span-3 text-right text-brand-neon font-black text-sm">
                    {player.goals}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Assists Table */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
            <PlaymakerIcon className="w-5 h-5 text-brand-neon" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Playmakers (Top Assists)
            </h3>
          </div>

          {playerStats.topAssists.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-medium">
              No assists recorded yet. Simulate or complete matches to update standings!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">
                <span className="col-span-2">Rank</span>
                <span className="col-span-7">Player</span>
                <span className="col-span-3 text-right">Assists</span>
              </div>
              {playerStats.topAssists.map((player, idx) => (
                <div 
                  key={player.name} 
                  className="grid grid-cols-12 items-center bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 text-xs font-bold text-slate-200 hover:border-brand-neon/30 transition-all"
                >
                  <div className="col-span-2 flex justify-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded font-black text-[9px] border ${
                      idx === 0 
                        ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
                        : idx === 1 
                          ? 'bg-slate-400/10 border-slate-400/30 text-slate-350' 
                          : idx === 2 
                            ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                  </div>
                  {(() => {
                    const teamInfo = TEAMS[player.team] || { name: player.team, flag: '🏳️' };
                    return (
                      <div className="col-span-7 flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono shrink-0">
                          {player.team}
                        </span>
                        <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                          {teamInfo.flag}
                        </span>
                        <ScrollingText text={player.name} className="text-slate-100 ml-1" />
                      </div>
                    );
                  })()}
                  <span className="col-span-3 text-right text-brand-purple font-black text-sm">
                    {player.assists}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Rated Players Table */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
            <span className="text-base select-none">⭐</span>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              FotMob Player Ratings
            </h3>
          </div>

          {!playerStats.topRatings || playerStats.topRatings.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-medium">
              No ratings recorded yet. Simulate or complete matches to update player performance ratings!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2">
                <span className="col-span-2">Rank</span>
                <span className="col-span-7">Player</span>
                <span className="col-span-3 text-right">Rating</span>
              </div>
              {playerStats.topRatings.map((player, idx) => (
                <div 
                  key={player.name} 
                  className="grid grid-cols-12 items-center bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 text-xs font-bold text-slate-200 hover:border-brand-neon/30 transition-all"
                >
                  <div className="col-span-2 flex justify-start">
                    <div className={`flex items-center justify-center w-5 h-5 rounded font-black text-[9px] border ${
                      idx === 0 
                        ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
                        : idx === 1 
                          ? 'bg-slate-400/10 border-slate-400/30 text-slate-350' 
                          : idx === 2 
                            ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                  </div>
                  {(() => {
                    const teamInfo = TEAMS[player.team] || { name: player.team, flag: '🏳️' };
                    return (
                      <div className="col-span-7 flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono shrink-0">
                          {player.team}
                        </span>
                        <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                          {teamInfo.flag}
                        </span>
                        <ScrollingText text={player.name} className="text-slate-100 ml-1" />
                      </div>
                    );
                  })()}
                  <span className="col-span-3 text-right flex justify-end">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-black text-[10px] ${
                      player.rating >= 7.5 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : player.rating >= 6.0 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {player.rating.toFixed(2)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
