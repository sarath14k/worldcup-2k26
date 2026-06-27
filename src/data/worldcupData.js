import realMatchDates from './realMatchDates.json' with { type: 'json' };

export const TEAMS = {
  // Group A
  MEX: { name: "Mexico", flag: "🇲🇽", group: "A", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  RSA: { name: "South Africa", flag: "🇿🇦", group: "A", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  KOR: { name: "South Korea", flag: "🇰🇷", group: "A", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  CZE: { name: "Czechia", flag: "🇨🇿", group: "A", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group B
  CAN: { name: "Canada", flag: "🇨🇦", group: "B", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  BIH: { name: "Bosnia & Herzegovina", flag: "🇧🇦", group: "B", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  QAT: { name: "Qatar", flag: "🇶🇦", group: "B", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  SUI: { name: "Switzerland", flag: "🇨🇭", group: "B", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group C
  BRA: { name: "Brazil", flag: "🇧🇷", group: "C", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  MAR: { name: "Morocco", flag: "🇲🇦", group: "C", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  HAI: { name: "Haiti", flag: "🇭🇹", group: "C", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  SCO: { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group D
  USA: { name: "United States", flag: "🇺🇸", group: "D", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  PAR: { name: "Paraguay", flag: "🇵🇾", group: "D", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  AUS: { name: "Australia", flag: "🇦🇺", group: "D", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  TUR: { name: "Turkey", flag: "🇹🇷", group: "D", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group E
  GER: { name: "Germany", flag: "🇩🇪", group: "E", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  CUW: { name: "Curaçao", flag: "🇨🇼", group: "E", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  CIV: { name: "Ivory Coast", flag: "🇨🇮", group: "E", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  ECU: { name: "Ecuador", flag: "🇪🇨", group: "E", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group F
  NED: { name: "Netherlands", flag: "🇳🇱", group: "F", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  JPN: { name: "Japan", flag: "🇯🇵", group: "F", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  SWE: { name: "Sweden", flag: "🇸🇪", group: "F", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  TUN: { name: "Tunisia", flag: "🇹🇳", group: "F", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group G
  BEL: { name: "Belgium", flag: "🇧🇪", group: "G", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  EGY: { name: "Egypt", flag: "🇪🇬", group: "G", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  IRN: { name: "Iran", flag: "🇮🇷", group: "G", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  NZL: { name: "New Zealand", flag: "🇳🇿", group: "G", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group H
  ESP: { name: "Spain", flag: "🇪🇸", group: "H", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  CPV: { name: "Cape Verde", flag: "🇨🇻", group: "H", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  KSA: { name: "Saudi Arabia", flag: "🇸🇦", group: "H", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  URU: { name: "Uruguay", flag: "🇺🇾", group: "H", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group I
  FRA: { name: "France", flag: "🇫🇷", group: "I", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  SEN: { name: "Senegal", flag: "🇸🇳", group: "I", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  IRQ: { name: "Iraq", flag: "🇮🇶", group: "I", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  NOR: { name: "Norway", flag: "🇳🇴", group: "I", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group J
  ARG: { name: "Argentina", flag: "🇦🇷", group: "J", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  ALG: { name: "Algeria", flag: "🇩🇿", group: "J", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  AUT: { name: "Austria", flag: "🇦🇹", group: "J", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  JOR: { name: "Jordan", flag: "🇯🇴", group: "J", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group K
  POR: { name: "Portugal", flag: "🇵🇹", group: "K", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  COD: { name: "DR Congo", flag: "🇨🇩", group: "K", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  UZB: { name: "Uzbekistan", flag: "🇺🇿", group: "K", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  COL: { name: "Colombia", flag: "🇨🇴", group: "K", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  
  // Group L
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  CRO: { name: "Croatia", flag: "🇭🇷", group: "L", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  GHA: { name: "Ghana", flag: "🇬🇭", group: "L", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  PAN: { name: "Panama", flag: "🇵🇦", group: "L", points: 0, gd: 0, gf: 0, ga: 0, played: 0, won: 0, drawn: 0, lost: 0 },
};

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export const VENUES = [
  // USA
  { name: "MetLife Stadium", city: "New York/New Jersey", capacity: 82500, country: "USA", flag: "🇺🇸", desc: "Host of the World Cup Final on July 19, 2026.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Metlife_stadium_%28Aerial_view%29.jpg/500px-Metlife_stadium_%28Aerial_view%29.jpg" },
  { name: "SoFi Stadium", city: "Los Angeles", capacity: 70240, country: "USA", flag: "🇺🇸", desc: "Stunning modern stadium hosting USA's opening match.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SoFi_Stadium_2023.jpg/500px-SoFi_Stadium_2023.jpg" },
  { name: "Mercedes-Benz Stadium", city: "Atlanta", capacity: 71000, country: "USA", flag: "🇺🇸", desc: "Retractable roof stadium hosting a semi-final.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Mercedes_Benz_Stadium_time_lapse_capture_2017-08-13.jpg/500px-Mercedes_Benz_Stadium_time_lapse_capture_2017-08-13.jpg" },
  { name: "AT&T Stadium", city: "Dallas", capacity: 80000, country: "USA", flag: "🇺🇸", desc: "Mega-stadium hosting a semi-final and multiple knockouts.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg/500px-Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg" },
  { name: "Hard Rock Stadium", city: "Miami", capacity: 64767, country: "USA", flag: "🇺🇸", desc: "Host of the bronze medal match.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg/500px-Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg" },
  { name: "Gillette Stadium", city: "Boston", capacity: 65878, country: "USA", flag: "🇺🇸", desc: "Historic sporting arena in New England.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Gillette_Stadium_%28Top_View%29.jpg/500px-Gillette_Stadium_%28Top_View%29.jpg" },
  { name: "Lincoln Financial Field", city: "Philadelphia", capacity: 67594, country: "USA", flag: "🇺🇸", desc: "A vibrant home for football matches on the East Coast.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lincoln_Financial_Field_%28Aerial_view%29.jpg/500px-Lincoln_Financial_Field_%28Aerial_view%29.jpg" },
  { name: "Arrowhead Stadium", city: "Kansas City", capacity: 76416, country: "USA", flag: "🇺🇸", desc: "Loudest stadium in the world hosting key quarterfinal.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg/500px-Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg" },
  { name: "NRG Stadium", city: "Houston", capacity: 72220, country: "USA", flag: "🇺🇸", desc: "State-of-the-art retractable roof venue.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Nrg_stadium.jpg/500px-Nrg_stadium.jpg" },
  { name: "Levi's Stadium", city: "San Francisco Bay Area", capacity: 68500, country: "USA", flag: "🇺🇸", desc: "Silicon Valley's premier sports complex.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg/500px-Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg" },
  { name: "Lumen Field", city: "Seattle", capacity: 69000, country: "USA", flag: "🇺🇸", desc: "Incredible acoustic design and electric atmosphere.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/2026_FIFA_World_Cup_-_Belgium_v._Egypt_in_Seattle_-_04.jpg/500px-2026_FIFA_World_Cup_-_Belgium_v._Egypt_in_Seattle_-_04.jpg" },
  // Canada
  { name: "BC Place", city: "Vancouver", capacity: 54500, country: "Canada", flag: "🇨🇦", desc: "Canada's west coast crown jewel.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/BC_Place_2015_Women%27s_FIFA_World_Cup.jpg/500px-BC_Place_2015_Women%27s_FIFA_World_Cup.jpg" },
  { name: "BMO Field", city: "Toronto", capacity: 45736, country: "Canada", flag: "🇨🇦", desc: "Canada's national football stadium.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Toronto_BMO_Field_in_2024.jpg/500px-Toronto_BMO_Field_in_2024.jpg" },
  // Mexico
  { name: "Estadio Azteca", city: "Mexico City", capacity: 87523, country: "Mexico", flag: "🇲🇽", desc: "Historic arena hosting the opening match on June 11, 2026.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Vista_a%C3%A9rea_del_Estadio_Azteca_-_2026_-_02.jpg/500px-Vista_a%C3%A9rea_del_Estadio_Azteca_-_2026_-_02.jpg" },
  { name: "Estadio BBVA", city: "Monterrey", capacity: 53500, country: "Mexico", flag: "🇲🇽", desc: "Known as 'El Gigante de Acero' for its beautiful structure.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG/500px-Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG" },
  { name: "Estadio Akron", city: "Guadalajara", capacity: 48070, country: "Mexico", flag: "🇲🇽", desc: "Futuristic stadium shaped like a volcano.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg/500px-Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg" },
];

export const generateGroupMatches = () => {
  const matches = [];
  let id = 1;

  // Real, completed matches from June 11 to June 14, 2026:
  const REAL_RESULTS = {
    // Group A
    "MEX-RSA": { homeScore: 2, awayScore: 0, isCompleted: true },
    "KOR-CZE": { homeScore: 2, awayScore: 1, isCompleted: true },
    // Group B
    "CAN-BIH": { homeScore: 1, awayScore: 1, isCompleted: true },
    "QAT-SUI": { homeScore: 1, awayScore: 1, isCompleted: true },
    // Group C
    "BRA-MAR": { homeScore: 1, awayScore: 1, isCompleted: true },
    "HAI-SCO": { homeScore: 0, awayScore: 1, isCompleted: true },
    // Group D
    "USA-PAR": { homeScore: 4, awayScore: 1, isCompleted: true },
    "AUS-TUR": { homeScore: 2, awayScore: 0, isCompleted: true },
    // Group E (June 14)
    "GER-CUW": { homeScore: 7, awayScore: 1, isCompleted: true },
    "CIV-ECU": { homeScore: 1, awayScore: 0, isCompleted: true },
    // Group F (June 14)
    "NED-JPN": { homeScore: 2, awayScore: 2, isCompleted: true },
    "SWE-TUN": { homeScore: 5, awayScore: 1, isCompleted: true },
  };

  const getISTFixtureTime = (groupLetter, pairingIndex) => {
    const GROUPS_LIST = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const groupIdx = GROUPS_LIST.indexOf(groupLetter);
    
    if (pairingIndex === 0 || pairingIndex === 1) {
      const day = 12 + Math.floor(groupIdx / 2);
      const hourStr = pairingIndex === 0 ? "05:30 AM" : "09:30 AM";
      return `June ${day}, ${hourStr} IST`;
    } else if (pairingIndex === 2 || pairingIndex === 3) {
      const day = 18 + Math.floor(groupIdx / 2);
      const hourStr = pairingIndex === 2 ? "05:30 AM" : "09:30 AM";
      return `June ${day}, ${hourStr} IST`;
    } else {
      const day = 23 + Math.floor(groupIdx / 2);
      const hourStr = pairingIndex === 4 ? "05:30 AM" : "09:30 AM";
      return `June ${day}, ${hourStr} IST`;
    }
  };

  GROUPS.forEach(g => {
    const groupTeams = Object.keys(TEAMS).filter(k => TEAMS[k].group === g);
    // 6 matches per group
    const pairings = [
      { home: groupTeams[0], away: groupTeams[1], date: getISTFixtureTime(g, 0) },
      { home: groupTeams[2], away: groupTeams[3], date: getISTFixtureTime(g, 1) },
      { home: groupTeams[0], away: groupTeams[2], date: getISTFixtureTime(g, 2) },
      { home: groupTeams[1], away: groupTeams[3], date: getISTFixtureTime(g, 3) },
      { home: groupTeams[0], away: groupTeams[3], date: getISTFixtureTime(g, 4) },
      { home: groupTeams[1], away: groupTeams[2], date: getISTFixtureTime(g, 5) }
    ];

    pairings.forEach(p => {
      const key = `${p.home}-${p.away}`;
      const realResult = REAL_RESULTS[key];
      
      let finalDate = realMatchDates[key] || p.date;

      matches.push({
        id: id++,
        type: 'group',
        group: g,
        home: p.home,
        away: p.away,
        homeScore: realResult ? realResult.homeScore : null,
        awayScore: realResult ? realResult.awayScore : null,
        isCompleted: realResult ? realResult.isCompleted : false,
        date: finalDate
      });
    });
  });
  return matches;
};

// Standard knockout mapping.
// For the Round of 32, we have 16 matches:
// R32_1 to R32_16
// Seeding them with default placeholder codes from the new groups.
export const KNOCKOUT_MATCHES = {
  // Round of 32
  r32: [
    { id: 'r32_1', nextId: 'r16_1', position: 'top', slot: 1, home: 'MEX', away: 'SUI', homeScore: null, awayScore: null, winner: null, title: 'Match 49', date: 'June 29, 01:30 AM IST' },
    { id: 'r32_2', nextId: 'r16_2', position: 'top', slot: 2, home: 'USA', away: 'ECU', homeScore: null, awayScore: null, winner: null, title: 'Match 50', date: 'June 29, 05:30 AM IST' },
    { id: 'r32_3', nextId: 'r16_1', position: 'bottom', slot: 3, home: 'FRA', away: 'SWE', homeScore: null, awayScore: null, winner: null, title: 'Match 51', date: 'June 29, 09:30 PM IST' },
    { id: 'r32_4', nextId: 'r16_3', position: 'top', slot: 4, home: 'GER', away: 'BEL', homeScore: null, awayScore: null, winner: null, title: 'Match 52', date: 'June 30, 01:30 AM IST' },
    
    { id: 'r32_5', nextId: 'r16_2', position: 'bottom', slot: 5, home: 'ARG', away: 'TUR', homeScore: null, awayScore: null, winner: null, title: 'Match 53', date: 'June 30, 05:30 AM IST' },
    { id: 'r32_6', nextId: 'r16_3', position: 'bottom', slot: 6, home: 'MAR', away: 'CZE', homeScore: null, awayScore: null, winner: null, title: 'Match 54', date: 'June 30, 09:30 PM IST' },
    { id: 'r32_7', nextId: 'r16_4', position: 'top', slot: 7, home: 'ENG', away: 'CIV', homeScore: null, awayScore: null, winner: null, title: 'Match 55', date: 'July 01, 01:30 AM IST' },
    { id: 'r32_8', nextId: 'r16_4', position: 'bottom', slot: 8, home: 'CRO', away: 'NOR', homeScore: null, awayScore: null, winner: null, title: 'Match 56', date: 'July 01, 05:30 AM IST' },
    
    { id: 'r32_9', nextId: 'r16_5', position: 'top', slot: 9, home: 'BRA', away: 'KOR', homeScore: null, awayScore: null, winner: null, title: 'Match 57', date: 'July 01, 09:30 PM IST' },
    { id: 'r32_10', nextId: 'r16_5', position: 'bottom', slot: 10, home: 'NED', away: 'COL', homeScore: null, awayScore: null, winner: null, title: 'Match 58', date: 'July 02, 01:30 AM IST' },
    { id: 'r32_11', nextId: 'r16_6', position: 'top', slot: 11, home: 'ESP', away: 'AUT', homeScore: null, awayScore: null, winner: null, title: 'Match 59', date: 'July 02, 05:30 AM IST' },
    { id: 'r32_12', nextId: 'r16_6', position: 'bottom', slot: 12, home: 'BEL', away: 'URU', homeScore: null, awayScore: null, winner: null, title: 'Match 60', date: 'July 02, 09:30 PM IST' },
    
    { id: 'r32_13', nextId: 'r16_7', position: 'top', slot: 13, home: 'CAN', away: 'PAR', homeScore: null, awayScore: null, winner: null, title: 'Match 61', date: 'July 03, 01:30 AM IST' },
    { id: 'r32_14', nextId: 'r16_7', position: 'bottom', slot: 14, home: 'JPN', away: 'SEN', homeScore: null, awayScore: null, winner: null, title: 'Match 62', date: 'July 03, 05:30 AM IST' },
    { id: 'r32_15', nextId: 'r16_8', position: 'top', slot: 15, home: 'POR', away: 'AUS', homeScore: null, awayScore: null, winner: null, title: 'Match 63', date: 'July 03, 09:30 PM IST' },
    { id: 'r32_16', nextId: 'r16_8', position: 'bottom', slot: 16, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 64', date: 'July 04, 01:30 AM IST' },
  ],

  // Round of 16
  r16: [
    { id: 'r16_1', nextId: 'qf_1', position: 'top', slot: 1, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 65', date: 'July 05, 01:30 AM IST' },
    { id: 'r16_2', nextId: 'qf_1', position: 'bottom', slot: 2, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 66', date: 'July 05, 05:30 AM IST' },
    { id: 'r16_3', nextId: 'qf_3', position: 'top', slot: 3, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 67', date: 'July 06, 01:30 AM IST' },
    { id: 'r16_4', nextId: 'qf_3', position: 'bottom', slot: 4, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 68', date: 'July 06, 05:30 AM IST' },
    
    { id: 'r16_5', nextId: 'qf_2', position: 'top', slot: 5, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 69', date: 'July 07, 01:30 AM IST' },
    { id: 'r16_6', nextId: 'qf_2', position: 'bottom', slot: 6, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 70', date: 'July 07, 05:30 AM IST' },
    { id: 'r16_7', nextId: 'qf_4', position: 'top', slot: 7, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 71', date: 'July 08, 01:30 AM IST' },
    { id: 'r16_8', nextId: 'qf_4', position: 'bottom', slot: 8, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Match 72', date: 'July 08, 05:30 AM IST' },
  ],

  // Quarter Finals
  qf: [
    { id: 'qf_1', nextId: 'sf_1', position: 'top', slot: 1, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Quarter-Final 1', date: 'July 10, 09:30 PM IST' },
    { id: 'qf_2', nextId: 'sf_1', position: 'bottom', slot: 2, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Quarter-Final 2', date: 'July 11, 01:30 AM IST' },
    { id: 'qf_3', nextId: 'sf_2', position: 'top', slot: 3, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Quarter-Final 3', date: 'July 11, 05:30 AM IST' },
    { id: 'qf_4', nextId: 'sf_2', position: 'bottom', slot: 4, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Quarter-Final 4', date: 'July 12, 01:30 AM IST' },
  ],

  // Semi Finals
  sf: [
    { id: 'sf_1', nextId: 'final', position: 'home', slot: 1, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Semi-Final 1', date: 'July 15, 05:30 AM IST' },
    { id: 'sf_2', nextId: 'final', position: 'away', slot: 2, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'Semi-Final 2', date: 'July 16, 05:30 AM IST' },
  ],

  // Final
  final: [
    { id: 'final', nextId: null, position: null, slot: 1, home: null, away: null, homeScore: null, awayScore: null, winner: null, title: 'World Cup Final', date: 'July 20, 05:30 AM IST' }
  ]
};

export const FIFA_RANKINGS = {
  ARG: 1, ESP: 2, FRA: 3, ENG: 4, POR: 5, BRA: 6, MAR: 7, NED: 8, BEL: 9, GER: 10,
  CRO: 11, COL: 13, MEX: 14, SEN: 15, URU: 16, USA: 17, JPN: 18, SUI: 19, IRN: 20,
  TUR: 22, ECU: 23, AUT: 24, KOR: 25, AUS: 27, ALG: 28, EGY: 29, CAN: 30, NOR: 31,
  CIV: 33, PAN: 34, SWE: 38, CZE: 40, PAR: 41, SCO: 42, TUN: 45, COD: 46, UZB: 50,
  QAT: 56, IRQ: 57, RSA: 60, KSA: 61, JOR: 63, BIH: 64, CPV: 67, GHA: 73, CUW: 82,
  HAI: 83, NZL: 85
};
