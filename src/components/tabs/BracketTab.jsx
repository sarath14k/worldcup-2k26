import { useState, useEffect, useRef } from 'react';
import { Star, Share2 } from 'lucide-react';
import { TEAMS } from '../../data/worldcupData';
import { WorldCupTrophyIcon, formatDisplayDate } from '../../utils/matchHelpers';
import { BracketTeamSlot } from '../BracketTeamSlot';

export const BracketTab = ({
  bracket,
  tournamentChampion,
  handleKnockoutWinner,
  onRestoreBracket
}) => {
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const [activeRoundTab, setActiveRoundTab] = useState('r32');
  const [lines, setLines] = useState([]);
  const [shareCopied, setShareCopied] = useState(false);
  const containerRef = useRef(null);

  // Restore bracket from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#bracket=')) {
      try {
        const data = JSON.parse(atob(hash.slice(9)));
        if (data && onRestoreBracket) {
          onRestoreBracket(data);
        }
      } catch (e) {
        console.warn('[Bracket] Failed to restore from URL:', e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShare = () => {
    const rounds = ['r32', 'r16', 'qf', 'sf', 'final'];
    const winners = {};
    rounds.forEach(rk => {
      (bracket[rk] || []).forEach(m => {
        if (m.winner) winners[m.id] = m.winner;
      });
    });
    const encoded = btoa(JSON.stringify(winners));
    const url = `${window.location.origin}${window.location.pathname}#bracket=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {});
  };

  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines = [];

      const rounds = ['r32', 'r16', 'qf', 'sf'];
      rounds.forEach(rk => {
        const matches = bracket[rk] || [];
        matches.forEach(match => {
          if (!match.nextId) return;

          const totalInRound = matches.length;
          const isLeftSide = match.slot <= totalInRound / 2;
          const side = isLeftSide ? 'left' : 'right';

          const fromEl = document.getElementById(`card-${match.id}`);
          
          let toSlot = 'home';
          if (match.position === 'away' || match.position === 'bottom') {
            toSlot = 'away';
          }

          let toId = `slot-${match.nextId}-${toSlot}`;
          if (match.nextId === 'final') {
            toId = `slot-final-${toSlot}`;
          }
          const toEl = document.getElementById(toId);

          if (fromEl && toEl) {
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            let x1, y1, x2, y2;
            if (side === 'left') {
              x1 = fromRect.right - containerRect.left;
              y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
              x2 = toRect.left - containerRect.left;
              y2 = toRect.top + toRect.height / 2 - containerRect.top;
            } else {
              x1 = fromRect.left - containerRect.left;
              y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
              x2 = toRect.right - containerRect.left;
              y2 = toRect.top + toRect.height / 2 - containerRect.top;
            }

            newLines.push({
              id: `${match.id}-${match.nextId}`,
              x1, y1, x2, y2,
              side,
              activeTeamCode: match.winner
            });
          }
        });
      });

      setLines(newLines);
    };

    const timer = setTimeout(updateLines, 100);

    const observer = new ResizeObserver(updateLines);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', updateLines);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateLines);
    };
  }, [bracket, hoveredTeam]);

  const renderMobileRound = () => {
    const roundKey = activeRoundTab;
    const matches = bracket[roundKey] || [];
    const roundLabel =
      roundKey === 'r32' ? 'Round of 32' :
      roundKey === 'r16' ? 'Round of 16' :
      roundKey === 'qf'  ? 'Quarter-Finals' :
      roundKey === 'sf'  ? 'Semi-Finals' : 'Grand Final';

    if (roundKey === 'final') {
      return (
        <div className={`flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/90 border border-brand-gold/20 shadow-gold relative mt-2 transition-all duration-500 ${tournamentChampion ? 'holo-card-shine shadow-gold/60 border-brand-gold/50' : ''}`}>
          <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-brand-gold font-bold">
            <Star className="w-3.5 h-3.5 fill-brand-gold" />
            <span>CHAMPIONS</span>
          </div>

          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-brand-gold/10 rounded-full blur-xl animate-pulse"></div>
            <WorldCupTrophyIcon className="w-16 h-16 text-brand-gold drop-shadow-xl animate-float relative z-10" />
          </div>

          {/* Final match card */}
          {matches.map((match, idx) => {
            const homeTeam = TEAMS[match.home];
            const awayTeam = TEAMS[match.away];
            const isHomeWinner = match.winner === match.home && match.winner !== null;
            const isAwayWinner = match.winner === match.away && match.winner !== null;
            const isHomeHovered = hoveredTeam && match.home === hoveredTeam;
            const isAwayHovered = hoveredTeam && match.away === hoveredTeam;

            return (
              <div key={match.id} className="w-full flex flex-col gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">The Grand Final</p>
                  <p className="text-[9px] text-brand-neon font-bold font-mono">{formatDisplayDate(match.date)}</p>
                  <p className="text-[8px] text-slate-500 font-semibold mt-0.5">New York/New Jersey</p>
                </div>

                <div className="flex flex-col gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <BracketTeamSlot
                    teamCode={match.home}
                    isWinner={isHomeWinner}
                    isHovered={isHomeHovered}
                    onClick={() => handleKnockoutWinner('final', idx, match.home)}
                    id="m-slot-final-home"
                    tbdText="TBD SF 1 Winner"
                    isFinal
                  />
                  <BracketTeamSlot
                    teamCode={match.away}
                    isWinner={isAwayWinner}
                    isHovered={isAwayHovered}
                    onClick={() => handleKnockoutWinner('final', idx, match.away)}
                    id="m-slot-final-away"
                    tbdText="TBD SF 2 Winner"
                    isFinal
                  />
                </div>
              </div>
            );
          })}

          {/* Champion Reveal Box */}
          {tournamentChampion ? (
            <div className="mt-5 text-center animate-bounce">
              <p className="text-[10px] text-brand-neon font-bold tracking-widest">WORLD CUP CHAMPION</p>
              <p className="text-base font-extrabold text-white flex items-center gap-1.5 justify-center mt-1 holo-shine">
                <span>{tournamentChampion.flag}</span>
                <span>{tournamentChampion.name.toUpperCase()}</span>
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 mt-4 text-center">Predict all matches to crown the champion!</p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3.5 mt-2">
        <h3 className="text-center font-bold text-xs tracking-wider text-slate-400 uppercase border-b border-slate-800/60 pb-2 mb-2">
          {roundLabel} Matches
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {matches.map((match, idx) => {
            const homeTeam = TEAMS[match.home];
            const awayTeam = TEAMS[match.away];
            const isHomeWinner = match.winner === match.home && match.winner !== null;
            const isAwayWinner = match.winner === match.away && match.winner !== null;
            const isHoveredMatch = hoveredTeam && (match.home === hoveredTeam || match.away === hoveredTeam);
            const isHomeHovered = hoveredTeam && match.home === hoveredTeam;
            const isAwayHovered = hoveredTeam && match.away === hoveredTeam;

            return (
              <div 
                key={match.id} 
                className={`p-3.5 rounded-2xl transition-all duration-300 relative border card-shimmer ${
                  isHoveredMatch 
                    ? 'border-brand-neon bg-slate-900/90 shadow-neon ring-1 ring-brand-neon/30' 
                    : 'border-slate-800/80 bg-brand-cardBg'
                } flex flex-col gap-2.5`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-tight">
                  <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900/40 text-[9px]">{match.title}</span>
                  <span className="text-brand-neon font-black font-mono text-[9px]">{formatDisplayDate(match.date)}</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <BracketTeamSlot
                    teamCode={match.home}
                    isWinner={isHomeWinner}
                    isHovered={false}
                    onClick={() => handleKnockoutWinner(roundKey, idx, match.home)}
                    id={`m-slot-${match.id}-home`}
                    tbdText="TBD (Group Stage)"
                  />
                  <BracketTeamSlot
                    teamCode={match.away}
                    isWinner={isAwayWinner}
                    isHovered={false}
                    onClick={() => handleKnockoutWinner(roundKey, idx, match.away)}
                    id={`m-slot-${match.id}-away`}
                    tbdText="TBD (Group Stage)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
          const isHomeHovered = hoveredTeam && match.home === hoveredTeam;
          const isAwayHovered = hoveredTeam && match.away === hoveredTeam;

          return (
            <div 
              key={match.id} 
              id={`card-${match.id}`}
              className={`p-3 rounded-xl transition-all duration-300 relative border card-shimmer ${
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
                  <BracketTeamSlot
                    teamCode={match.home}
                    isWinner={isHomeWinner}
                    isHovered={isHomeHovered}
                    onClick={() => handleKnockoutWinner(roundKey, actualIdx, match.home)}
                    onHover={setHoveredTeam}
                    id={`slot-${match.id}-home`}
                    tbdText="TBD (Group Stage)"
                  />
                  <BracketTeamSlot
                    teamCode={match.away}
                    isWinner={isAwayWinner}
                    isHovered={isAwayHovered}
                    onClick={() => handleKnockoutWinner(roundKey, actualIdx, match.away)}
                    onHover={setHoveredTeam}
                    id={`slot-${match.id}-away`}
                    tbdText="TBD (Group Stage)"
                  />
                </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Share Button */}
      <div className="flex justify-end">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-brand-neon transition-all cursor-pointer select-none active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{shareCopied ? 'Copied!' : 'Share Predictions'}</span>
        </button>
      </div>
      {/* Mobile-optimized Vertical/Pill Bracket view */}
      <div className="block md:hidden">
        {/* Pills Selector */}
        <div className="flex items-center justify-between bg-slate-950/60 p-1 rounded-xl border border-slate-900 mb-4 gap-1">
          {['r32', 'r16', 'qf', 'sf', 'final'].map((rk) => {
            const label = rk === 'r32' ? 'R32' : rk === 'r16' ? 'R16' : rk === 'qf' ? 'QF' : rk === 'sf' ? 'SF' : 'Final';
            return (
              <button
                key={rk}
                onClick={() => setActiveRoundTab(rk)}
                className={`flex-1 py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                  activeRoundTab === rk 
                    ? 'bg-brand-neon text-slate-950 shadow-neon font-black' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {renderMobileRound()}
      </div>

      {/* Tree Bracket Container (Scrollable horizontally) - Desktop Only */}
      <div className="hidden md:block overflow-x-auto pb-6">
        <div className="min-w-[1280px] flex gap-4 items-center justify-between select-none relative z-10" ref={containerRef}>
          
          {/* SVG overlay for connector lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-[5]" style={{ overflow: 'visible' }}>
            {lines.map(line => {
              const isHovered = hoveredTeam && line.activeTeamCode === hoveredTeam;
              const dx = Math.abs(line.x2 - line.x1) / 2;
              const pathData = line.side === 'left'
                ? `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`
                : `M ${line.x1} ${line.y1} C ${line.x1 - dx} ${line.y1}, ${line.x2 + dx} ${line.y2}, ${line.x2} ${line.y2}`;

              return (
                <path
                  key={line.id}
                  d={pathData}
                  fill="none"
                  stroke={isHovered ? 'var(--color-brand-neon)' : 'rgba(255, 255, 255, 0.18)'}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeLinecap="round"
                  className={isHovered ? 'active-connector-path' : ''}
                  style={{
                    transition: 'stroke 0.3s, stroke-width 0.3s, filter 0.3s',
                    filter: isHovered ? 'drop-shadow(0 0 6px var(--color-brand-neon))' : 'none'
                  }}
                />
              );
            })}
          </svg>
          
          {/* --- LEFT BRACKET --- */}
          {renderBracketColumn('r32', bracket.r32.slice(0, 8))}
          {renderBracketColumn('r16', bracket.r16.slice(0, 4))}
          {renderBracketColumn('qf', bracket.qf.slice(0, 2))}
          {renderBracketColumn('sf', bracket.sf.slice(0, 1))}

          {/* --- CENTER: TROPHY & FINAL --- */}
          <div className={`flex flex-col items-center justify-center min-w-[280px] p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/90 border border-brand-gold/20 shadow-gold relative transition-all duration-500 ${tournamentChampion ? 'holo-card-shine shadow-gold/60 border-brand-gold/50' : ''}`}>
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
              const isHomeHovered = hoveredTeam && match.home === hoveredTeam;
              const isAwayHovered = hoveredTeam && match.away === hoveredTeam;

              return (
                <div key={match.id} className="w-full flex flex-col gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">The Grand Final</p>
                    <p className="text-[9px] text-brand-neon font-bold font-mono">{formatDisplayDate(match.date)}</p>
                    <p className="text-[8px] text-slate-500 font-semibold mt-0.5">New York/New Jersey</p>
                  </div>

                  <div id={`card-${match.id}`} className="flex flex-col gap-2 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                    <BracketTeamSlot
                      teamCode={match.home}
                      isWinner={isHomeWinner}
                      isHovered={isHomeHovered}
                      onClick={() => handleKnockoutWinner('final', idx, match.home)}
                      onHover={setHoveredTeam}
                      id="slot-final-home"
                      tbdText="TBD SF 1 Winner"
                      isFinal
                    />
                    <BracketTeamSlot
                      teamCode={match.away}
                      isWinner={isAwayWinner}
                      isHovered={isAwayHovered}
                      onClick={() => handleKnockoutWinner('final', idx, match.away)}
                      onHover={setHoveredTeam}
                      id="slot-final-away"
                      tbdText="TBD SF 2 Winner"
                      isFinal
                    />
                  </div>
                </div>
              );
            })}

            {/* Champion Reveal Box */}
            {tournamentChampion ? (
              <div className="mt-5 text-center animate-fadeIn">
                <p className="text-[10px] text-brand-neon font-bold tracking-widest">WORLD CUP CHAMPION</p>
                <p className="text-lg font-extrabold text-white flex items-center gap-1.5 justify-center mt-1 holo-shine">
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
