import { useState, useEffect } from 'react';
import { Star, Share2 } from 'lucide-react';
import { TEAMS } from '../../data/worldcupData';
import { WorldCupTrophyIcon, formatDisplayDate } from '../../utils/matchHelpers';
import { BracketTeamSlot } from '../BracketTeamSlot';

export const BracketTab = ({
  bracket,
  tournamentChampion,
  burnedMatches = new Set(),
  handleKnockoutWinner,
  onRestoreBracket,
  onResetPredictions
}) => {
  const [activeRoundTab, setActiveRoundTab] = useState('r32');
  const [shareCopied, setShareCopied] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState(null);

  const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'];
  const isRoundDone = (rk) => {
    const matches = bracket[rk] || [];
    return matches.length > 0 && matches.every(m => m.winner);
  };
  const firstIncompleteIdx = ROUND_ORDER.findIndex(rk => !isRoundDone(rk));
  const unlockedRounds = ROUND_ORDER.map(rk => isRoundDone(rk));

  // Auto-advance to next incomplete round when current round is fully predicted
  useEffect(() => {
    const curIdx = ROUND_ORDER.indexOf(activeRoundTab);
    if (curIdx >= 0 && curIdx < ROUND_ORDER.length - 1 && isRoundDone(activeRoundTab)) {
      setActiveRoundTab(ROUND_ORDER[curIdx + 1]);
    }
  }, [bracket, activeRoundTab]);

  // Restore bracket from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#bracket=')) {
      try {
        const data = JSON.parse(atob(hash.slice(9)));
        if (data && onRestoreBracket) {
          onRestoreBracket(data);
          setRestoreMessage('Bracket restored from shared link!');
          setTimeout(() => setRestoreMessage(null), 4000);
        }
      } catch (e) {
        console.warn('[Bracket] Failed to restore from URL:', e);
        setRestoreMessage('Failed to restore bracket from link');
        setTimeout(() => setRestoreMessage(null), 4000);
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
            const isHomeWinner = match.winner === match.home && match.winner !== null;
            const isAwayWinner = match.winner === match.away && match.winner !== null;
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
                    locked={burnedMatches.has(match.id)}
                    onClick={() => handleKnockoutWinner('final', idx, match.home)}
                    id="m-slot-final-home"
                    tbdText="TBD SF 1 Winner"
                    isFinal
                  />
                  <BracketTeamSlot
                    teamCode={match.away}
                    isWinner={isAwayWinner}
                    locked={burnedMatches.has(match.id)}
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

            return (
              <div 
                key={match.id} 
                className="p-3.5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-tight">
                  <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900/40 text-[9px]">{match.title}</span>
                  <span className="text-brand-neon font-black font-mono text-[9px]">{formatDisplayDate(match.date)}</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <BracketTeamSlot
                    teamCode={match.home}
                    isWinner={isHomeWinner}
                    locked={burnedMatches.has(match.id)}
                    onClick={() => handleKnockoutWinner(roundKey, idx, match.home)}
                    id={`m-slot-${match.id}-home`}
                    tbdText="TBD (Group Stage)"
                  />
                  <BracketTeamSlot
                    teamCode={match.away}
                    isWinner={isAwayWinner}
                    locked={burnedMatches.has(match.id)}
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
      {/* Restore feedback message */}
      {restoreMessage && (
        <div className={`text-xs font-bold text-center py-2 px-3 rounded-xl border mb-3 ${
          restoreMessage.includes('Failed')
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-brand-neon/10 border-brand-neon/30 text-brand-neon'
        }`}>
          {restoreMessage}
        </div>
      )}

      {/* Reset Predictions button */}
      {ROUND_ORDER.some(rk => isRoundDone(rk)) && (
        <div className="mb-3">
          <button
            onClick={onResetPredictions}
            className="w-full py-2 px-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 text-xs font-bold text-slate-300 hover:text-red-300 transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center gap-1.5"
          >
            Reset Predictions
          </button>
        </div>
      )}

      {/* Pills Selector - All screen sizes */}
      <div className="flex items-center justify-between bg-slate-950/60 p-1 rounded-xl border border-slate-900 mb-4 gap-1">
        {ROUND_ORDER.map((rk, idx) => {
          const label = rk === 'r32' ? 'R32' : rk === 'r16' ? 'R16' : rk === 'qf' ? 'QF' : rk === 'sf' ? 'SF' : 'Final';
          const allDone = isRoundDone(rk);
          const isLocked = idx > firstIncompleteIdx && !allDone;
          const isFirstIncomplete = idx === firstIncompleteIdx;
          return (
            <button
              key={rk}
              disabled={isLocked}
              onClick={() => setActiveRoundTab(rk)}
              className={`relative flex-1 py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition-all select-none ${
                isLocked ? 'text-slate-700 cursor-not-allowed' :
                activeRoundTab === rk
                  ? 'bg-brand-neon text-slate-950 shadow-neon font-black cursor-pointer'
                  : 'text-slate-400 hover:text-slate-300 cursor-pointer'
              } ${allDone && activeRoundTab !== rk ? 'ring-1 ring-brand-neon/30' : ''} ${isFirstIncomplete && !allDone ? 'ring-1 ring-brand-neon/40 animate-pulse' : ''}`}
              aria-label={`${label}${allDone ? ' (completed)' : isLocked ? ' (locked)' : ''}`}
            >
              {label}
              {allDone && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-neon rounded-full flex items-center justify-center text-[7px] text-slate-950 font-black leading-none shadow-neon">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {renderMobileRound()}
    </div>
  );
};
