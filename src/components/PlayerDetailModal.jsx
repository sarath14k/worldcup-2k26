import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const FOTMOB_IMG = (id) => `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const StatBadge = ({ label, value }) => (
  <div className="flex flex-col items-center bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700/30 min-w-[60px]">
    <span className="text-lg font-black text-white">{value ?? '-'}</span>
    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{label}</span>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40 last:border-0">
    <span className="text-xs text-slate-400 font-semibold">{label}</span>
    <span className="text-xs font-bold text-white">{value ?? '-'}</span>
  </div>
);

export const PlayerDetailModal = ({ playerId, name, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(`/api/player-detail/${playerId}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [playerId]);

  const imageUrl = FOTMOB_IMG(playerId);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 animate-modalEnter"
      style={{ background: 'rgba(2, 6, 23, 0.85)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative bg-gradient-to-b from-slate-800/80 to-slate-900/80 px-5 pt-6 pb-4 shrink-0">
          <button
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white transition-colors bg-slate-950/60 hover:bg-slate-950/80 rounded-full border border-slate-700/40 cursor-pointer z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <img
                src={imageUrl}
                alt={name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-700/60 shadow-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-white truncate">{data?.name || name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {data?.country && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">{data.country}</span>
                )}
                {data?.position && (
                  <span className="text-[10px] font-bold text-brand-neon bg-brand-neon/10 px-2 py-0.5 rounded-full">{data.position}</span>
                )}
              </div>
              {data?.teamName && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.teamColors?.color || '#475569' }} />
                  <span className="text-xs font-semibold text-slate-300 truncate">{data.teamName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shirt number badge */}
          {data?.shirt && (
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-700/50 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-black text-white">#{data.shirt}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-brand-neon border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && data && (
            <>
              {/* Season Stats */}
              {Object.keys(data.seasonStats || {}).length > 0 && (
                <div className="px-4 pt-4 pb-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Season Stats</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.seasonStats).map(([key, val]) => (
                      <StatBadge key={key} label={key} value={val} />
                    ))}
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="px-4 py-2">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Info</div>
                <div className="bg-slate-800/30 rounded-xl px-3 py-1 border border-slate-800/40">
                  <InfoRow label="Age" value={data.age} />
                  <InfoRow label="Height" value={data.height} />
                  <InfoRow label="Preferred Foot" value={data.foot} />
                  <InfoRow label="Market Value" value={data.marketValue} />
                  <InfoRow label="Contract Until" value={data.contractEnd?.slice?.(0, 4) || null} />
                </div>
              </div>

              {/* Recent Matches */}
              {data.recentMatches?.length > 0 && (
                <div className="px-4 pb-4">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Recent Matches</div>
                  <div className="space-y-1">
                    {data.recentMatches.slice(0, 8).map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800/20 rounded-lg px-3 py-2 border border-slate-800/30">
                        <span className="text-[10px] text-slate-500 font-mono w-12 shrink-0">{formatDate(m.matchDate)}</span>
                        <span className="text-[11px] font-bold text-slate-300 truncate min-w-0 flex-1">
                          {m.isHomeTeam ? '' : '@ '}{m.opponentTeamName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-200 shrink-0">
                          {m.homeScore}-{m.awayScore}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{m.minutesPlayed}'</span>
                        {m.goals > 0 && <span className="text-[10px] font-bold text-emerald-400 shrink-0">{m.goals}G</span>}
                        {m.assists > 0 && <span className="text-[10px] font-bold text-blue-400 shrink-0">{m.assists}A</span>}
                        {m.rating && (
                          <span className={`text-[10px] font-black font-mono shrink-0 ${
                            m.rating >= 8 ? 'text-brand-neon' : m.rating >= 7 ? 'text-emerald-400' : m.rating >= 6 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {Number(m.rating).toFixed(1)}
                          </span>
                        )}
                        {m.playerOfTheMatch && <span className="text-[10px] shrink-0">⭐</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !data && (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm font-semibold">
              No detail data available
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
