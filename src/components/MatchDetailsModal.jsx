import { useEffect, useState, useRef } from 'react';
import { TEAMS, VENUES } from '../data/worldcupData';
import { getMatchDetails, getPossessionWithContest, formatDisplayDate, isLiveMatch, getMatchVenue } from '../utils/matchHelpers';

const ScrollingName = ({ name }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scrollDist, setScrollDist] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        if (textWidth > containerWidth) {
          setScrollDist(textWidth - containerWidth);
        } else {
          setScrollDist(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 200);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [name]);

  const duration = Math.max(3, scrollDist * 0.05); // speed: 20px per second, min 3s

  return (
    <div 
      ref={containerRef} 
      className="overflow-hidden relative w-full pr-1.5 select-none"
    >
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap text-slate-350"
        style={
          scrollDist > 0
            ? {
                animation: `marquee-scroll ${duration}s linear infinite alternate`,
                paddingRight: '15px',
                '--scroll-dist': `-${scrollDist + 10}px`,
              }
            : {}
        }
      >
        {name}
      </span>
    </div>
  );
};

export const MatchDetailsModal = ({ selectedMatch, liveMatches, fotmobRatings, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedMatch) return null;

  const home = TEAMS[selectedMatch.home] || { name: selectedMatch.home || 'TBD', flag: '🏳️' };
  const away = TEAMS[selectedMatch.away] || { name: selectedMatch.away || 'TBD', flag: '🏳️' };

  const live = liveMatches[selectedMatch.id];
  const details = getMatchDetails(selectedMatch, live);

  const homePlayers = (fotmobRatings || []).filter(p => p.team === selectedMatch.home).sort((a, b) => b.rating - a.rating);
  const awayPlayers = (fotmobRatings || []).filter(p => p.team === selectedMatch.away).sort((a, b) => b.rating - a.rating);

  const isCompleted = selectedMatch.isCompleted || (live && live.minute === 'FT');
  const isLive = isLiveMatch(live);
  const hasStarted = isCompleted || isLive;

  const homeScore = live ? live.homeScore : (selectedMatch.homeScore ?? 0);
  const awayScore = live ? live.awayScore : (selectedMatch.awayScore ?? 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl max-h-[90dvh] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Non-scrollable & Always Visible */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/98 z-10">
          <div className="pr-12 text-left">
            <div className="text-[10px] sm:text-xs font-extrabold text-brand-neon uppercase tracking-widest mb-0.5">
              {selectedMatch.type === 'group' ? `Group ${selectedMatch.group}` : selectedMatch.round || 'Knockout'} • Match {selectedMatch.id}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold font-mono truncate max-w-[240px] sm:max-w-md">
              {getMatchVenue(selectedMatch, VENUES)} • {formatDisplayDate(selectedMatch.date)}
            </div>
          </div>
          
          <button 
            className="p-1.5 text-slate-400 hover:text-white transition-colors bg-slate-950/40 hover:bg-slate-950/80 rounded-full border border-slate-800/40 cursor-pointer select-none"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 flex-1">

        {/* Scoreboard */}
        <div className="flex items-center justify-between gap-4 py-3 px-5 bg-slate-950/50 rounded-2xl border border-slate-900">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span className="text-4xl select-none">{home.flag}</span>
            <span className="text-xs font-black text-slate-100 truncate text-center w-full">{home.name}</span>
          </div>

          {/* Score digits */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black font-mono ${hasStarted ? 'text-white' : 'text-slate-600'}`}>
                {hasStarted ? homeScore : '-'}
              </span>
              <span className="text-xl font-bold text-slate-700">:</span>
              <span className={`text-3xl font-black font-mono ${hasStarted ? 'text-white' : 'text-slate-600'}`}>
                {hasStarted ? awayScore : '-'}
              </span>
            </div>
            <div>
              {isLive ? (
                <span className="bg-brand-neon/20 text-brand-neon border border-brand-neon/30 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-ping"></span>
                  {live.minute === 'HT' ? 'HT' : (String(live.minute).includes("'") || String(live.minute).toLowerCase() === 'live' ? live.minute : `${String(live.minute).padStart(2, '0')}:${String(live.second).padStart(2, '0')}`)}
                </span>
              ) : isCompleted ? (
                <span className="bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                  Full Time
                </span>
              ) : (
                <span className="bg-brand-neon/15 text-brand-neon border border-brand-neon/30 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                  Scheduled
                </span>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span className="text-4xl select-none">{away.flag}</span>
            <span className="text-xs font-black text-slate-100 truncate text-center w-full">{away.name}</span>
          </div>
        </div>

        {/* Scorers Section */}
        {hasStarted && (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚽</span> Goal Scorers
            </h4>
            {details.scorers && details.scorers.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 text-[11px] font-bold font-mono">
                {/* Home Scorers */}
                <div className="flex flex-col gap-1 text-left">
                  {details.scorers.filter(s => s.team === 'home').map((s, idx) => (
                    <span key={`h-scorer-${idx}`} className="text-slate-300 flex items-center gap-1">
                      <span>{s.player}</span>
                      <span className="text-brand-neon">({s.minute}')</span>
                    </span>
                  ))}
                </div>
                {/* Away Scorers */}
                <div className="flex flex-col gap-1 text-right">
                  {details.scorers.filter(s => s.team === 'away').map((s, idx) => (
                    <span key={`a-scorer-${idx}`} className="text-slate-300 flex items-center justify-end gap-1">
                      <span>{s.player}</span>
                      <span className="text-brand-neon">({s.minute}')</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-[10px] text-slate-500 font-bold italic py-1">
                No goals scored in this match.
              </div>
            )}
          </div>
        )}

        {/* Match Timeline */}
        {hasStarted && details.timeline && details.timeline.length > 0 && (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⏱️</span> Match Timeline
            </h4>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
              {details.timeline
                .filter(event => {
                  const typeLower = event.type.toLowerCase();
                  return typeLower.includes('goal') || 
                         typeLower.includes('card') || 
                         typeLower.includes('sub') || 
                         typeLower.includes('start') || 
                         typeLower.includes('end') || 
                         typeLower.includes('half') || 
                         typeLower.includes('whistle') || 
                         typeLower.includes('toss') || 
                         typeLower.includes('kick off');
                })
                .slice()
                .reverse()
                .map((event, idx) => {
                  const normalize = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
                  const normText = normalize(event.text);
                  const normHomeName = normalize(home.name);
                  const normAwayName = normalize(away.name);
                  
                  const isHome = normText.includes(normHomeName) || 
                                 event.text.toLowerCase().includes(selectedMatch.home.toLowerCase());
                  const isAway = normText.includes(normAwayName) || 
                                 event.text.toLowerCase().includes(selectedMatch.away.toLowerCase());
                  const eventFlag = isHome ? home.flag : (isAway ? away.flag : null);

                  let icon = '🔔';
                  const typeLower = event.type.toLowerCase();
                  if (typeLower.includes('foul')) icon = '⚡';
                  else if (typeLower.includes('goal') || typeLower.includes('scorer') || typeLower.includes('score')) icon = '⚽';
                  else if (typeLower.includes('attempt') || typeLower.includes('shot')) icon = '🎯';
                  else if (typeLower.includes('corner')) icon = '🚩';
                  else if (typeLower.includes('offside')) icon = '👁️';
                  else if (typeLower.includes('kick off') || typeLower.includes('start') || typeLower.includes('toss')) icon = '🎬';
                  else if (typeLower.includes('yellow')) icon = '🟨';
                  else if (typeLower.includes('red')) icon = '🟥';
                  else if (typeLower.includes('sub')) icon = '🔄';

                  return (
                    <div 
                      key={`timeline-${idx}`} 
                      className="flex items-start gap-3 bg-slate-950/40 border border-slate-800/50 rounded-xl p-2.5 hover:border-slate-700/50 transition-all duration-300 relative"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[11px] shrink-0">
                        {icon}
                      </div>

                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {event.type}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-brand-neon">
                            {event.minuteStr}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-bold leading-relaxed pr-6">
                          {event.text}
                        </p>
                        {eventFlag && (
                          <div className="absolute right-2.5 bottom-2.5">
                            <span className="text-xs">{eventFlag}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Match Statistics */}
        {hasStarted ? (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Match Statistics
            </h4>
            
            <div className="flex flex-col gap-4">
              {[
                { label: 'Possession', key: 'possession', suffix: '%' },
                { label: 'Shots', key: 'shots' },
                { label: 'Shots on Target', key: 'shotsOnTarget' },
                { label: 'Corners', key: 'corners' },
                { label: 'Fouls', key: 'fouls' },
                { label: 'Yellow Cards', key: 'yellowCards' },
                { label: 'Red Cards', key: 'redCards' }
              ].map(stat => {
                if (stat.key === 'possession') {
                  const [homePoss, awayPoss, contestPoss] = getPossessionWithContest(details.stats.possession, selectedMatch.id);
                  return (
                    <div key={stat.key} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400 font-sans uppercase tracking-wider">
                        <span>{home.name || 'Home'}</span>
                        <span className="text-slate-500 font-black text-[9px]">POSSESSION</span>
                        <span>{away.name || 'Away'}</span>
                      </div>
                      <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex text-[9px] font-mono font-black text-center relative">
                        <div className="bg-red-600 h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${homePoss}%` }}>
                          {homePoss}%
                        </div>
                        <div className="bg-slate-700 h-full transition-all duration-500 flex items-center justify-center text-slate-200 font-extrabold whitespace-nowrap" style={{ width: `${contestPoss}%` }}>
                          {contestPoss}%
                        </div>
                        <div className="bg-brand-purple h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${awayPoss}%` }}>
                          {awayPoss}%
                        </div>
                      </div>
                    </div>
                  );
                }

                const valHome = details.stats[stat.key]?.[0] ?? 0;
                const valAway = details.stats[stat.key]?.[1] ?? 0;
                
                let pctHome = 0;
                let pctAway = 0;
                if (valHome > 0 || valAway > 0) {
                  const total = valHome + valAway;
                  pctHome = Math.round((valHome / total) * 100);
                  pctAway = 100 - pctHome;
                }

                return (
                  <div key={stat.key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-300 font-mono">
                      <span>{valHome}{stat.suffix || ''}</span>
                      <span className="text-slate-400 font-sans uppercase tracking-wider text-[8px] font-black">{stat.label}</span>
                      <span>{valAway}{stat.suffix || ''}</span>
                    </div>
                    {/* Bar display */}
                    <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex text-[9px] font-mono font-black text-center relative">
                      <div 
                        className="bg-red-600 h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" 
                        style={{ width: `${pctHome}%` }}
                      >
                        {pctHome > 12 && `${valHome}${stat.suffix || ''}`}
                      </div>
                      <div 
                        className="bg-brand-purple h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" 
                        style={{ width: `${pctAway}%` }}
                      >
                        {pctAway > 12 && `${valAway}${stat.suffix || ''}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-800/80 pt-4 text-center flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-400">Match Preview</div>
            <p className="text-[10px] text-slate-500 leading-relaxed px-4">
              This match has not started yet. Real-time stats and goal scorers will activate automatically when the match kicks off.
            </p>
          </div>
        )}

        {/* Player Performance Ratings Section */}
        {((homePlayers && homePlayers.length > 0) || (awayPlayers && awayPlayers.length > 0)) && (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⭐</span> Player Performance Ratings
            </h4>
            <div className="grid grid-cols-2 gap-4 text-[11px] font-bold font-mono">
              {/* Home Player Ratings */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>{home.flag}</span>
                  <span className="truncate">{home.name}</span>
                </div>
                {homePlayers.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-1">No ratings available</div>
                ) : (
                  homePlayers.map((p, idx) => (
                    <div key={`home-p-${idx}`} className="flex items-center justify-between bg-slate-950/30 border border-slate-900/50 rounded-lg p-1.5 px-2">
                      <ScrollingName name={p.name} />
                      <span className={`px-1.5 py-0.5 rounded text-[9px] shrink-0 font-black ${
                        p.rating >= 7.5 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : p.rating >= 6.0 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.rating.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {/* Away Player Ratings */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                  <span className="truncate">{away.name}</span>
                  <span>{away.flag}</span>
                </div>
                {awayPlayers.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-1 text-right">No ratings available</div>
                ) : (
                  awayPlayers.map((p, idx) => (
                    <div key={`away-p-${idx}`} className="flex items-center justify-between bg-slate-950/30 border border-slate-900/50 rounded-lg p-1.5 px-2">
                      <ScrollingName name={p.name} />
                      <span className={`px-1.5 py-0.5 rounded text-[9px] shrink-0 font-black ${
                        p.rating >= 7.5 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : p.rating >= 6.0 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.rating.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
