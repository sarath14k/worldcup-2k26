/* eslint-disable react-refresh/only-export-components */
import { FIFA_RANKINGS } from '../data/worldcupData';


// Custom authentic icons for World Cup and Player Stats
export const WorldCupTrophyIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    {/* Cylindrical base */}
    <path d="M7 21h10v1.5H7zm1-2h8v1.5H8zm.5-2h7v1.5h-7z" opacity="0.9" />
    {/* Malachite green bands */}
    <path d="M7 20h10v1H7zm.5-2h9v1h-9z" fill="#10b981" />
    {/* Gold body & figures spiraling up */}
    <path d="M9.5 17c.5-1.5.5-3 0-4.5S8.5 10 7.5 9c1-1.5 3-1.5 4 0 .5 1 1 2.5 1 4.5v-6c.5-.5 1-1 1.5-1.5s1.5-1 2 .5c-.5 1.5-2.5 4-3.5 5.5s-1 3.5-.5 5h-5z" />
    {/* Globe */}
    <circle cx="12.5" cy="5.5" r="3.5" />
    {/* Globe detail lines */}
    <path d="M9.5 5.5h6" stroke="#1e293b" strokeWidth="0.5" />
    <path d="M12.5 2a3.5 3.5 0 0 1 0 7" stroke="#1e293b" strokeWidth="0.5" fill="none" />
  </svg>
);

export const GoldenBootTrophyIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    {/* Pedestal Base */}
    <rect x="4" y="18" width="16" height="3" rx="0.5" opacity="0.4" />
    <rect x="6" y="16" width="12" height="2" rx="0.5" opacity="0.6" />
    
    {/* Shoe body */}
    <path d="M5.5 15.5c-.8-2 0-5.5 1.5-6.5C8.5 8 10 10.5 12 11.5c1.5-1 4.5-2 6-1 1.5.5 1.5 3.5 1 5.5l-6 2.5-7.5-3z" />
    {/* Sole & Studs */}
    <path d="M5.5 15.5c2.5 0 5 .5 8 .5s5-1 7-2.5M7.5 16.5v1.5M10.5 17v1.5M13.5 17v1.5M16.5 16.5v1.5" stroke="#1e293b" strokeWidth="1" />
    {/* Stripes */}
    <path d="M11.5 10.5l-1.5 2M12.5 10l-1.5 2M13.5 9.5l-1.5 2" stroke="#1e293b" strokeWidth="0.8" />
  </svg>
);

export const PlaymakerIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M4 14l4 4M8 14l-4 4" />
    <path d="M7 12c3-4 7-4 10 0" />
    <path d="M14 9h3v3" />
    <circle cx="18" cy="15" r="2" />
  </svg>
);

// Helper to parse match kickoff time in IST
export const parseMatchKickoff = (match) => {
  try {
    const cleanDate = match.date.replace(" IST", "");
    const parts = cleanDate.split(", ");
    const dayParts = parts[0].split(" ");
    const monthStr = dayParts[0];
    const dayStr = dayParts[1];
    
    const timeParts = parts[1].split(" ");
    const [hourStr, minStr] = timeParts[0].split(":");
    let hour = parseInt(hourStr);
    if (timeParts[1] === "PM" && hour < 12) hour += 12;
    if (timeParts[1] === "AM" && hour === 12) hour = 0;
    
    const months = { "June": "06", "July": "07" };
    const month = months[monthStr] || "06";
    
    return new Date(`2026-${month}-${dayStr.padStart(2, '0')}T${String(hour).padStart(2, '0')}:${minStr.padStart(2, '0')}:00+05:30`);
  } catch {
    return null;
  }
};

export const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.replace(" IST", "").trim();
    const parts = cleanDate.split(", ");
    if (parts.length < 2) return cleanDate;
    
    const dayParts = parts[0].split(" ");
    const monthStr = dayParts[0];
    const dayStr = dayParts[1];
    
    const timeParts = parts[1].split(" ");
    if (timeParts.length < 2) return cleanDate;
    
    const [hourStr, minStr] = timeParts[0].split(":");
    let hour = parseInt(hourStr, 10);
    if (timeParts[1] === "PM" && hour < 12) hour += 12;
    if (timeParts[1] === "AM" && hour === 12) hour = 0;
    
    const months = { "June": 5, "July": 6 };
    const monthVal = months[monthStr] !== undefined ? months[monthStr] : 5;
    const dayVal = parseInt(dayStr, 10);
    
    const d = new Date(2026, monthVal, dayVal, hour, parseInt(minStr, 10));
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = weekdays[d.getDay()];
    const shortMonth = monthStr.substring(0, 3);
    
    return `${dayOfWeek}, ${shortMonth} ${dayStr}, ${timeParts[0]} ${timeParts[1]}`;
  } catch {
    return dateStr.replace(" IST", "");
  }
};

export const getMatchVenue = (match, venues = []) => {
  if (!match) return 'TBD Stadium';
  if (match.venue) return match.venue;
  
  if (match.type !== 'group') {
    if (match.id === 'final') return 'MetLife Stadium';
    if (match.id === 'sf_1') return 'AT&T Stadium';
    if (match.id === 'sf_2') return 'Mercedes-Benz Stadium';
    if (match.id && String(match.id).startsWith('qf')) {
      const qfIdx = parseInt(String(match.id).replace('qf_', ''));
      const qfVenues = ['Arrowhead Stadium', 'Gillette Stadium', 'SoFi Stadium', 'Hard Rock Stadium'];
      return qfVenues[(qfIdx - 1) % 4] || 'AT&T Stadium';
    }
    if (match.id && String(match.id).startsWith('r16')) {
      const r16Idx = parseInt(String(match.id).replace('r16_', ''));
      if (venues.length > 0) {
        return venues[(r16Idx + 4) % venues.length].name;
      }
      return 'AT&T Stadium';
    }
    if (match.id && String(match.id).startsWith('r32')) {
      const r32Idx = parseInt(String(match.id).replace('r32_', ''));
      if (venues.length > 0) {
        return venues[r32Idx % venues.length].name;
      }
      return 'AT&T Stadium';
    }
    return 'AT&T Stadium';
  }

  const groupVenues = {
    A: ['Estadio Azteca', 'Estadio Akron', 'Estadio BBVA'],
    B: ['BC Place', 'BMO Field', 'Lumen Field'],
    C: ['SoFi Stadium', 'Levi\'s Stadium', 'Lumen Field'],
    D: ['AT&T Stadium', 'NRG Stadium', 'Hard Rock Stadium'],
    E: ['Mercedes-Benz Stadium', 'Hard Rock Stadium', 'Arrowhead Stadium'],
    F: ['MetLife Stadium', 'Gillette Stadium', 'Lincoln Financial Field'],
    G: ['Estadio Azteca', 'Estadio Akron', 'SoFi Stadium'],
    H: ['BC Place', 'BMO Field', 'Levi\'s Stadium'],
    I: ['AT&T Stadium', 'NRG Stadium', 'Arrowhead Stadium'],
    J: ['Mercedes-Benz Stadium', 'MetLife Stadium', 'Gillette Stadium'],
    K: ['Lincoln Financial Field', 'Hard Rock Stadium', 'SoFi Stadium'],
    L: ['Estadio BBVA', 'Estadio Akron', 'Levi\'s Stadium']
  };

  const list = groupVenues[match.group] || ['MetLife Stadium'];
  const matchIdx = (match.id - 1) % 6;
  return list[matchIdx % list.length];
};

export const TEAM_PLAYERS = {
  MEX: ["Santiago Giménez", "Hirving Lozano", "Edson Álvarez", "Henry Martín"],
  RSA: ["Lyle Foster", "Percy Tau", "Teboho Mokoena", "Themba Zwane"],
  KOR: ["Son Heung-min", "Hwang Hee-chan", "Lee Kang-in", "Cho Gue-sung"],
  CZE: ["Patrik Schick", "Tomáš Souček", "Adam Hložek", "Antonín Barák"],
  CAN: ["Jonathan David", "Alphonso Davies", "Cyle Larin", "Tajon Buchanan"],
  BIH: ["Edin Džeko", "Ermedin Demirović", "Miralem Pjanić", "Rade Krunić"],
  QAT: ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos", "Boualem Khoukhi"],
  SUI: ["Breel Embolo", "Xherdan Shaqiri", "Granit Xhaka", "Manuel Akanji"],
  BRA: ["Vinícius Júnior", "Rodrygo", "Neymar Jr", "Gabriel Martinelli"],
  MAR: ["Youssef En-Nesyri", "Hakim Ziyech", "Achraf Hakimi", "Amine Harit"],
  HAI: ["Duckens Nazon", "Frantzdy Pierrot", "Wilde-Donald Guerrier", "Derrick Etienne"],
  SCO: ["Scott McTominay", "John McGinn", "Ché Adams", "Lyndon Dykes"],
  USA: ["Christian Pulisic", "Folarin Balogun", "Timothy Weah", "Weston McKennie"],
  PAR: ["Miguel Almirón", "Antonio Sanabria", "Julio Enciso", "Gustavo Gómez"],
  AUS: ["Mitchell Duke", "Jackson Irvine", "Craig Goodwin", "Martin Boyle"],
  TUR: ["Kenan Yıldız", "Hakan Çalhanoğlu", "Arda Güler", "Cenk Tosun"],
  GER: ["Florian Wirtz", "Jamal Musiala", "Kai Havertz", "Niclas Füllkrug"],
  CUW: ["Rangelo Janga", "Leandro Bacuna", "Kenji Gorré", "Brandley Kuwas"],
  CIV: ["Sébastien Haller", "Franck Kessié", "Simon Adingra", "Ibrahim Sangaré"],
  ECU: ["Enner Valencia", "Moisés Caicedo", "Gonzalo Plata", "Michael Estrada"],
  NED: ["Memphis Depay", "Cody Gakpo", "Xavi Simons", "Virgil van Dijk"],
  JPN: ["Kaoru Mitoma", "Takumi Minamino", "Takefusa Kubo", "Daichi Kamada"],
  SWE: ["Alexander Isak", "Dejan Kulusevski", "Viktor Gyökeres", "Emil Forsberg"],
  TUN: ["Youssef Msakni", "Aïssa Laïdouni", "Wahbi Khazri", "Naïm Sliti"],
  BEL: ["Romelu Lukaku", "Kevin De Bruyne", "Leandro Trossard", "Jérémy Doku"],
  EGY: ["Mohamed Salah", "Omar Marmoush", "Mostafa Mohamed", "Trezeguet"],
  IRN: ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Saman Ghoddos"],
  NZL: ["Chris Wood", "Liborato Cacace", "Matthew Garbett", "Elijah Just"],
  ESP: ["Álvaro Morata", "Nico Williams", "Lamine Yamal", "Dani Olmo"],
  CPV: ["Ryan Mendes", "Garry Rodrigues", "Bebé", "Jovane Cabral"],
  KSA: ["Salem Al-Dawsari", "Firas Al-Buraikan", "Saleh Al-Shehri", "Abdulrahman Ghareeb"],
  URU: ["Darwin Núñez", "Federico Valverde", "Facundo Pellistri", "Ronald Araújo"],
  FRA: ["Kylian Mbappé", "Antoine Griezmann", "Olivier Giroud", "Ousmane Dembélé"],
  SEN: ["Sadio Mané", "Nicolas Jackson", "Ismaïla Sarr", "Idrissa Gueye"],
  IRQ: ["Aymen Hussein", "Ali Jasim", "Mohanad Ali", "Ibrahim Bayesh"],
  NOR: ["Erling Haaland", "Martin Ødegaard", "Alexander Sørloth", "Jørgen Strand Larsen"],
  ARG: ["Lionel Messi", "Lautaro Martínez", "Julián Álvarez", "Alexis Mac Allister"],
  ALG: ["Riyad Mahrez", "Baghdad Bounedjah", "Amine Gouiri", "Saïd Benrahma"],
  AUT: ["Marcel Sabitzer", "Michael Gregoritsch", "Christoph Baumgartner", "Konrad Laimer"],
  JOR: ["Musa Al-Taamari", "Yazan Al-Naimat", "Ali Olwan", "Hamza Al-Dardour"],
  POR: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão"],
  COD: ["Yoane Wissa", "Cédric Bakambu", "Chancel Mbemba", "Meschack Elia"],
  UZB: ["Eldor Shomurodov", "Abbosbek Fayzullaev", "Oston Urunov", "Igor Sergeev"],
  COL: ["Luis Díaz", "James Rodríguez", "Jhon Durán", "Rafael Borré"],
  ENG: ["Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden"],
  CRO: ["Andrej Kramarić", "Luka Modrić", "Mateo Kovačić", "Ivan Perišić"],
  GHA: ["Mohammed Kudus", "Jordan Ayew", "Inaki Williams", "Antoine Semenyo"],
  PAN: ["José Fajardo", "Cecilio Waterman", "Yoel Bárcenas", "Aníbal Godoy"]
};

export const getAssistPlayer = (matchId, goalPlayer, teamCode, goalMinute) => {
  const players = TEAM_PLAYERS[teamCode] || [];
  if (players.length <= 1) return null;
  
  const seedStr = `${matchId}-${goalPlayer}-${teamCode}-${goalMinute}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const randomVal = Math.abs(Math.sin(hash) * 10000) % 1;
  
  if (randomVal > 0.75) return null;
  
  const otherPlayers = players.filter(p => p !== goalPlayer);
  if (otherPlayers.length === 0) return null;
  
  const assistIdx = Math.floor(randomVal * otherPlayers.length);
  return otherPlayers[assistIdx];
};

export const getPossessionWithContest = (possessionArray, matchId) => {
  const rawHome = possessionArray?.[0] || 50;
  const matchNum = typeof matchId === 'number' ? matchId : (parseInt(matchId) || 42);
  const contest = 10 + (matchNum % 9);
  const multiplier = (100 - contest) / 100;
  const home = Math.round(rawHome * multiplier);
  const away = 100 - contest - home;
  return [home, away, contest];
};

export const generateRealisticStats = (homeScore, awayScore, matchId) => {
  const seed = (matchId || 1) * 7 + (homeScore || 0) * 13 + (awayScore || 0) * 17;
  const rand = (s) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const r1 = rand(seed + 1);
  const r2 = rand(seed + 2);
  const r3 = rand(seed + 3);
  const r4 = rand(seed + 4);
  const r5 = rand(seed + 5);
  const r6 = rand(seed + 6);
  const r7 = rand(seed + 7);

  const homeSOT = (homeScore || 0) + Math.floor(r1 * 4) + 1;
  const awaySOT = (awayScore || 0) + Math.floor(r2 * 4) + 1;

  const homeShots = homeSOT + Math.floor(r3 * 9) + 3;
  const awayShots = awaySOT + Math.floor(r4 * 9) + 3;

  const homeCorners = Math.floor(r5 * 8) + 2;
  const awayCorners = Math.floor(r6 * 8) + 2;

  const homeFouls = Math.floor(r7 * 10) + 8;
  const awayFouls = Math.floor(rand(seed + 8) * 10) + 8;

  const diff = (homeScore || 0) - (awayScore || 0);
  let homePoss = 50 + diff * 3 + Math.floor(rand(seed + 9) * 11) - 5;
  homePoss = Math.max(35, Math.min(65, homePoss));
  const awayPoss = 100 - homePoss;

  const homeYellows = Math.floor(rand(seed + 10) * 4);
  const awayYellows = Math.floor(rand(seed + 11) * 4);

  const homeReds = rand(seed + 12) > 0.95 ? 1 : 0;
  const awayReds = rand(seed + 13) > 0.95 ? 1 : 0;

  return {
    possession: [homePoss, awayPoss],
    shots: [homeShots, awayShots],
    shotsOnTarget: [homeSOT, awaySOT],
    corners: [homeCorners, awayCorners],
    fouls: [homeFouls, awayFouls],
    yellowCards: [homeYellows, awayYellows],
    redCards: [homeReds, awayReds]
  };
};

export const generateRealisticScorers = (matchId, homeCode, awayCode, homeScore, awayScore) => {
  const scorers = [];
  const homePlayers = TEAM_PLAYERS[homeCode] || ["Home Player A", "Home Player B"];
  const awayPlayers = TEAM_PLAYERS[awayCode] || ["Away Player A", "Away Player B"];

  const rand = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < homeScore; i++) {
    const seed = matchId * 3 + i * 7;
    const playerIdx = Math.floor(rand(seed) * homePlayers.length);
    const minute = Math.floor(rand(seed + 1) * 89) + 1;
    scorers.push({ team: 'home', player: homePlayers[playerIdx], minute });
  }

  for (let i = 0; i < awayScore; i++) {
    const seed = matchId * 5 + i * 11;
    const playerIdx = Math.floor(rand(seed) * awayPlayers.length);
    const minute = Math.floor(rand(seed + 2) * 89) + 1;
    scorers.push({ team: 'away', player: awayPlayers[playerIdx], minute });
  }

  return scorers.sort((a, b) => a.minute - b.minute);
};

import { OFFICIAL_MATCH_DETAILS } from '../data/officialMatchDetails';

export const getMatchDetails = (match, live) => {
  const isCompleted = match.isCompleted || (live && live.minute === 'FT');
  const isLive = live && live.minute !== 'FT' && live.minute !== null && live.minute !== undefined;
  const hasStarted = isCompleted || isLive;
  
  if (!hasStarted) {
    return { hasStarted: false };
  }

  const homeScore = live ? live.homeScore : (match.homeScore ?? 0);
  const awayScore = live ? live.awayScore : (match.awayScore ?? 0);
  const generatedFallbackStats = generateRealisticStats(homeScore, awayScore, match.id);
  const generatedFallbackScorers = generateRealisticScorers(match.id, match.home, match.away, homeScore, awayScore);

  if (live && live.isDetailedScraped) {
    const useGeneratedScorers = !live.events || live.events.length === 0;
    const useGeneratedStats = !live.stats;
    return {
      hasStarted: true,
      scorers: useGeneratedScorers ? generatedFallbackScorers : live.events,
      stats: useGeneratedStats ? generatedFallbackStats : live.stats,
      timeline: live.timeline || [],
      scorersSimulated: useGeneratedScorers,
      statsSimulated: useGeneratedStats
    };
  }

  if (OFFICIAL_MATCH_DETAILS[match.id]) {
    const od = OFFICIAL_MATCH_DETAILS[match.id];
    const useGeneratedScorers = !od.scorers || od.scorers.length === 0;
    const useGeneratedStats = !od.stats;
    return {
      hasStarted: true,
      scorers: useGeneratedScorers ? generatedFallbackScorers : od.scorers,
      stats: useGeneratedStats ? generatedFallbackStats : od.stats,
      timeline: od.timeline || [],
      scorersSimulated: useGeneratedScorers,
      statsSimulated: useGeneratedStats
    };
  }

  if (live) {
    const useGeneratedScorers = !live.events || live.events.length === 0;
    const useGeneratedStats = !live.stats;
    return {
      hasStarted: true,
      scorers: useGeneratedScorers ? generatedFallbackScorers : live.events,
      stats: useGeneratedStats ? generatedFallbackStats : live.stats,
      timeline: live.timeline || [],
      scorersSimulated: useGeneratedScorers,
      statsSimulated: useGeneratedStats
    };
  }

  return {
    hasStarted: true,
    scorers: generatedFallbackScorers,
    stats: generatedFallbackStats,
    timeline: [],
    scorersSimulated: true,
    statsSimulated: true
  };
};

export const formatLiveMatchTime = (liveMatch) => {
  if (!liveMatch) return '';
  if (liveMatch.minute === 'FT' || liveMatch.isCompleted) return 'FT';
  if (liveMatch.minute === 'HT') return 'HT';
  if (liveMatch.minute === undefined || liveMatch.minute === null || liveMatch.minute === '') return 'LIVE';
  const minStr = String(liveMatch.minute).padStart(2, '0');
  const secStr = liveMatch.second !== undefined && liveMatch.second !== null ? String(liveMatch.second).padStart(2, '0') : '00';
  return `LIVE ${minStr}:${secStr}`;
};

export const isLiveMatch = (live) => {
  if (!live) return false;
  const m = live.minute;
  return m !== null && m !== undefined && m !== '' && m !== 'FT' && !live.isCompleted;
};

export const FifaRankBadge = ({ teamCode }) => {
  const rank = FIFA_RANKINGS[teamCode];
  if (!rank) return null;

  let badgeStyle;
  let icon = null;

  if (rank <= 5) {
    badgeStyle = "bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border-yellow-500/45 text-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.15)] hover:shadow-[0_0_12px_rgba(251,191,36,0.3)] hover:border-yellow-400/60";
    icon = (
      <svg className="w-2 h-2 fill-yellow-400 shrink-0 mr-0.5 animate-pulse" viewBox="0 0 24 24">
        <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
      </svg>
    );
  } else if (rank <= 15) {
    badgeStyle = "bg-gradient-to-r from-emerald-500/10 via-brand-neon/15 to-emerald-500/10 border-brand-neon/30 text-brand-neon shadow-[0_0_10px_rgba(0,255,135,0.12)] hover:shadow-[0_0_12px_rgba(0,255,135,0.25)] hover:border-brand-neon/50";
    icon = <span className="w-1 h-1 rounded-full bg-brand-neon shrink-0 mr-0.5 animate-pulse" />;
  } else if (rank <= 30) {
    badgeStyle = "bg-gradient-to-r from-blue-500/10 via-brand-royal/15 to-blue-500/10 border-brand-royal/25 text-blue-300 hover:border-brand-royal/45 shadow-[0_0_8px_rgba(59,130,246,0.06)] hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]";
    icon = <span className="w-1 h-1 rounded-full bg-brand-royal shrink-0 mr-0.5" />;
  } else {
    badgeStyle = "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300";
  }

  return (
    <span 
      className={`inline-flex items-center text-[8px] font-mono font-black px-1.5 py-0.5 rounded-full border shrink-0 select-none transition-all duration-300 hover:scale-105 ${badgeStyle}`} 
      title={`FIFA Rank: ${rank}`}
    >
      {icon}
      <span>#{rank}</span>
    </span>
  );
};
