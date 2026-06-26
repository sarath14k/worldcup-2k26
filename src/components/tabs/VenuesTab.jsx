import { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { VENUES, TEAMS } from '../../data/worldcupData';
import { getMatchVenue, formatDisplayDate } from '../../utils/matchHelpers';

export const VenuesTab = ({ groupMatches, bracket, liveMatches, isLiveMatch }) => {
  const [expandedVenue, setExpandedVenue] = useState(null);

  // Compute matches at the currently expanded venue
  const matchesAtVenue = useMemo(() => {
    if (!expandedVenue) return [];
    const list = [];
    groupMatches.forEach(m => {
      if (getMatchVenue(m) === expandedVenue) {
        list.push({ ...m, round: 'Group ' + m.group });
      }
    });
    Object.keys(bracket).forEach(roundKey => {
      bracket[roundKey].forEach(m => {
        if (getMatchVenue(m) === expandedVenue) {
          let roundName = 'Round of 32';
          if (roundKey === 'r16') roundName = 'Round of 16';
          if (roundKey === 'qf') roundName = 'Quarter-Final';
          if (roundKey === 'sf') roundName = 'Semi-Final';
          if (roundKey === 'final') roundName = 'Grand Final';
          list.push({ ...m, round: roundName });
        }
      });
    });
    return list;
  }, [expandedVenue, groupMatches, bracket]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      <div className="p-4 rounded-2xl bg-brand-cardBg border border-slate-800/80">
        <h2 className="text-base font-bold text-white">16 Stadium Venues</h2>
        <p className="text-xs text-slate-400">Discover the iconic hosting stadiums across the United States, Canada, and Mexico.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {VENUES.map(venue => {
          const isExpanded = expandedVenue === venue.name;
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + ', ' + venue.city)}`;
          return (
            <div 
              key={venue.name} 
              role="button"
              tabIndex={0}
              onClick={() => setExpandedVenue(isExpanded ? null : venue.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedVenue(isExpanded ? null : venue.name);
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border bg-brand-cardBg flex flex-col justify-between transition-all cursor-pointer select-none ${
                isExpanded 
                  ? 'border-brand-purple shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-brand-purple/35' 
                  : 'border-slate-800/80 sm:hover:border-brand-purple/50 sm:hover:-translate-y-0.5 duration-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-brand-neon bg-brand-neon/10 border border-brand-neon/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    {venue.flag} {venue.country}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Cap: {venue.capacity.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 mb-1">{venue.name}</h3>
                <p className="text-xs font-semibold text-brand-purple flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {venue.city}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{venue.desc}</p>
              </div>

              <div className={`expand-grid ${isExpanded ? 'open' : ''}`}>
                <div>
                  <div className={`${isExpanded ? 'mt-4 pt-4 border-t border-slate-800/80' : ''} flex flex-col gap-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Scheduled Matches</span>
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
                        {matchesAtVenue.length} Matches
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {matchesAtVenue.map((m, idx) => {
                        const homeTeamObj = TEAMS[m.home];
                        const awayTeamObj = TEAMS[m.away];
                        const homeFlag = homeTeamObj ? homeTeamObj.flag : '🏳️';
                        const awayFlag = awayTeamObj ? awayTeamObj.flag : '🏳️';
                        const homeName = m.home || 'TBD';
                        const awayName = m.away || 'TBD';
                        
                        const live = liveMatches[m.id];
                        const isLive = isLiveMatch(live);
                        const hasScore = m.isCompleted || (live && (live.minute === 'FT' || live.isCompleted || live.homeScore !== null));
                        const homeScore = m.isCompleted ? m.homeScore : (live ? live.homeScore : null);
                        const awayScore = m.isCompleted ? m.awayScore : (live ? live.awayScore : null);

                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-900/60 flex flex-col gap-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                              <span className="text-brand-purple">{m.round}</span>
                              <span>{formatDisplayDate(m.date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                <span>{homeFlag}</span>
                                <span>{homeName}</span>
                              </div>
                              {hasScore ? (
                                <div className="flex items-center gap-1 font-mono font-black text-brand-neon">
                                  <span>{homeScore}</span>
                                  <span className="text-slate-600">:</span>
                                  <span>{awayScore}</span>
                                  {isLive && <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse ml-1" />}
                                </div>
                              ) : (
                                <span className="text-[9px] font-extrabold text-slate-600 font-mono">VS</span>
                              )}
                              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                                <span>{awayName}</span>
                                <span>{awayFlag}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {matchesAtVenue.length === 0 && (
                        <span className="text-[10px] text-slate-500 text-center py-4">No matches scheduled.</span>
                      )}
                    </div>
                    
                    <a 
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-xs font-bold text-slate-350 hover:text-white transition-all w-full mt-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-neon" />
                      <span>Get Directions (Google Maps)</span>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-800/60 mt-4 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                <span>{isExpanded ? 'CLICK TO COLLAPSE' : 'CLICK TO VIEW MATCHES'}</span>
                <span>2026 WORLD CUP HOST</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
