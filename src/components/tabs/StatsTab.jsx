import { useState, useMemo } from 'react';
import { TEAMS } from '../../data/worldcupData';
import { WorldCupTrophyIcon, GoldenBootTrophyIcon, PlaymakerIcon } from '../../utils/matchHelpers';
import { ScrollingText } from '../ScrollingText';
import { PlayerAvatar } from '../PlayerAvatar';
import { PlayerDetailModal } from '../PlayerDetailModal';
import { getPositionLabel, getPositionCategory, getCategoryColor, normalizePosition } from '../../utils/positions';
import playerDetails from '../../data/fotmobPlayerDetails.json';

export const StatsTab = ({ playerStats, fotmobRatings }) => {
  const [activeSubTab, setActiveSubTab] = useState('scorers');
  const [detailPlayer, setDetailPlayer] = useState(null);

  const playerIdLookup = useMemo(() => {
    const map = {};
    (fotmobRatings || []).forEach(p => { if (p.playerId) map[p.name] = p.playerId; });
    Object.entries(playerDetails).forEach(([id, p]) => { if (p.name && !map[p.name]) map[p.name] = id; });
    return map;
  }, [fotmobRatings]);

  const positionLookup = useMemo(() => {
    const map = {};
    (fotmobRatings || []).forEach(p => {
      if (p.name && p.position) {
        const code = normalizePosition(p.position);
        if (code != null) map[p.name] = code;
      }
    });
    Object.values(playerDetails).forEach(p => {
      if (p.name && p.position) {
        const code = normalizePosition(p.position);
        if (code != null && !map[p.name]) map[p.name] = code;
      }
    });
    return map;
  }, [fotmobRatings]);

  return (
    <><div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
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

      {/* Sub Tab Switcher */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/40 w-full sm:w-fit self-center select-none">
        <button
          onClick={() => setActiveSubTab('scorers')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none w-full sm:w-auto ${
            activeSubTab === 'scorers'
              ? 'bg-brand-neon text-slate-950 shadow-neon font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <GoldenBootTrophyIcon className={`w-4 h-4 ${activeSubTab === 'scorers' ? 'text-slate-950' : 'text-brand-gold'}`} />
          <span>Golden Boot (Goals)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('assists')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none w-full sm:w-auto ${
            activeSubTab === 'assists'
              ? 'bg-brand-neon text-slate-950 shadow-neon font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <PlaymakerIcon className={`w-4 h-4 ${activeSubTab === 'assists' ? 'text-slate-950' : 'text-brand-neon'}`} />
          <span>Playmakers (Assists)</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full max-w-2xl mx-auto">
        {activeSubTab === 'scorers' ? (
          /* Top Scorers Table */
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col animate-fadeIn">
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
                        <div className="col-span-7 flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => { const pid = player.playerId || playerIdLookup[player.name]; if (pid) setDetailPlayer({ id: pid, name: player.name }); }}>
                          <PlayerAvatar name={player.name} size="xl" playerId={player.playerId || playerIdLookup[player.name]} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                          <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono shrink-0">
                            {player.team}
                          </span>
                          <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                            {teamInfo.flag}
                          </span>
                          <ScrollingText text={player.name} className="text-slate-100 ml-1" />
                          {(() => {
                            const posCode = positionLookup[player.name];
                            const posLabel = getPositionLabel(posCode);
                            const posCat = getPositionCategory(posCode);
                            return posLabel ? (
                              <span className={`text-[7px] font-mono font-black px-1 py-0.5 rounded-full border shrink-0 leading-none ${getCategoryColor(posCat)}`}>
                                {posLabel}
                              </span>
                            ) : null;
                          })()}
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
        ) : (
          /* Top Assists Table */
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col animate-fadeIn">
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
                        <div className="col-span-7 flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => { const pid = player.playerId || playerIdLookup[player.name]; if (pid) setDetailPlayer({ id: pid, name: player.name }); }}>
                          <PlayerAvatar name={player.name} size="xl" playerId={player.playerId || playerIdLookup[player.name]} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                          <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono shrink-0">
                            {player.team}
                          </span>
                          <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                            {teamInfo.flag}
                          </span>
                          <ScrollingText text={player.name} className="text-slate-100 ml-1" />
                          {(() => {
                            const posCode = positionLookup[player.name];
                            const posLabel = getPositionLabel(posCode);
                            const posCat = getPositionCategory(posCode);
                            return posLabel ? (
                              <span className={`text-[7px] font-mono font-black px-1 py-0.5 rounded-full border shrink-0 leading-none ${getCategoryColor(posCat)}`}>
                                {posLabel}
                              </span>
                            ) : null;
                          })()}
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
        )}
      </div>
    </div>

    {detailPlayer && (
      <PlayerDetailModal playerId={detailPlayer.id} name={detailPlayer.name} onClose={() => setDetailPlayer(null)} />
    )}</>
  );
};
