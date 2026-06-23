import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { GROUPS, TEAMS } from '../../data/worldcupData';
import { formatDisplayDate, formatLiveMatchTime } from '../../utils/matchHelpers';
import { ScrollingText } from '../ScrollingText';

export const GroupsTab = ({ 
  groupMatches, 
  standings, 
  advancedTeams, 
  liveMatches, 
  isLiveMatch, 
  setSelectedMatch 
}) => {
  const [expandedGroup, setExpandedGroup] = useState('A');

  const handlePrevGroup = () => {
    const currentIndex = GROUPS.indexOf(expandedGroup);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + GROUPS.length) % GROUPS.length;
    setExpandedGroup(GROUPS[prevIndex]);
  };

  const handleNextGroup = () => {
    const currentIndex = GROUPS.indexOf(expandedGroup);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % GROUPS.length;
    setExpandedGroup(GROUPS[nextIndex]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 animate-fadeIn">
      {/* Left side: Detailed Group standings */}
      <div className="lg:col-span-3 flex flex-col gap-4 sm:gap-6">
        {/* Standings Table for selected group */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 flex flex-col gap-4">
          
          {/* Small A B C D ... Tabs to filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-900/60 z-10 relative">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest shrink-0 mr-2">Filter Group:</span>
            <div className="flex gap-1.5">
              {GROUPS.map(g => {
                const isActive = expandedGroup === g;
                return (
                  <button
                    key={g}
                    onClick={() => setExpandedGroup(g)}
                    className={`w-7.5 h-7.5 rounded-lg font-black text-xs transition-all flex items-center justify-center border select-none cursor-pointer ${
                      isActive
                        ? 'border-brand-neon bg-brand-neon/15 text-brand-neon shadow-neon ring-1 ring-brand-neon/20'
                        : 'border-slate-900/60 bg-slate-950/45 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-lg font-bold text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrevGroup}
                className="p-1.5 rounded-lg bg-slate-900/85 border border-slate-800 text-slate-400 hover:text-brand-neon hover:border-brand-neon/50 hover:shadow-[0_0_8px_rgba(0,255,135,0.15)] transition-all flex items-center justify-center select-none cursor-pointer"
                title="Previous Group"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-350">
                Group {expandedGroup}
              </span>
              <button 
                onClick={handleNextGroup}
                className="p-1.5 rounded-lg bg-slate-900/85 border border-slate-800 text-slate-400 hover:text-brand-neon hover:border-brand-neon/50 hover:shadow-[0_0_8px_rgba(0,255,135,0.15)] transition-all flex items-center justify-center select-none cursor-pointer"
                title="Next Group"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-400">Tie-breakers: Points, GD, GF</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-950/30">
                  <th className="py-2.5 px-2 font-extrabold text-center w-12">POS</th>
                  <th className="py-2.5 px-2 font-extrabold text-left">TEAM</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-10">P</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-10">W</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-10">D</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-10">L</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-12">GD</th>
                  <th className="py-2.5 px-2 font-extrabold text-center w-14 text-brand-neon">PTS</th>
                  <th className="py-2.5 px-2 font-extrabold text-center hidden md:table-cell w-32">FORM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(standings[expandedGroup] || []).map((t, index) => {
                  const isQualifying = index < 2;
                  const isBestThird = index === 2 && advancedTeams.thirds.some(th => th.code === t.code);
                  return (
                    <tr key={t.code} className="hover:bg-slate-900/15 transition-colors duration-150 group">
                      <td className="py-3 px-2 text-center">
                        <div className={`flex items-center justify-center w-6 h-6 mx-auto rounded-lg font-black text-[10px] border transition-all duration-300 ${
                          index === 0 
                            ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold shadow-[0_0_8px_rgba(251,191,36,0.1)]' 
                            : index === 1 
                              ? 'bg-slate-400/10 border-slate-400/30 text-slate-350 shadow-[0_0_8px_rgba(148,163,184,0.1)]' 
                              : index === 2 
                                ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                                : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0 filter drop-shadow-sm">{t.flag}</span>
                          <div className="max-w-[100px] sm:max-w-[160px] overflow-hidden flex-1">
                            <ScrollingText text={t.name} className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors" />
                          </div>
                          {isQualifying && <span className="text-[7px] sm:text-[8px] bg-brand-neon/10 border border-brand-neon/40 text-brand-neon px-1 rounded leading-none py-0.5 font-extrabold shrink-0 uppercase tracking-wide">R32</span>}
                          {isBestThird && <span className="text-[7px] sm:text-[8px] bg-brand-royal/10 border border-brand-royal/40 text-brand-royal px-1 rounded leading-none py-0.5 font-extrabold shrink-0 uppercase tracking-wide">R32 *</span>}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono font-medium">{t.played}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono font-medium">{t.won}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono font-medium">{t.drawn}</td>
                      <td className="py-3 px-2 text-center text-slate-400 font-mono font-medium">{t.lost}</td>
                      <td className={`py-3 px-2 text-center font-mono font-semibold ${t.gd > 0 ? 'text-brand-neon' : t.gd < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {t.gd > 0 ? `+${t.gd}` : t.gd}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-black text-sm text-brand-neon bg-brand-neon/5">{t.points}</td>
                      <td className="py-3 px-2 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 select-none">
                          {(t.form || []).map((res, i) => (
                            <span
                              key={i}
                              title={res === 'W' ? 'Won' : res === 'D' ? 'Draw' : 'Lost'}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${
                                res === 'W'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : res === 'L'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                          {(!t.form || t.form.length === 0) && <span className="text-slate-600 text-[10px]">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right side: Group match schedule */}
      <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
        {/* Match list for selected group */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80">
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-neon" />
            Group {expandedGroup} Match Schedule
          </h3>

          <div className="flex flex-col gap-3.5">
            {groupMatches.filter(m => m.group === expandedGroup).map(match => {
              const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
              const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
              const live = liveMatches[match.id];
              const isMatchLive = isLiveMatch(live);
              return (
                <div 
                  key={match.id} 
                  onClick={() => setSelectedMatch(match)}
                  className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/30 cursor-pointer transition-all flex flex-col gap-2 card-shimmer"
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                    <span>MATCH {match.id}</span>
                    {match.isCompleted ? (
                      <span className="text-brand-neon bg-brand-neon/10 border border-brand-neon/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold font-mono">FT</span>
                    ) : (
                      <span>{formatDisplayDate(match.date)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 justify-between">
                    {/* Home Row */}
                    <div className={`flex items-center gap-2 font-bold text-xs text-slate-200 flex-1 min-w-0 ${match.isCompleted ? 'opacity-85' : ''}`}>
                      <span className="shrink-0">{home.flag}</span>
                      <ScrollingText text={home.name} className="text-xs text-slate-200" />
                    </div>
                    
                    {/* Score display */}
                    <div className="flex items-center gap-1.5 justify-center min-w-[70px]">
                      {match.isCompleted ? (
                        <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-brand-neon font-mono font-black">
                          <span>{match.homeScore}</span>
                          <span className="text-slate-600">:</span>
                          <span>{match.awayScore}</span>
                        </div>
                      ) : isMatchLive ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center justify-center gap-1.5 px-2.5 py-0.5 bg-brand-neon/20 border border-brand-neon/30 rounded-lg text-xs font-bold text-brand-neon font-mono">
                            <span>{live.homeScore}</span>
                            <span className="text-brand-neon/60">:</span>
                            <span>{live.awayScore}</span>
                          </div>
                          <span className="text-[7px] font-extrabold text-brand-neon tracking-wide flex items-center gap-0.5 animate-pulse font-mono">
                            {formatLiveMatchTime(live)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-slate-500 px-3 py-1 rounded-md font-mono shrink-0">
                          VS
                        </span>
                      )}
                    </div>

                    {/* Away Row */}
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-200 flex-1 justify-end min-w-0">
                      <ScrollingText text={away.name} className="text-xs text-slate-200 text-right justify-end" />
                      <span className="shrink-0">{away.flag}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
