import { useState } from 'react';
import { ListFilter, Check, Star } from 'lucide-react';
import { GROUPS, TEAMS } from '../../data/worldcupData';
import { WorldCupTrophyIcon, formatDisplayDate } from '../../utils/matchHelpers';

export const BracketTab = ({
  bracket,
  standings,
  advancedTeams,
  tournamentChampion,
  handleKnockoutWinner
}) => {
  const [showGroupSelectors, setShowGroupSelectors] = useState(false);
  const [hoveredTeam, setHoveredTeam] = useState(null);

  const renderBracketColumn = (roundKey, matches, isRight = false) => {
    const rightOffset = isRight
      ? (roundKey === 'r32' ? 8 : roundKey === 'r16' ? 4 : roundKey === 'qf' ? 2 : roundKey === 'sf' ? 1 : 0)
      : 0;
    const roundLabel =
      roundKey === 'r32' ? 'Round of 32' :
      roundKey === 'r16' ? 'Round of 16' :
      roundKey === 'qf'  ? 'Quarter-Finals' :
      roundKey === 'sf'  ? 'Semi-Finals' : '';

    return (
      <div className="flex flex-col justify-around h-full gap-4 py-4 min-w-[240px] md:min-w-[280px]">
        <h3 className="text-center font-semibold text-xs tracking-wider text-slate-400 uppercase border-b border-slate-700/50 pb-2 mb-2">
          {roundLabel}
        </h3>
        {matches.map((match, idx) => {
          const actualIdx = idx + rightOffset;
          const homeTeam = TEAMS[match.home];
          const awayTeam = TEAMS[match.away];
          const isHomeWinner = match.winner === match.home && match.winner !== null;
          const isAwayWinner = match.winner === match.away && match.winner !== null;
          const isHoveredMatch = hoveredTeam && (match.home === hoveredTeam || match.away === hoveredTeam);

          return (
            <div 
              key={match.id} 
              className={`p-3 rounded-xl transition-all duration-300 relative border ${
                isHoveredMatch 
                  ? 'border-brand-neon bg-slate-900/90 shadow-neon ring-1 ring-brand-neon/30' 
                  : 'border-slate-800/80 bg-brand-cardBg'
              } flex flex-col gap-2`}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-tight">
                <span>{match.title}</span>
                <span className="text-brand-neon font-bold font-mono text-[9px]">{formatDisplayDate(match.date)}</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                {/* Home Team */}
                <div
                  id={`slot-${match.id}-home`}
                  onMouseEnter={() => match.home && setHoveredTeam(match.home)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => match.home && handleKnockoutWinner(roundKey, actualIdx, match.home)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-all text-xs font-semibold ${
                    !match.home 
                      ? 'text-slate-600 bg-slate-950/20 cursor-not-allowed' 
                      : isHomeWinner 
                        ? 'bg-brand-neon/15 text-brand-neon ring-1 ring-brand-neon/30 font-bold cursor-pointer hover:bg-brand-neon/25' 
                        : 'bg-slate-950/30 text-slate-300 cursor-pointer hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-lg">{homeTeam ? homeTeam.flag : '🏳️'}</span>
                    <span className="truncate">{homeTeam ? homeTeam.name : 'TBD (Group Stage)'}</span>
                  </div>
                  {isHomeWinner && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>

                {/* Away Team */}
                <div
                  id={`slot-${match.id}-away`}
                  onMouseEnter={() => match.away && setHoveredTeam(match.away)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => match.away && handleKnockoutWinner(roundKey, actualIdx, match.away)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-all text-xs font-semibold ${
                    !match.away 
                      ? 'text-slate-600 bg-slate-950/20 cursor-not-allowed' 
                      : isAwayWinner 
                        ? 'bg-brand-neon/15 text-brand-neon ring-1 ring-brand-neon/30 font-bold cursor-pointer hover:bg-brand-neon/25' 
                        : 'bg-slate-950/30 text-slate-300 cursor-pointer hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-lg">{awayTeam ? awayTeam.flag : '🏳️'}</span>
                    <span className="truncate">{awayTeam ? awayTeam.name : 'TBD (Group Stage)'}</span>
                  </div>
                  {isAwayWinner && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Legend & Instructions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <WorldCupTrophyIcon className="w-4 h-4 text-brand-gold" />
            Tournament Bracket Roadmap
          </h2>
          <p className="text-xs text-slate-400">View the qualified teams and progress of the knockout rounds in real time. Hover over any country to highlight their tournament path.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-3.5 h-3.5 rounded bg-brand-neon/20 border border-brand-neon/60 inline-block"></span>
            <span>Qualified / Advanced Team</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-3.5 h-3.5 rounded bg-brand-cardBg border border-slate-800 inline-block"></span>
            <span>TBD / Not Qualified</span>
          </div>
        </div>
      </div>

      {/* Collapsible Group Stage Qualifiers Section */}
      <div className="p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowGroupSelectors(!showGroupSelectors)}>
          <div>
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-brand-neon animate-pulse" />
              Group Stage Standings & R32 Qualifiers (48 Teams)
            </h2>
            <p className="text-xs text-slate-450 mt-1">Directly select group ranks (1st, 2nd, 3rd, 4th) to seed and qualify teams from 48 to 32 in the bracket below.</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            {showGroupSelectors ? 'Hide Group Standings' : 'Show Group Standings'}
          </button>
        </div>

        {showGroupSelectors && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5 animate-fadeIn">
            {GROUPS.map(g => {
              const groupStandings = standings[g] || [];
              return (
                <div key={g} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-slate-850 transition-all flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                    <span className="text-[10px] font-extrabold text-slate-350 tracking-widest">GROUP {g}</span>
                    <span className="text-[8px] text-slate-550 font-mono font-black">RANKING</span>
                  </div>
                  <table className="w-full text-left text-[10px] font-semibold">
                    <thead>
                      <tr className="text-slate-500 font-bold border-b border-slate-900/40">
                        <th className="py-1 w-12 text-[9px]">POS</th>
                        <th className="py-1 text-[9px]">TEAM</th>
                        <th className="py-1 text-center text-[9px] text-brand-neon">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/30">
                      {groupStandings.map((t, index) => {
                        const isQualifying = index < 2;
                        const isBestThird = index === 2 && advancedTeams.thirds.some(th => th.code === t.code);
                        return (
                          <tr key={t.code} className="hover:bg-slate-900/10 transition-all">
                            <td className="py-1.5">
                              <div className={`flex items-center justify-center w-5 h-5 rounded font-black text-[9px] border ${
                                index === 0 
                                  ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold' 
                                  : index === 1 
                                    ? 'bg-slate-400/10 border-slate-400/30 text-slate-350' 
                                    : index === 2 
                                      ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal' 
                                      : 'bg-slate-900/50 border-slate-800 text-slate-500'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-1.5 text-slate-200 flex items-center gap-1.5 truncate">
                              <span className="text-base shrink-0">{t.flag}</span>
                              <span className="truncate max-w-[70px] font-bold" title={t.name}>{t.name}</span>
                              {isQualifying && <span className="text-[7px] bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-1 rounded-sm leading-none py-0.5 font-extrabold">R32</span>}
                              {isBestThird && <span className="text-[7px] bg-brand-royal/15 border border-brand-royal/30 text-brand-royal px-1 rounded-sm leading-none py-0.5 font-extrabold">R32 *</span>}
                            </td>
                            <td className="py-1.5 text-center font-extrabold text-[10px] text-brand-neon">{t.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tree Bracket Container (Scrollable horizontally) */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[1280px] flex gap-4 items-center justify-between select-none">
          
          {/* --- LEFT BRACKET --- */}
          {renderBracketColumn('r32', bracket.r32.slice(0, 8))}
          {renderBracketColumn('r16', bracket.r16.slice(0, 4))}
          {renderBracketColumn('qf', bracket.qf.slice(0, 2))}
          {renderBracketColumn('sf', bracket.sf.slice(0, 1))}

          {/* --- CENTER: TROPHY & FINAL --- */}
          <div className="flex flex-col items-center justify-center min-w-[280px] p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/90 border border-brand-gold/20 shadow-gold relative">
            <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-brand-gold font-bold">
              <Star className="w-3 h-3 fill-brand-gold" />
              <span>CHAMPIONS</span>
            </div>

            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-brand-gold/10 rounded-full blur-xl animate-pulse"></div>
              <WorldCupTrophyIcon className="w-20 h-20 text-brand-gold drop-shadow-xl animate-float relative z-10" />
            </div>

            {/* Final match card */}
            {bracket.final.map((match, idx) => {
              const homeTeam = TEAMS[match.home];
              const awayTeam = TEAMS[match.away];
              const isHomeWinner = match.winner === match.home && match.winner !== null;
              const isAwayWinner = match.winner === match.away && match.winner !== null;

              return (
                <div key={match.id} className="w-full flex flex-col gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">The Grand Final</p>
                    <p className="text-[9px] text-brand-neon font-bold font-mono">{formatDisplayDate(match.date)}</p>
                    <p className="text-[8px] text-slate-500 font-semibold mt-0.5">New York/New Jersey</p>
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    {/* Home */}
                    <div
                      id={`slot-final-home`}
                      onMouseEnter={() => match.home && setHoveredTeam(match.home)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      onClick={() => match.home && handleKnockoutWinner('final', idx, match.home)}
                      className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all text-xs font-bold ${
                        !match.home 
                          ? 'text-slate-600 bg-slate-900/20 cursor-not-allowed' 
                          : isHomeWinner 
                            ? 'bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/50 shadow-gold cursor-pointer hover:bg-brand-gold/30' 
                            : 'bg-slate-900/50 text-slate-200 cursor-pointer hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <span className="text-lg">{homeTeam ? homeTeam.flag : '🏳️'}</span>
                        <span className="truncate">{homeTeam ? homeTeam.name : 'TBD SF 1 Winner'}</span>
                      </div>
                      {isHomeWinner && <Check className="w-4 h-4 shrink-0 text-brand-gold" />}
                    </div>

                    {/* Away */}
                    <div
                      id={`slot-final-away`}
                      onMouseEnter={() => match.away && setHoveredTeam(match.away)}
                      onMouseLeave={() => setHoveredTeam(null)}
                      onClick={() => match.away && handleKnockoutWinner('final', idx, match.away)}
                      className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all text-xs font-bold ${
                        !match.away 
                          ? 'text-slate-600 bg-slate-900/20 cursor-not-allowed' 
                          : isAwayWinner 
                            ? 'bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/50 shadow-gold cursor-pointer hover:bg-brand-gold/30' 
                            : 'bg-slate-900/50 text-slate-200 cursor-pointer hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <span className="text-lg">{awayTeam ? awayTeam.flag : '🏳️'}</span>
                        <span className="truncate">{awayTeam ? awayTeam.name : 'TBD SF 2 Winner'}</span>
                      </div>
                      {isAwayWinner && <Check className="w-4 h-4 shrink-0 text-brand-gold" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Champion Reveal Box */}
            {tournamentChampion ? (
              <div className="mt-5 text-center animate-bounce">
                <p className="text-[10px] text-brand-neon font-bold tracking-widest">WORLD CUP CHAMPION</p>
                <p className="text-lg font-extrabold text-white flex items-center gap-1.5 justify-center mt-1">
                  <span>{tournamentChampion.flag}</span>
                  <span>{tournamentChampion.name.toUpperCase()}</span>
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 mt-4 text-center">Predict all matches to crown the champion!</p>
            )}
          </div>

          {/* --- RIGHT BRACKET --- */}
          {renderBracketColumn('sf', bracket.sf.slice(1, 2), true)}
          {renderBracketColumn('qf', bracket.qf.slice(2, 4), true)}
          {renderBracketColumn('r16', bracket.r16.slice(4, 8), true)}
          {renderBracketColumn('r32', bracket.r32.slice(8, 16), true)}

        </div>
      </div>
    </div>
  );
};
