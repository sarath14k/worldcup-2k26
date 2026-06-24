import { useState } from 'react';
import { Search, X, Star } from 'lucide-react';
import { TEAMS } from '../../data/worldcupData';
import { ScrollingText } from '../ScrollingText';

export const PlayerRatingsTab = ({ fotmobRatings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Filter ratings based on search query (name or country)
  const filteredRatings = fotmobRatings.filter(player => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const teamInfo = TEAMS[player.team] || { name: player.team };
    return (
      player.name.toLowerCase().includes(query) ||
      player.team.toLowerCase().includes(query) ||
      teamInfo.name.toLowerCase().includes(query)
    );
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setVisibleCount(10); // Reset pagination on new search
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setVisibleCount(10);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const displayedRatings = filteredRatings.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      {/* Header Panel */}
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

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-550 z-10">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/20 outline-none text-xs font-bold text-slate-200 placeholder:text-slate-505 tracking-wide transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main List Container */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col gap-3">
        <div className="grid grid-cols-12 text-[10px] text-slate-505 font-extrabold uppercase tracking-widest px-3 border-b border-slate-900/60 pb-2 mb-1">
          <span className="col-span-2 sm:col-span-1">Rank</span>
          <span className="col-span-7 sm:col-span-9">Player Details</span>
          <span className="col-span-3 sm:col-span-2 text-right">FotMob Rating</span>
        </div>

        {displayedRatings.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-505 italic font-bold">
            No matching players found. Try searching for another name or country.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayedRatings.map((player, idx) => {
              const teamInfo = TEAMS[player.team] || { name: player.team, flag: '🏳️' };
              
              // We use player.rank if available, otherwise construct from overall index
              const displayRank = player.rank || (idx + 1);

              return (
                <div 
                  key={`${player.name}-${player.team}-${idx}`}
                  className="grid grid-cols-12 items-center bg-slate-950/25 border border-slate-900/60 hover:border-slate-800 hover:bg-slate-900/10 rounded-xl p-3 text-xs font-bold text-slate-200 transition-all card-shimmer"
                >
                  {/* Position Badge */}
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

                  {/* Player and Country */}
                  <div className="col-span-7 sm:col-span-9 flex items-center gap-2 min-w-0">
                    <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-350 font-mono tracking-wider shrink-0 select-none">
                      {player.team}
                    </span>
                    <span className="text-base shrink-0 select-none" title={teamInfo.name}>
                      {teamInfo.flag}
                    </span>
                    <div className="flex items-center min-w-0 max-w-[120px] sm:max-w-xs md:max-w-md">
                      <ScrollingText text={player.name} className="text-slate-100 font-bold" />
                    </div>
                  </div>

                  {/* Rating display */}
                  <div className="col-span-3 sm:col-span-2 flex justify-end items-center gap-1.5 font-mono">
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
                      {player.rating.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
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
  );
};
