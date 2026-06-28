import { useState, useEffect, useMemo, useRef } from 'react';
import { TEAMS, VENUES } from '../data/worldcupData';
import { getMatchDetails, getPossessionWithContest, formatDisplayDate, isLiveMatch, getMatchVenue } from '../utils/matchHelpers';
import { ScrollingText } from './ScrollingText';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerDetailModal } from './PlayerDetailModal';
import { getPositionLabel, getPositionCategory, getCategoryColor } from '../utils/positions';
import { MatchTimeline } from './MatchTimeline';
import { H2HAnalysis } from './H2HAnalysis';

export const MatchDetailsModal = ({ 
  selectedMatch, 
  liveMatches, 
  fotmobRatings, 
  livePlayerRatings, 
  groupMatches = [], 
  standings = {}, 
  bracket = {}, 
  onClose 
}) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const positionLookup = useMemo(() => {
    const map = {};
    (fotmobRatings || []).forEach(p => {
      if (p.name && p.team && p.position) {
        map[`${p.name}|${p.team}`] = p.position;
      }
    });
    return map;
  }, [fotmobRatings]);

  const playerIdLookup = useMemo(() => {
    const map = {};
    (fotmobRatings || []).forEach(p => {
      if (p.playerId) map[p.name] = p.playerId;
    });
    return map;
  }, [fotmobRatings]);

  const getPlayerPosition = (name, team, playerObj) => {
    if (playerObj && playerObj.position) return playerObj.position;
    return positionLookup[`${name}|${team}`];
  };

  const [detailPlayer, setDetailPlayer] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('match');
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) focusable[0].focus();
      }
    }, 50);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [onClose, handleClose]);

  if (!selectedMatch) return null;

  const home = TEAMS[selectedMatch.home] || { name: selectedMatch.home || 'TBD', flag: '🏳️' };
  const away = TEAMS[selectedMatch.away] || { name: selectedMatch.away || 'TBD', flag: '🏳️' };

  const live = liveMatches[selectedMatch.id];
  const details = getMatchDetails(selectedMatch, live);

  const matchKey = `${selectedMatch.home}-${selectedMatch.away}`;
  const reverseMatchKey = `${selectedMatch.away}-${selectedMatch.home}`;
  const liveMatchRatings = livePlayerRatings?.[matchKey] || livePlayerRatings?.[reverseMatchKey];

  let homePlayers;
  let awayPlayers;

  if (liveMatchRatings) {
    // Match-specific ratings exist (from live/completed game scraping)
    const homeTeamRatings = liveMatchRatings[selectedMatch.home] || {};
    const awayTeamRatings = liveMatchRatings[selectedMatch.away] || {};
    
    homePlayers = Object.entries(homeTeamRatings).map(([name, rating]) => ({ name, rating })).sort((a, b) => b.rating - a.rating);
    awayPlayers = Object.entries(awayTeamRatings).map(([name, rating]) => ({ name, rating })).sort((a, b) => b.rating - a.rating);
  } else {
    // Fall back to tournament average ratings
    homePlayers = (fotmobRatings || []).filter(p => p.team === selectedMatch.home).sort((a, b) => b.rating - a.rating);
    awayPlayers = (fotmobRatings || []).filter(p => p.team === selectedMatch.away).sort((a, b) => b.rating - a.rating);
  }

  const isCompleted = selectedMatch.isCompleted || (live && live.minute === 'FT');
  const isLive = isLiveMatch(live);
  const hasStarted = isCompleted || isLive;

  const homeScore = live ? live.homeScore : (selectedMatch.homeScore ?? 0);
  const awayScore = live ? live.awayScore : (selectedMatch.awayScore ?? 0);

  return (
    <><div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Match details: ${home?.name || 'TBD'} vs ${away?.name || 'TBD'}`}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${
        closing ? 'animate-backdropExit' : 'animate-modalEnter'
      }`}
      style={{ background: 'rgba(2, 6, 23, 0.85)' }}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full max-w-full sm:max-w-xl max-h-[90dvh] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl relative flex flex-col overflow-hidden ${
          closing ? 'animate-modalExit' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - Non-scrollable & Always Visible */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800/80 shrink-0 bg-slate-900/98 z-10 relative">
          <div className="pr-12 text-left">
            <div className="text-[10px] sm:text-xs font-extrabold text-brand-neon uppercase tracking-widest mb-0.5 truncate">
              {selectedMatch.type === 'group' 
                ? `Group ${selectedMatch.group} • Match ${((selectedMatch.id - 1) % 6) + 1}` 
                : (selectedMatch.title || `${selectedMatch.round || 'Knockout'} • Match ${selectedMatch.id}`)}
            </div>
            <div className="w-full">
              <ScrollingText 
                text={`${getMatchVenue(selectedMatch, VENUES)} • ${formatDisplayDate(selectedMatch.date)}`} 
                className="text-[10px] sm:text-[11px] text-slate-400 font-bold font-mono" 
              />
            </div>
          </div>
          
          <button 
            className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 p-1.5 text-slate-400 hover:text-white transition-colors bg-slate-950/40 hover:bg-slate-950/80 rounded-full border border-slate-800/40 cursor-pointer select-none z-20 shrink-0"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex border-b border-slate-800/80 shrink-0 bg-slate-900/98 select-none relative z-10">
          <button 
            onClick={() => setActiveModalTab('match')}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeModalTab === 'match' 
                ? 'border-brand-neon text-brand-neon bg-brand-neon/5' 
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            Match Center
          </button>
          <button 
            onClick={() => setActiveModalTab('h2h')}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeModalTab === 'h2h' 
                ? 'border-brand-neon text-brand-neon bg-brand-neon/5' 
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            H2H Analysis
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 flex-1">
        {activeModalTab === 'match' ? (
          <>
        {/* Scoreboard */}
        <div className="flex items-center justify-between gap-4 py-3 px-5 bg-slate-950/50 rounded-2xl border border-slate-900">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
            <span className="text-4xl select-none">{home.flag}</span>
            <ScrollingText text={home.name} className="text-xs font-black text-slate-100 text-center w-full justify-center" />
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
            <ScrollingText text={away.name} className="text-xs font-black text-slate-100 text-center w-full justify-center" />
          </div>
        </div>

        {/* Scorers Section */}
        {hasStarted && (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚽</span> Goal Scorers
              {details.scorersSimulated && (
                <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full tracking-wider uppercase ml-1 shadow-[0_0_6px_rgba(245,158,11,0.2)]">
                  Simulated
                </span>
              )}
            </h4>
            {details.scorers && details.scorers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 text-[11px] font-bold font-mono">
                    {/* Home Scorers */}
                    <div className="flex flex-col gap-1.5 text-left">
                      {details.scorers.filter(s => s.team === 'home').map((s, idx) => {
                        const pid = playerIdLookup[s.player];
                        return (
                          <div key={`h-scorer-${idx}`} className="text-slate-300 flex items-center gap-1.5 cursor-pointer min-w-0" onClick={() => pid && setDetailPlayer({ id: pid, name: s.player })}>
                            <PlayerAvatar name={s.player} size="md" playerId={pid} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                            <ScrollingText text={s.player} className="text-slate-300" />
                            <span className="text-brand-neon shrink-0">({s.minute}')</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Away Scorers */}
                    <div className="flex flex-col gap-1.5 text-right">
                      {details.scorers.filter(s => s.team === 'away').map((s, idx) => {
                        const pid = playerIdLookup[s.player];
                        return (
                          <div key={`a-scorer-${idx}`} className="text-slate-300 flex items-center justify-end gap-1.5 cursor-pointer min-w-0" onClick={() => pid && setDetailPlayer({ id: pid, name: s.player })}>
                            <span className="text-brand-neon shrink-0">({s.minute}')</span>
                            <ScrollingText text={s.player} className="text-slate-300 text-right" />
                            <PlayerAvatar name={s.player} size="md" playerId={pid} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
            ) : (
              <div className="text-center text-[10px] text-slate-500 font-bold italic py-1">
                No goals scored in this match.
              </div>
            )}
          </div>
        )}

        {/* Player Performance Ratings Section */}
        {((homePlayers && homePlayers.length > 0) || (awayPlayers && awayPlayers.length > 0)) && (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⭐</span> Player Ratings
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-bold font-mono">
              {/* Home Player Ratings */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <span>{home.flag}</span>
                  <span className="truncate">{home.name}</span>
                </div>
                {homePlayers.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-1">No ratings available</div>
                ) : (
                  homePlayers.map((p, idx) => {
                    const posCode = getPlayerPosition(p.name, selectedMatch.home, p);
                    const posLabel = getPositionLabel(posCode);
                    const posCat = getPositionCategory(posCode);
                    return (
                      <div key={`home-p-${idx}`} className="flex items-center gap-0.5 bg-slate-950/30 border border-slate-900/50 rounded-lg p-1 pl-1.5 cursor-pointer hover:border-slate-700/60 transition-colors" onClick={() => { const pid = p.playerId || playerIdLookup[p.name]; if (pid) setDetailPlayer({ id: pid, name: p.name }); }}>
                         {posLabel && (
                           <span className={`text-[4px] font-mono font-black px-0.5 py-0.5 rounded-full border shrink-0 leading-none ${getCategoryColor(posCat)}`}>
                             {posLabel}
                           </span>
                         )}
                         <PlayerAvatar name={p.name} size="md" playerId={p.playerId || playerIdLookup[p.name]} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                         <div className="flex items-center gap-0.5 min-w-0 flex-1">
                           <ScrollingText text={p.name} className="text-slate-350 text-[9px] sm:text-[11px]" />
                         </div>
                         <span className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] shrink-0 font-black leading-none ${
                           p.rating >= 7.5 
                             ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                             : p.rating >= 6.0 
                               ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                               : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                         }`}>
                           {p.rating != null ? Number(p.rating).toFixed(2) : '-'}
                         </span>
                       </div>
                    );
                  })
                )}
              </div>
              {/* Away Player Ratings */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                  <span className="truncate">{away.name}</span>
                  <span>{away.flag}</span>
                </div>
                {awayPlayers.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-1 text-right">No ratings available</div>
                ) : (
                  awayPlayers.map((p, idx) => {
                    const posCode = getPlayerPosition(p.name, selectedMatch.away, p);
                    const posLabel = getPositionLabel(posCode);
                    const posCat = getPositionCategory(posCode);
                    return (
                      <div key={`away-p-${idx}`} className="flex items-center gap-0.5 bg-slate-950/30 border border-slate-900/50 rounded-lg p-1 pr-1.5 cursor-pointer hover:border-slate-700/60 transition-colors" onClick={() => { const pid = p.playerId || playerIdLookup[p.name]; if (pid) setDetailPlayer({ id: pid, name: p.name }); }}>
                        <div className="flex items-center gap-0.5 min-w-0 flex-1">
                          <ScrollingText text={p.name} className="text-slate-350 text-[9px] sm:text-[11px] text-right" />
                        </div>
                        {posLabel && (
                          <span className={`text-[4px] font-mono font-black px-0.5 py-0.5 rounded-full border shrink-0 leading-none ${getCategoryColor(posCat)}`}>
                            {posLabel}
                          </span>
                        )}
                        <PlayerAvatar name={p.name} size="md" playerId={p.playerId || playerIdLookup[p.name]} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                        <span className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] shrink-0 font-black leading-none ${
                          p.rating >= 7.5 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : p.rating >= 6.0 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {p.rating != null ? Number(p.rating).toFixed(2) : '-'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Match Statistics */}
        {hasStarted ? (
          <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Match Statistics
              {details.statsSimulated && (
                <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-full tracking-wider uppercase shadow-[0_0_6px_rgba(245,158,11,0.2)]">
                  Simulated
                </span>
              )}
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
                        <div className="possession-flow-home h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${homePoss}%` }}>
                          {homePoss}%
                        </div>
                        <div className="bg-slate-700 h-full transition-all duration-500 flex items-center justify-center text-slate-200 font-extrabold whitespace-nowrap" style={{ width: `${contestPoss}%` }}>
                          {contestPoss}%
                        </div>
                        <div className="possession-flow-away h-full transition-all duration-500 flex items-center justify-center text-white font-extrabold whitespace-nowrap" style={{ width: `${awayPoss}%` }}>
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
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex relative gap-0.5">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-red-500 h-full transition-all duration-500 rounded-r-sm" 
                        style={{ width: `${pctHome}%` }}
                      />
                      <div 
                        className="bg-gradient-to-l from-brand-purple to-indigo-500 h-full transition-all duration-500 rounded-l-sm ml-auto" 
                        style={{ width: `${pctAway}%` }}
                      />
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

        {/* Match Timeline */}
        {hasStarted && details.timeline && details.timeline.length > 0 && (
          <MatchTimeline
            events={details.timeline}
            home={home}
            away={away}
            homeCode={selectedMatch.home}
            awayCode={selectedMatch.away}
          />
        )}

          </>
        ) : (
          <H2HAnalysis
            home={{ code: selectedMatch.home, ...home, group: TEAMS[selectedMatch.home]?.group }}
            away={{ code: selectedMatch.away, ...away, group: TEAMS[selectedMatch.away]?.group }}
            standings={standings}
            groupMatches={groupMatches}
            bracket={bracket}
            liveMatches={liveMatches}
          />
        )}
        </div>
      </div>
    </div>

    {detailPlayer && (
      <PlayerDetailModal playerId={detailPlayer.id} name={detailPlayer.name} onClose={() => setDetailPlayer(null)} />
    )}</>
  );
};
