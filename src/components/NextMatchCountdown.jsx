import { useState, useEffect, useRef } from 'react';
import { TEAMS } from '../data/worldcupData';
import { FifaRankBadge } from '../utils/matchHelpers';

function parseDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  try {
    const s = dateStr.replace(' IST', '');
    const [dayPart, timePart] = s.split(', ');
    if (!dayPart || !timePart) return null;
    const [monthStr, dayStr] = dayPart.split(' ');
    const [hhmm, ampm] = timePart.split(' ');
    if (!hhmm || !ampm) return null;
    const [hourStr, minStr] = hhmm.split(':');
    let h = parseInt(hourStr, 10);
    if (isNaN(h)) return null;
    const m = parseInt(minStr, 10);
    if (isNaN(m)) return null;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const months = { June: '06', July: '07' };
    const mon = months[monthStr];
    if (!mon) return null;
    const iso = `2026-${mon}-${dayStr.padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatDiff(ms) {
  if (ms <= 0) return 'KICKING OFF!';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`;
}

export const NextMatchCountdown = ({ upcomingFixtures }) => {
  const nextMatch = upcomingFixtures?.[0];
  const kickoffRef = useRef(null);
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const kickoff = parseDateStr(nextMatch?.date);
    kickoffRef.current = kickoff;
    if (!kickoff) { setDisplay(''); return; }
    const tick = () => setDisplay(formatDiff(kickoff.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextMatch?.date, nextMatch?.id]);

  if (!nextMatch || !display) return null;

  const home = TEAMS[nextMatch.home] || { flag: '🏳️', name: 'TBD' };
  const away = TEAMS[nextMatch.away] || { flag: '🏳️', name: 'TBD' };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-neon/10 via-slate-900/80 to-brand-purple/10 border border-brand-neon/20 backdrop-blur-md relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,135,0.08),transparent_70%)] pointer-events-none" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl">{home.flag}</span>
            <div className="flex flex-col items-start">
              <span className="font-black text-sm text-slate-200 truncate max-w-[100px] sm:max-w-none">{home.name}</span>
              <FifaRankBadge teamCode={nextMatch.home} />
            </div>
          </div>
          <span className="text-xs font-extrabold text-slate-500 px-1">VS</span>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-end">
              <span className="font-black text-sm text-slate-200 truncate max-w-[100px] sm:max-w-none">{away.name}</span>
              <FifaRankBadge teamCode={nextMatch.away} />
            </div>
            <span className="text-2xl">{away.flag}</span>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next Match</div>
          <div className={`font-mono font-black text-lg tracking-wider ${display === 'KICKING OFF!' ? 'text-brand-neon animate-pulse' : 'text-brand-neon'}`}>
            {display}
          </div>
        </div>
      </div>
    </div>
  );
};
