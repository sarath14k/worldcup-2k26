import { Check } from 'lucide-react';
import { TEAMS } from '../data/worldcupData';
import { ScrollingText } from './ScrollingText';

export const BracketTeamSlot = ({ teamCode, isWinner, isHovered, onClick, onHover, id, tbdText, isFinal }) => {
  const team = TEAMS[teamCode];
  const hasTeam = !!teamCode;

  let className = 'flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all text-xs font-bold';
  if (!hasTeam) {
    className += ' text-slate-600 bg-slate-950/20 cursor-not-allowed';
  } else if (isHovered) {
    className += ' bg-brand-neon/20 text-white ring-2 ring-brand-neon shadow-neon cursor-pointer scale-[1.02] z-10';
  } else if (isWinner) {
    if (isFinal) {
      className += ' bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/50 shadow-gold cursor-pointer hover:bg-brand-gold/30';
    } else {
      className += ' bg-brand-neon/15 text-brand-neon ring-1 ring-brand-neon/30 font-extrabold cursor-pointer hover:bg-brand-neon/25';
    }
  } else {
    className += ' bg-slate-950/30 text-slate-350 cursor-pointer hover:bg-slate-900/60 hover:text-white';
  }

  return (
    <div
      id={id}
      onClick={hasTeam ? onClick : undefined}
      onKeyDown={hasTeam ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      role={hasTeam ? "button" : undefined}
      tabIndex={hasTeam ? 0 : undefined}
      onMouseEnter={hasTeam && onHover ? () => onHover(teamCode) : undefined}
      onMouseLeave={hasTeam && onHover ? () => onHover(null) : undefined}
      className={className}
    >
      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
        <span className="text-lg shrink-0">{team ? team.flag : '🏳️'}</span>
        <ScrollingText text={team ? team.name : tbdText} className="text-slate-350" />
      </div>
      {isWinner && <Check className={`w-3.5 h-3.5 shrink-0 ${isFinal ? 'text-brand-gold' : ''}`} />}
    </div>
  );
};
