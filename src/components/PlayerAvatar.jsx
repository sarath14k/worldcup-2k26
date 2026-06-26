import { useState } from 'react';
import playerImages from '../data/playerImages.json';

const FALLBACK_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-brand-neon to-emerald-500',
  'from-brand-purple to-violet-600',
  'from-brand-royal to-blue-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-500',
  'from-brand-gold to-amber-600',
];

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorIndex(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % FALLBACK_COLORS.length;
}

export const PlayerAvatar = ({ name, size = 'md', className = '', playerId, onPlayerClick }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const imageUrl = playerImages.byName[name];
  const initials = getInitials(name);
  const colorClass = FALLBACK_COLORS[getColorIndex(name)];
  const showImage = imageUrl && !errored;
  const clickable = Boolean(onPlayerClick) && Boolean(playerId);

  const handleClick = () => {
    if (onPlayerClick && playerId) onPlayerClick(playerId, name);
  };

  const sizeMap = {
    xs: 'w-5 h-5 text-[7px]',
    sm: 'w-6 h-6 text-[8px]',
    md: 'w-8 h-8 text-[10px]',
    lg: 'w-10 h-10 text-xs',
    xl: 'w-14 h-14 text-sm',
  };

  const imgSizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div
      className={`relative shrink-0 ${imgSizeMap[size]} ${clickable ? 'cursor-pointer' : ''} ${className}`}
      onClick={clickable ? handleClick : undefined}
    >
      {showImage && (
        <img
          src={imageUrl}
          alt={name}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`${imgSizeMap[size]} rounded-full object-cover border-2 border-slate-700/60 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
          loading="lazy"
        />
      )}
      {(!showImage || !loaded) && (
        <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center font-black text-white border-2 border-white/20 leading-none`}>
          {initials}
        </div>
      )}
    </div>
  );
};
