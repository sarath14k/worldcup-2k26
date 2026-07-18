import { useState, useMemo, memo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { GROUPS, TEAMS } from '../../data/worldcupData';
import { formatDisplayDate, formatLiveMatchTime, FifaRankBadge } from '../../utils/matchHelpers';
import { ScrollingText } from '../ScrollingText';

export const GroupsTab = memo(({ 
  groupMatches, 
  standings, 
  advancedTeams, 
  liveMatches, 
  isLiveMatch, 
  setSelectedMatch 
}) => {
  const [expandedGroup, setExpandedGroup] = useState('A');
  const [selectedTeamCode, setSelectedTeamCode] = useState(null);

  const groupsPlayed = useMemo(() => {
    const map = {};
    GROUPS.forEach(g => { map[g] = { played: 0, total: 6 }; });
    (groupMatches || []).forEach(m => {
      if (m.group && m.isCompleted) {
        map[m.group] = map[m.group] || { played: 0, total: 6 };
        map[m.group].played++;
      }
    });
    return map;
  }, [groupMatches]);

  const handlePrevGroup = () => {
    setSelectedTeamCode(null);
    const currentIndex = GROUPS.indexOf(expandedGroup);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + GROUPS.length) % GROUPS.length;
    setExpandedGroup(GROUPS[prevIndex]);
  };

  const handleNextGroup = () => {
    setSelectedTeamCode(null);
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
          <div className="flex flex-col gap-2 pb-3 border-b border-slate-900/60 z-10 relative">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {GROUPS.map(g => {
                const isActive = expandedGroup === g;
                const prog = groupsPlayed[g] || { played: 0, total: 6 };
                const isDone = prog.played >= prog.total;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      setExpandedGroup(g);
                      setSelectedTeamCode(null);
                    }}
                    className={`h-8 rounded-lg font-black text-xs transition-all flex items-center justify-center border select-none cursor-pointer relative ${
                      isActive
                        ? 'border-brand-neon bg-brand-neon/15 text-brand-neon shadow-neon ring-1 ring-brand-neon/20'
                        : 'border-slate-900/60 bg-slate-950/45 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {g}
                    <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-mono font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full leading-none ${
                      isDone
                        ? 'bg-brand-neon text-slate-950'
                        : prog.played > 0
                          ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                          : 'bg-slate-800 text-slate-600'
                    }`}>
                      {isDone ? '✓' : prog.played || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevGroup}
                className="p-1 text-slate-400 hover:text-brand-neon hover:scale-110 active:scale-95 transition-all flex items-center justify-center select-none cursor-pointer bg-transparent border-0"
                title="Previous Group"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-extrabold tracking-wide text-white text-base sm:text-lg px-1">
                Group {expandedGroup}
              </span>
              <button 
                onClick={handleNextGroup}
                className="p-1 text-slate-400 hover:text-brand-neon hover:scale-110 active:scale-95 transition-all flex items-center justify-center select-none cursor-pointer bg-transparent border-0"
                title="Next Group"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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
                  <th className="py-2.5 px-2 font-extrabold text-center w-24 sm:w-32">FORM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {(standings[expandedGroup] || []).map((t, index) => {
                  const isQualifying = index < 2;
                  const isBestThird = index === 2 && advancedTeams.thirds.some(th => th.code === t.code);
                  const isSelected = selectedTeamCode === t.code;
                  return (
                    <tr 
                      key={t.code} 
                      onClick={() => setSelectedTeamCode(isSelected ? null : t.code)}
                      className={`animate-stagger hover:bg-slate-900/20 cursor-pointer transition-colors duration-150 group select-none ${
                        isSelected ? 'bg-brand-neon/5' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-3 px-2 text-center relative">
                        {/* Qualification Accent Indicator Bar */}
                        <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md transition-all duration-350 ${
                          isQualifying 
                            ? 'bg-brand-neon shadow-[0_0_8px_rgba(0,255,135,0.4)]' 
                            : isBestThird 
                              ? 'bg-brand-royal shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                              : 'bg-transparent'
                        }`} />
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
                          <div className="max-w-[100px] sm:max-w-[160px] overflow-hidden flex-1 flex items-center gap-1.5 min-w-0">
                            <ScrollingText text={t.name} className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors" />
                            <FifaRankBadge teamCode={t.code} />
                          </div>
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
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 select-none">
                          {(t.form || []).map((res, i) => (
                            <span
                              key={i}
                              title={res === 'W' ? 'Won' : res === 'D' ? 'Draw' : 'Lost'}
                              className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-sm sm:rounded-md flex items-center justify-center text-[7px] sm:text-[9px] font-black shrink-0 transition-all ${
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
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-neon" />
              <span>Group {expandedGroup} Match Schedule</span>
            </div>
            {selectedTeamCode && (
              <button 
                onClick={() => setSelectedTeamCode(null)}
                className="text-[9px] font-extrabold uppercase bg-brand-neon/10 hover:bg-brand-neon/20 border border-brand-neon/30 text-brand-neon px-2 py-0.5 rounded transition-all cursor-pointer select-none active:scale-95 shrink-0"
              >
                Clear ({selectedTeamCode})
              </button>
            )}
          </h3>

          <div className="flex flex-col gap-3.5">
            {groupMatches
              .filter(m => m.group === expandedGroup)
              .filter(m => !selectedTeamCode || m.home === selectedTeamCode || m.away === selectedTeamCode)
              .map(match => {
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
                    <span>GROUP {match.group} • MATCH {((match.id - 1) % 6) + 1}</span>
                    {match.isCompleted ? (
                      <span className="text-brand-neon bg-brand-neon/10 border border-brand-neon/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold font-mono">FT</span>
                    ) : (
                      <span>{formatDisplayDate(match.date)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 justify-between">
                    {/* Home Row */}
                    <div className={`flex items-center gap-1.5 font-bold text-xs text-slate-200 flex-1 min-w-0 ${match.isCompleted ? 'opacity-85' : ''}`}>
                      <span className="shrink-0">{home.flag}</span>
                      <ScrollingText text={home.name} className="text-xs text-slate-200" />
                      <FifaRankBadge teamCode={match.home} />
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
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200 flex-1 justify-end min-w-0">
                      <FifaRankBadge teamCode={match.away} />
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
});
