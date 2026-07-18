// FIFA World Cup 2026 Simulation Helpers

export const TEAM_RATINGS = {
  MEX: 82, RSA: 76, KOR: 80, CZE: 79,
  CAN: 80, BIH: 77, QAT: 73, SUI: 82,
  BRA: 91, MAR: 85, HAI: 69, SCO: 76,
  USA: 84, PAR: 78, AUS: 77, TUR: 81,
  GER: 90, CUW: 70, CIV: 80, ECU: 81,
  NED: 88, JPN: 83, SWE: 82, TUN: 74,
  BEL: 87, EGY: 80, IRN: 76, NZL: 66,
  ESP: 92, CPV: 75, KSA: 74, URU: 86,
  FRA: 93, SEN: 81, IRQ: 72, NOR: 82,
  ARG: 94, ALG: 78, AUT: 82, JOR: 71,
  POR: 90, COD: 76, UZB: 75, COL: 85,
  ENG: 93, CRO: 85, GHA: 76, PAN: 74,
};

// Simulate score between two teams based on rating diff
export const simulateScore = (homeCode, awayCode) => {
  const ratingHome = TEAM_RATINGS[homeCode] || 75;
  const ratingAway = TEAM_RATINGS[awayCode] || 75;
  
  const diff = ratingHome - ratingAway;
  
  // Base average goals
  let lambdaHome = 1.3 + (diff * 0.03);
  let lambdaAway = 1.3 - (diff * 0.03);
  
  // Bound lambdas
  lambdaHome = Math.max(0.4, Math.min(3.5, lambdaHome));
  lambdaAway = Math.max(0.4, Math.min(3.5, lambdaAway));
  
  // Poisson-like random distribution for goals
  const poissonRandom = (lambda) => {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  };
  
  return {
    homeScore: poissonRandom(lambdaHome),
    awayScore: poissonRandom(lambdaAway)
  };
};

// Calculate standings for all groups
export const calculateStandings = (teams, groupMatches) => {
  // Reset stats
  const standings = {};
  Object.keys(teams).forEach(code => {
    standings[code] = {
      ...teams[code],
      code,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      form: []
    };
  });

  // Accumulate match results
  groupMatches.forEach(match => {
    const { home, away, homeScore, awayScore } = match;
    if (homeScore === null || awayScore === null) return;

    const hs = parseInt(homeScore);
    const as = parseInt(awayScore);

    const homeTeam = standings[home];
    const awayTeam = standings[away];

    if (!homeTeam || !awayTeam) return;

    homeTeam.played += 1;
    awayTeam.played += 1;
    homeTeam.gf += hs;
    homeTeam.ga += as;
    awayTeam.gf += as;
    awayTeam.ga += hs;
    homeTeam.gd = homeTeam.gf - homeTeam.ga;
    awayTeam.gd = awayTeam.gf - awayTeam.ga;

    if (hs > as) {
      homeTeam.won += 1;
      homeTeam.points += 3;
      awayTeam.lost += 1;
      homeTeam.form.push('W');
      awayTeam.form.push('L');
    } else if (hs < as) {
      awayTeam.won += 1;
      awayTeam.points += 3;
      homeTeam.lost += 1;
      homeTeam.form.push('L');
      awayTeam.form.push('W');
    } else {
      homeTeam.drawn += 1;
      homeTeam.points += 1;
      awayTeam.drawn += 1;
      awayTeam.points += 1;
      homeTeam.form.push('D');
      awayTeam.form.push('D');
    }
  });

  // Group teams by group letter
  const groupsData = {};
  Object.keys(standings).forEach(code => {
    const t = standings[code];
    t.form = t.form.slice(-10);
    if (!groupsData[t.group]) {
      groupsData[t.group] = [];
    }
    groupsData[t.group].push(t);
  });

  // Sort groups
  Object.keys(groupsData).forEach(g => {
    groupsData[g].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      // Heuristic rating as tie-breaker
      return (TEAM_RATINGS[b.code] || 0) - (TEAM_RATINGS[a.code] || 0);
    });
  });

  return groupsData;
};

// Calculate which teams advance to Round of 32
export const getAdvancedTeams = (groupsStandings) => {
  const advanced = {
    // 1st and 2nd from each group
    firsts: {},
    seconds: {},
    thirds: []
  };

  Object.keys(groupsStandings).forEach(g => {
    const groupTeams = groupsStandings[g];
    advanced.firsts[g] = groupTeams[0];
    advanced.seconds[g] = groupTeams[1];
    
    // Track 3rd place team details
    advanced.thirds.push({
      ...groupTeams[2],
      group: g
    });
  });

  // Sort 3rd place teams
  advanced.thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return (TEAM_RATINGS[b.code] || 0) - (TEAM_RATINGS[a.code] || 0);
  });

  // Top 8 advance
  const top8Thirds = advanced.thirds.slice(0, 8);
  
  return {
    firsts: advanced.firsts,
    seconds: advanced.seconds,
    thirds: top8Thirds
  };
};

// Populate the Round of 32 bracket based on group standings
export const populateRoundOf32 = (bracket, advancedTeams) => {
  const { firsts, seconds, thirds } = advancedTeams;
  const newBracket = structuredClone(bracket);
  
  // Make sure we have enough advanced teams (in case group stage isn't simulated fully yet)
  const getTeamCode = (team) => team ? team.code : null;

  // Let's create a clean mapping of the 16 Round of 32 slots:
  // We match Firsts against Thirds and Seconds against Seconds/Firsts
  // To keep it clean and interesting, we map them as follows:
  const r32Mappings = [
    { home: seconds['A'], away: seconds['B'] }, // Match 49
    { home: firsts['C'], away: seconds['F'] }, // Match 50
    { home: firsts['E'], away: thirds[0] }, // Match 51
    { home: firsts['F'], away: seconds['C'] }, // Match 52
    
    { home: seconds['E'], away: seconds['I'] }, // Match 53
    { home: firsts['I'], away: thirds[1] }, // Match 54
    { home: firsts['A'], away: thirds[2] }, // Match 55
    { home: firsts['L'], away: thirds[3] }, // Match 56
    
    { home: firsts['G'], away: thirds[4] }, // Match 57
    { home: firsts['D'], away: thirds[5] }, // Match 58
    { home: firsts['H'], away: seconds['J'] }, // Match 59
    { home: seconds['K'], away: seconds['L'] }, // Match 60
    
    { home: firsts['B'], away: thirds[6] }, // Match 61
    { home: seconds['D'], away: seconds['G'] }, // Match 62
    { home: firsts['J'], away: seconds['H'] }, // Match 63
    { home: firsts['K'], away: thirds[7] }, // Match 64
  ];

  newBracket.r32.forEach((match, index) => {
    const mapping = r32Mappings[index];
    if (mapping) {
      match.home = getTeamCode(mapping.home);
      match.away = getTeamCode(mapping.away);
      // Reset scores and winner when group stage recalculates R32 teams
      match.homeScore = null;
      match.awayScore = null;
      match.winner = null;
    }
  });

  // Clear R16, QF, SF, Final slots as they must be predicted starting from R32
  const roundsToReset = ['r16', 'qf', 'sf', 'final'];
  roundsToReset.forEach(r => {
    newBracket[r].forEach(match => {
      match.home = null;
      match.away = null;
      match.homeScore = null;
      match.awayScore = null;
      match.winner = null;
    });
  });

  return newBracket;
};
