import { useState, useMemo } from 'react';
import { Search, X, Star, Filter } from 'lucide-react';
import { TEAMS } from '../../data/worldcupData';
import { ScrollingText } from '../ScrollingText';
import { PlayerAvatar } from '../PlayerAvatar';
import { PlayerDetailModal } from '../PlayerDetailModal';
import { getPositionLabel, getPositionCategory, getCategoryColor, POSITION_CATEGORIES } from '../../utils/positions';

export const PlayerRatingsTab = ({ fotmobRatings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [positionFilter, setPositionFilter] = useState('');
  const [detailPlayer, setDetailPlayer] = useState(null);

  const filteredRatings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return fotmobRatings.filter(player => {
      if (positionFilter && getPositionCategory(player.position) !== positionFilter) return false;
      if (!query) return true;
      const teamInfo = TEAMS[player.team] || { name: player.team };
      return (
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        teamInfo.name.toLowerCase().includes(query)
      );
    });
  }, [fotmobRatings, searchQuery, positionFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(10);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setVisibleCount(10);
  };

  const handleLoadMore = () => setVisibleCount(prev => prev + 10);

  const displayedRatings = filteredRatings.slice(0, visibleCount);

  return (
    <><div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      <div className="p-4 rounded-2xl bg-brand-cardBg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-brand-gold select-none text-lg">⭐</span>
            All Player Performance Ratings
          </h2>
          <p className="text-xs text-slate-450">
            Compare all tournament players based on their average FotMob match ratings.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Position Filter */}
          <div className="flex items-center gap-1 bg-slate-950/60 rounded-xl border border-slate-800/80 p-1">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
            {POSITION_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setPositionFilter(positionFilter === cat ? '' : cat)}
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
                  positionFilter === cat
                    ? `${getCategoryColor(cat)} ring-1 ring-white/20`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
            {positionFilter && (
              <button
                onClick={() => setPositionFilter('')}
                className="text-slate-600 hover:text-slate-400 p-0.5 cursor-pointer bg-transparent border-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-550 z-10">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              placeholder="Search..."
              aria-label="Search players"
              onChange={handleSearchChange}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 outline-none text-xs font-bold text-slate-200 placeholder:text-slate-505 tracking-wide transition-all"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all cursor-pointer bg-transparent border-0 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col gap-3">
        <div className="grid grid-cols-12 text-[10px] text-slate-505 font-extrabold uppercase tracking-widest px-3 border-b border-slate-900/60 pb-2 mb-1">
          <span className="col-span-2 sm:col-span-1">Rank</span>
          <span className="col-span-7 sm:col-span-7">Player Details</span>
          <span className="col-span-3 sm:col-span-4 text-right">FotMob Rating</span>
        </div>

        {fotmobRatings.length === 0 ? (
          <div className="flex flex-col gap-2.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-stagger grid grid-cols-12 items-center bg-slate-950/25 border border-slate-900/60 rounded-xl p-3 skeleton-shimmer" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="col-span-2 sm:col-span-1 flex justify-start">
                  <div className="w-5.5 h-5.5 rounded-lg bg-slate-800/50" />
                </div>
                <div className="col-span-7 sm:col-span-7 flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800/50" />
                  <div className="w-8 h-4 rounded bg-slate-800/50" />
                  <div className="w-5 h-5 rounded-full bg-slate-800/50" />
                  <div className="w-24 h-3 rounded bg-slate-800/50" />
                  <div className="w-6 h-3 rounded-full bg-slate-800/50" />
                </div>
                <div className="col-span-3 sm:col-span-4 flex justify-end">
                  <div className="w-14 h-5 rounded-md bg-slate-800/50" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedRatings.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-505 italic font-bold">
            No matching players found. Try searching for another name or country.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedRatings.map((player, idx) => {
              const teamInfo = TEAMS[player.team] || { name: player.team, flag: '🏳️' };
              const displayRank = player.rank || (idx + 1);
              const posLabel = getPositionLabel(player.position);
              const posCat = getPositionCategory(player.position);

              return (
                <div
                  key={`${player.name}-${player.team}-${idx}`}
                  className="animate-stagger grid grid-cols-12 items-center bg-slate-950/25 border border-slate-900/60 hover:border-slate-800 hover:bg-slate-900/10 rounded-xl p-3 text-xs font-bold text-slate-200 transition-all card-shimmer"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="col-span-2 sm:col-span-1 flex justify-start">
                    <div className={`flex items-center justify-center w-5.5 h-5.5 rounded-lg font-black text-[9px] border ${
                      displayRank === 1
                        ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                        : displayRank === 2
                          ? 'bg-slate-400/10 border-slate-400/30 text-slate-350'
                          : displayRank === 3
                            ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-405'
                    }`}>
                      {displayRank}
                    </div>
                  </div>

                  <div className="col-span-7 sm:col-span-7 flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => setDetailPlayer({ id: player.playerId, name: player.name })}>
                    <PlayerAvatar name={player.name} size="md" playerId={player.playerId} onPlayerClick={(id, name) => setDetailPlayer({ id, name })} />
                    <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-350 font-mono tracking-wider shrink-0 select-none">
                      {player.team}
                    </span>
                    <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                      {teamInfo.flag}
                    </span>
                    <div className="flex items-center min-w-0 flex-1">
                      <ScrollingText text={player.name} className="text-slate-100 font-bold" />
                    </div>
                    {posLabel && (
                      <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded-full border shrink-0 ${getCategoryColor(posCat)}`}>
                        {posLabel}
                      </span>
                    )}
                  </div>

                  <div className="col-span-3 sm:col-span-4 flex justify-end items-center gap-1.5 font-mono">
                    <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold shrink-0" />
                    <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                      player.rating >= 8.0
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : player.rating >= 7.0
                          ? 'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
                          : player.rating >= 6.0
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {player.rating != null ? Number(player.rating).toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredRatings.length > visibleCount && (
          <div className="flex justify-center mt-3 pt-3 border-t border-slate-900/60">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 rounded-xl bg-slate-900 border border-slate-850 text-slate-300 hover:text-white hover:border-slate-700 transition-all font-bold text-xs select-none cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              Show More Players
              <span className="text-[10px] text-slate-500">
                ({visibleCount} of {filteredRatings.length})
              </span>
            </button>
          </div>
        )}
      </div>
    </div>

    {detailPlayer && (
      <PlayerDetailModal playerId={detailPlayer.id} name={detailPlayer.name} onClose={() => setDetailPlayer(null)} />
    )}</>
  );
};
