const getTeamTournamentStats = (teamCode, groupMatches, bracket, liveMatches) => {
  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let gf = 0;
  let ga = 0;
  let cleanSheets = 0;
  const form = [];

  const processMatch = (m) => {
    if (!m.isCompleted && !(liveMatches[m.id]?.isCompleted || liveMatches[m.id]?.minute === 'FT')) return;
    const isHome = m.home === teamCode;
    const isAway = m.away === teamCode;
    if (!isHome && !isAway) return;

    const live = liveMatches[m.id];
    const hs = m.isCompleted ? m.homeScore : (live ? live.homeScore : 0);
    const as = m.isCompleted ? m.awayScore : (live ? live.awayScore : 0);

    played++;
    const teamGoals = isHome ? hs : as;
    const opponentGoals = isHome ? as : hs;

    gf += teamGoals;
    ga += opponentGoals;
    if (opponentGoals === 0) cleanSheets++;

    if (teamGoals > opponentGoals) { won++; form.push({ date: m.date, result: 'W' }); }
    else if (teamGoals < opponentGoals) { lost++; form.push({ date: m.date, result: 'L' }); }
    else { drawn++; form.push({ date: m.date, result: 'D' }); }
  };

  if (Array.isArray(groupMatches)) groupMatches.forEach(processMatch);
  if (bracket) {
    Object.values(bracket).forEach(roundMatches => {
      if (Array.isArray(roundMatches)) roundMatches.forEach(processMatch);
    });
  }

  form.sort((a, b) => new Date(a.date) - new Date(b.date));
  const formResults = form.map(f => f.result);

  return {
    played, won, drawn, lost, gf, ga, gd: gf - ga, points: won * 3 + drawn,
    cleanSheets,
    avgGoalsScored: played > 0 ? (gf / played).toFixed(1) : '0.0',
    avgGoalsConceded: played > 0 ? (ga / played).toFixed(1) : '0.0',
    form: formResults
  };
};

const HISTORICAL_DB = [
  { teams: ['USA', 'MEX'], matches: [
    { year: 2024, comp: 'CONCACAF Nations League', score: '2-0', winner: 'USA' },
    { year: 2023, comp: 'CONCACAF Nations League', score: '3-0', winner: 'USA' },
    { year: 2021, comp: 'Gold Cup Final', score: '1-0', winner: 'USA' },
    { year: 2019, comp: 'Gold Cup Final', score: '0-1', winner: 'MEX' },
  ]},
  { teams: ['ARG', 'FRA'], matches: [
    { year: 2022, comp: 'World Cup Final', score: '3-3 (4-2 pens)', winner: 'ARG' },
    { year: 2018, comp: 'World Cup R16', score: '3-4', winner: 'FRA' },
    { year: 2009, comp: 'International Friendly', score: '2-0', winner: 'ARG' },
  ]},
  { teams: ['ENG', 'GER'], matches: [
    { year: 2022, comp: 'UEFA Euro Final', score: '1-1 (5-4 pens)', winner: 'ENG' },
    { year: 2021, comp: 'International Friendly', score: '2-0', winner: 'ENG' },
    { year: 2018, comp: 'World Cup R16', score: '2-1', winner: 'GER' },
  ]},
  { teams: ['BRA', 'URU'], matches: [
    { year: 2023, comp: 'World Cup Qualifier', score: '2-0', winner: 'BRA' },
    { year: 2022, comp: 'World Cup Qualifier', score: '3-0', winner: 'BRA' },
    { year: 2021, comp: 'Copa America Semi', score: '1-2', winner: 'URU' },
  ]},
  { teams: ['FRA', 'POR'], matches: [
    { year: 2024, comp: 'UEFA Euro Semi', score: '2-1', winner: 'FRA' },
    { year: 2022, comp: 'World Cup QF', score: '1-3', winner: 'POR' },
    { year: 2021, comp: 'UEFA Euro Group', score: '2-2', winner: 'Draw' },
  ]},
  { teams: ['ESP', 'POR'], matches: [
    { year: 2024, comp: 'International Friendly', score: '1-1', winner: 'Draw' },
    { year: 2022, comp: 'World Cup Group', score: '1-0', winner: 'ESP' },
  ]},
  { teams: ['NED', 'ENG'], matches: [
    { year: 2023, comp: 'UEFA Nations League', score: '2-0', winner: 'NED' },
    { year: 2019, comp: 'UEFA Nations League', score: '3-0', winner: 'NED' },
    { year: 1990, comp: 'World Cup Group', score: '0-0', winner: 'Draw' },
  ]}
];

function getHistoricalH2H(homeCode, awayCode) {
  const reversed = [homeCode, awayCode].sort().join('-');
  for (const entry of HISTORICAL_DB) {
    const sortedEntry = [...entry.teams].sort().join('-');
    if (sortedEntry === reversed) return entry.matches;
  }
  return [];
}

const renderComparativeStat = (label, valA, valB, formatFn = (x) => x) => {
  const numA = parseFloat(valA);
  const numB = parseFloat(valB);
  let pctA = 50;
  let pctB = 50;
  if (numA > 0 || numB > 0) {
    pctA = Math.round((numA / (numA + numB)) * 100);
    pctB = 100 - pctA;
  }
  return (
    <div key={label} className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-350 font-mono px-0.5">
        <span>{formatFn(valA)}</span>
        <span className="text-slate-500 font-sans uppercase tracking-wider text-[8px] font-black">{label}</span>
        <span>{formatFn(valB)}</span>
      </div>
      <div className="h-2 w-full bg-slate-955 rounded-full overflow-hidden flex relative gap-0.5 border border-slate-900/40">
        <div
          className="bg-gradient-to-r from-brand-neon to-emerald-500 h-full transition-all duration-500 rounded-r-sm shadow-[0_0_8px_rgba(0,255,135,0.2)]"
          style={{ width: `${pctA}%` }}
        />
        <div
          className="bg-gradient-to-l from-brand-purple to-indigo-500 h-full transition-all duration-500 rounded-l-sm ml-auto shadow-[0_0_8px_rgba(139,92,246,0.2)]"
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
};

export const H2HAnalysis = ({ home, away, standings, groupMatches, bracket, liveMatches }) => {
  const homeGroup = home.group;
  const awayGroup = away.group;

  const homeStandingInfo = homeGroup && standings[homeGroup]
    ? standings[homeGroup].find(t => t.code === home.code) : null;
  const homeRank = homeStandingInfo && homeGroup && standings[homeGroup]
    ? standings[homeGroup].findIndex(t => t.code === home.code) + 1 : null;

  const awayStandingInfo = awayGroup && standings[awayGroup]
    ? standings[awayGroup].find(t => t.code === away.code) : null;
  const awayRank = awayStandingInfo && awayGroup && standings[awayGroup]
    ? standings[awayGroup].findIndex(t => t.code === away.code) + 1 : null;

  const homeStats = getTeamTournamentStats(home.code, groupMatches, bracket, liveMatches);
  const awayStats = getTeamTournamentStats(away.code, groupMatches, bracket, liveMatches);
  const historicalMatches = getHistoricalH2H(home.code, away.code);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 animate-fadeIn select-none">
      {/* Standing Overview Card */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="p-3.5 bg-slate-950/45 border border-slate-800/80 rounded-2xl flex flex-col gap-1 items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-neon" />
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">GROUP {homeGroup} POSITION</span>
          <span className="text-xl select-none my-1">{home.flag}</span>
          <span className="text-xs font-black text-slate-200 text-center truncate w-full">{home.name}</span>
          {homeRank ? (
            <span className="text-[10px] font-extrabold text-brand-neon uppercase tracking-wide bg-brand-neon/10 border border-brand-neon/20 px-2 py-0.5 rounded-full mt-1.5">
              Rank {homeRank} &bull; {homeStats.points} pts
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wide mt-2">Not in Group</span>
          )}
        </div>
        <div className="p-3.5 bg-slate-950/45 border border-slate-800/80 rounded-2xl flex flex-col gap-1 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1.5 h-full bg-brand-purple" />
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">GROUP {awayGroup} POSITION</span>
          <span className="text-xl select-none my-1">{away.flag}</span>
          <span className="text-xs font-black text-slate-200 text-center truncate w-full">{away.name}</span>
          {awayRank ? (
            <span className="text-[10px] font-extrabold text-brand-purple uppercase tracking-wide bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-full mt-1.5">
              Rank {awayRank} &bull; {awayStats.points} pts
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wide mt-2">Not in Group</span>
          )}
        </div>
      </div>

      {/* Tournament Form comparison */}
      <div className="flex flex-col gap-3 p-4 bg-slate-950/20 border border-slate-800/60 rounded-2xl">
        <h5 className="text-[9px] font-black text-slate-450 uppercase tracking-widest text-center">Tournament Form (June 2026)</h5>
        <div className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            {homeStats.form.map((res, i) => (
              <span
                key={`home-form-${i}`}
                title={res === 'W' ? 'Won' : res === 'D' ? 'Draw' : 'Lost'}
                className={`w-5.5 h-5.5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${
                  res === 'W'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : res === 'L'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                }`}
              >
                {res}
              </span>
            ))}
            {homeStats.form.length === 0 && <span className="text-slate-605 text-[10px] font-bold italic">No matches played</span>}
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">VS</span>
          <div className="flex items-center gap-1.5">
            {awayStats.form.map((res, i) => (
              <span
                key={`away-form-${i}`}
                title={res === 'W' ? 'Won' : res === 'D' ? 'Draw' : 'Lost'}
                className={`w-5.5 h-5.5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 transition-all ${
                  res === 'W'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : res === 'L'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                }`}
              >
                {res}
              </span>
            ))}
            {awayStats.form.length === 0 && <span className="text-slate-605 text-[10px] font-bold italic text-right">No matches played</span>}
          </div>
        </div>
      </div>

      {/* Comparative Stats Bars */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/45 border border-slate-800/80 flex flex-col gap-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-900/60 pb-2">Tournament Stat Averages</h5>
        <div className="flex flex-col gap-4">
          {renderComparativeStat('Played Matches', homeStats.played, awayStats.played)}
          {renderComparativeStat('Goals Scored', homeStats.gf, awayStats.gf)}
          {renderComparativeStat('Goals Conceded', homeStats.ga, awayStats.ga)}
          {renderComparativeStat('Clean Sheets', homeStats.cleanSheets, awayStats.cleanSheets)}
          {renderComparativeStat('Goals Scored / Match', homeStats.avgGoalsScored, awayStats.avgGoalsScored)}
          {renderComparativeStat('Goals Conceded / Match', homeStats.avgGoalsConceded, awayStats.avgGoalsConceded)}
        </div>
      </div>

      {/* Historical Matchups */}
      <div className="flex flex-col gap-3">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-900/60 pb-2 flex items-center gap-1.5">
          <span>📜</span> All-Time H2H History
        </h5>
        <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
          {historicalMatches.map((m, idx) => {
            const isAWinner = m.winner === home.name;
            const isBWinner = m.winner === away.name;
            const isDraw = m.winner === 'Draw';
            return (
              <div
                key={`hist-${idx}`}
                className="p-3 bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/60 rounded-xl transition-all flex flex-col gap-1.5 text-[11px] card-shimmer shrink-0"
              >
                <div className="flex justify-between items-center text-[9px] text-slate-505 font-bold">
                  <span className="text-brand-purple uppercase">{m.comp}</span>
                  <span className="font-mono">{m.year}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className={`flex items-center gap-1.5 ${isAWinner ? 'text-brand-neon font-black' : ''}`}>
                    <span>{home.flag}</span>
                    <span>{home.name}</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-850 rounded font-mono font-black text-brand-neon text-xs">
                    {m.score}
                  </span>
                  <span className={`flex items-center gap-1.5 ${isBWinner ? 'text-brand-neon font-black' : ''}`}>
                    <span>{away.name}</span>
                    <span>{away.flag}</span>
                  </span>
                </div>
                <div className="text-[9px] text-center text-slate-400 font-semibold italic">
                  {isDraw ? 'Match ended in a draw' : `Winner: ${m.winner}`}
                </div>
              </div>
            );
          })}
          {historicalMatches.length === 0 && (
            <span className="text-[10px] text-slate-505 text-center py-4 italic">No previous recorded matchups.</span>
          )}
        </div>
      </div>
    </div>
  );
};
