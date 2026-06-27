export const MatchTimeline = ({ events, home, away, homeCode, awayCode }) => {
  if (!events || events.length === 0) return null;
  return (
    <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <span>⏱️</span> Match Timeline
      </h4>
      <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {events.slice().reverse()
          .filter(event => event.text?.trim() || event.type?.trim())
          .map((event, idx) => {
            const normalize = (name) => name?.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '') || '';
            const normText = normalize(event.text);
            const normHomeName = normalize(home.name);
            const normAwayName = normalize(away.name);

            const isHome = normText.includes(normHomeName) ||
                           (event.text?.toLowerCase() || '').includes(homeCode.toLowerCase());
            const isAway = normText.includes(normAwayName) ||
                           (event.text?.toLowerCase() || '').includes(awayCode.toLowerCase());
            const eventFlag = isHome ? home.flag : (isAway ? away.flag : null);

            let icon = '🔔';
            const typeLower = event.type.toLowerCase();
            const textLower = (event.text || '').toLowerCase();
            const isSave = typeLower.includes('save') || textLower.includes('saved');
            const isBlock = typeLower.includes('prevent') || textLower.includes('blocked');
            const isAttempt = typeLower.includes('attempt') || typeLower.includes('shot');
            const isGoal = (typeLower.includes('goal') || typeLower.includes('scorer') || typeLower.includes('score') || typeLower.includes('netted')) && !isAttempt && !isSave && !isBlock;
            const isMiss = typeLower.includes('miss') || textLower.includes('miss') || textLower.includes('wide') || textLower.includes('high') || textLower.includes('post') || textLower.includes('crossbar') || textLower.includes('off target');
            const isPrevention = isSave || isBlock;
            const isYellowCard = typeLower.includes('yellow');
            const isRedCard = typeLower.includes('red');
            const isSub = typeLower.includes('sub');

            if (isGoal) icon = '🥅';
            else if (isAttempt && isSave) icon = '🧤';
            else if (isAttempt && isBlock) icon = '🛡️';
            else if (isAttempt && isMiss) icon = '😭';
            else if (isAttempt) icon = '🎯';
            else if (isSave) icon = '🧤';
            else if (isBlock) icon = '🛡️';
            else if (typeLower.includes('corner')) icon = '⛳';
            else if (typeLower.includes('offside')) icon = '🚩';
            else if (typeLower.includes('foul') || typeLower.includes('handball')) icon = '🦵';
            else if (typeLower.includes('kick off') || typeLower.includes('start') || typeLower.includes('toss') || typeLower.includes('whistle') || typeLower.includes('half') || typeLower.includes('end')) icon = '🎬';
            else if (isYellowCard) icon = '🟨';
            else if (isRedCard) icon = '🟥';
            else if (isSub) icon = '🔄';

            return (
              <div
                key={`timeline-${idx}`}
                className={`flex items-start gap-3 bg-slate-950/40 border rounded-xl p-2.5 hover:bg-slate-900/40 transition-all duration-300 relative animate-fadeIn ${
                  isGoal
                    ? 'border-brand-neon/40 shadow-[0_0_15px_rgba(0,255,135,0.1)] bg-brand-neon/5'
                    : isRedCard
                      ? 'border-red-500/45 shadow-[0_0_15px_rgba(239,68,68,0.1)] bg-red-500/5'
                      : isYellowCard
                        ? 'border-yellow-500/45 shadow-[0_0_15px_rgba(234,179,8,0.1)] bg-yellow-500/5'
                        : isSub
                          ? 'border-indigo-500/45 shadow-[0_0_15px_rgba(99,102,241,0.1)] bg-indigo-500/5'
                          : isPrevention
                            ? 'border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.05)] bg-sky-500/5'
                            : 'border-slate-800/50 hover:border-slate-700/50'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border text-[11px] shrink-0 ${
                  isGoal
                    ? 'border-brand-neon/60 text-brand-neon shadow-neon'
                    : isRedCard
                      ? 'border-red-500/60 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : isYellowCard
                        ? 'border-yellow-500/60 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                        : isSub
                          ? 'border-indigo-500/60 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                          : isPrevention
                            ? 'border-sky-500/60 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                            : 'border-slate-800'
                }`}>
                  {icon}
                </div>

                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      isGoal
                        ? 'text-brand-neon'
                        : isRedCard
                          ? 'text-red-400'
                          : isYellowCard
                            ? 'text-yellow-400'
                            : isSub
                              ? 'text-indigo-400'
                              : isPrevention
                                ? 'text-sky-400'
                                : 'text-slate-400'
                    }`}>
                      {event.type}
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${isGoal ? 'text-brand-neon animate-pulse font-black' : 'text-brand-neon'}`}>
                      {event.minuteStr}
                    </span>
                  </div>
                  {event.text && (
                    <p className={`text-[10px] leading-relaxed pr-6 ${isGoal ? 'text-white font-extrabold' : 'text-slate-350 font-semibold'}`}>
                      {event.text}
                    </p>
                  )}
                  {eventFlag && (
                    <div className="absolute right-2.5 bottom-2.5">
                      <span className="text-xs">{eventFlag}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
