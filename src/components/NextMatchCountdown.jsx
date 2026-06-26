import { useState, useEffect } from 'react';
import { TEAMS } from '../data/worldcupData';
import { parseMatchKickoff } from '../utils/matchHelpers';

export const NextMatchCountdown = ({ upcomingFixtures }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const nextMatch = upcomingFixtures?.[0];

  useEffect(() => {
    const kickoff = parseMatchKickoff(nextMatch);
    if (!kickoff) return;

    const tick = () => {
      const diff = kickoff.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('KICKING OFF!'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextMatch]);

  if (!nextMatch) return null;

  const home = TEAMS[nextMatch.home] || { flag: '🏳️', name: 'TBD' };
  const away = TEAMS[nextMatch.away] || { flag: '🏳️', name: 'TBD' };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-neon/10 via-slate-900/80 to-brand-purple/10 border border-brand-neon/20 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,135,0.08),transparent_70%)] pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{home.flag}</span>
          <span className="font-black text-sm text-slate-200 truncate">{home.name}</span>
          <span className="text-xs font-extrabold text-slate-500 px-2">VS</span>
          <span className="font-black text-sm text-slate-200 truncate">{away.name}</span>
          <span className="text-2xl">{away.flag}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next Match</div>
            <div className={`font-mono font-black text-lg tracking-wider ${timeLeft === 'KICKING OFF!' ? 'text-brand-neon animate-pulse' : 'text-brand-neon'}`}>
              {timeLeft}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
