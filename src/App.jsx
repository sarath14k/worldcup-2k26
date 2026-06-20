import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trophy, Users, MapPin, Calendar, TrendingUp, Sparkles, 
  RefreshCw, Moon, Sun, Share2, ChevronDown, Check, Award, Info,
  Flame, Globe, HelpCircle, Heart, Star, Radio, Clock, ListFilter
} from 'lucide-react';
import { TEAMS, GROUPS, VENUES, generateGroupMatches, KNOCKOUT_MATCHES } from './data/worldcupData';
import { calculateStandings, getAdvancedTeams, populateRoundOf32, simulateScore } from './data/simulation';
import { OFFICIAL_MATCH_DETAILS } from './data/officialMatchDetails';

// Helper to parse match kickoff time in IST
const parseMatchKickoff = (match) => {
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
  } catch (e) {
    return null;
  }
};
const TEAM_PLAYERS = {
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

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getMatchDetails = (match, live) => {
  const isCompleted = match.isCompleted || (live && live.minute === 'FT');
  const isLive = live && live.minute !== 'FT';
  const hasStarted = isCompleted || isLive;
  
  if (!hasStarted) {
    return { hasStarted: false };
  }

  // If it's in liveMatches (scraped live or completed from the FIFA website) AND has detailed data:
  if (live && live.isDetailedScraped) {
    return {
      hasStarted: true,
      scorers: live.events || [],
      stats: live.stats || null,
      timeline: live.timeline || []
    };
  }

  // If we don't have scraped details but it's a completed match in OFFICIAL_MATCH_DETAILS:
  if (OFFICIAL_MATCH_DETAILS[match.id]) {
    return {
      hasStarted: true,
      scorers: OFFICIAL_MATCH_DETAILS[match.id].scorers || [],
      stats: OFFICIAL_MATCH_DETAILS[match.id].stats || null,
      timeline: OFFICIAL_MATCH_DETAILS[match.id].timeline || []
    };
  }

  // Fallback for live matches without detailed scraping yet:
  if (live) {
    return {
      hasStarted: true,
      scorers: live.events || [],
      stats: live.stats || null,
      timeline: live.timeline || []
    };
  }

  // Otherwise, it's a predicted/scheduled match with no real-world data:
  return {
    hasStarted: false,
    scorers: [],
    stats: null,
    timeline: []
  };
};

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState('groups'); // 'bracket', 'groups', 'venues', 'predictions'
  const [darkMode, setDarkMode] = useState(true);
  const [hoveredTeam, setHoveredTeam] = useState(null);
  
  // Group Stage State
  const [groupMatches, setGroupMatches] = useState([]);
  const [expandedGroup, setExpandedGroup] = useState('A');
  
  // Bracket State
  const [bracket, setBracket] = useState(KNOCKOUT_MATCHES);
  
  // Group Standing Override State
  const [standingsOverrides, setStandingsOverrides] = useState({});
  const [showGroupSelectors, setShowGroupSelectors] = useState(true);
  
  // Awards / Extras
  const [goldenBoot, setGoldenBoot] = useState('');
  const [goldenBall, setGoldenBall] = useState('');
  const [predictionSaved, setPredictionSaved] = useState(false);
  const [shareText, setShareText] = useState('Share predictions');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(null);
  const [liveMatches, setLiveMatches] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);

  const upcomingFixtures = useMemo(() => {
    const allMatches = [];
    
    // Add group stage matches
    groupMatches.forEach(m => {
      allMatches.push({ ...m, stage: 'group' });
    });
    
    // Add knockout matches that have teams assigned
    Object.keys(bracket).forEach(roundKey => {
      bracket[roundKey].forEach(m => {
        if (m.home && m.away) {
          allMatches.push({ ...m, stage: 'knockout' });
        }
      });
    });

    // Filter to matches that are NOT completed, or are currently live
    const activeMatches = allMatches.filter(m => {
      const live = liveMatches[m.id];
      const isLive = live && live.minute !== 'FT' && !live.isCompleted;
      if (isLive) return true;
      return !m.isCompleted;
    });

    // Sort chronologically and return the next 8 matches
    return activeMatches
      .sort((a, b) => {
        const dateA = parseMatchKickoff(a);
        const dateB = parseMatchKickoff(b);
        if (!dateA) return 1;
        if (!dateB) return -1;
      })
      .slice(0, 16);
  }, [groupMatches, bracket, liveMatches]);

  useEffect(() => {
    const fetchLiveScores = async () => {
      try {
        const response = await fetch(`/live-matches.json?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setLiveMatches(data);
        }
      } catch (error) {
        console.error('Failed to fetch live scores:', error);
      }
    };

    // Initial fetch
    fetchLiveScores();

    // Poll endpoint second-by-second (1000ms)
    const timer = setInterval(fetchLiveScores, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveMatchTime = useCallback((matchId) => {
    const m = liveMatches[matchId];
    if (!m) return '';
    if (m.minute === 'FT' || m.isCompleted) return 'FT';
    if (m.minute === 'HT') return 'HT';
    if (m.minute === undefined || m.minute === null || m.minute === '') return 'LIVE';
    const minStr = String(m.minute).padStart(2, '0');
    const secStr = m.second !== undefined && m.second !== null ? String(m.second).padStart(2, '0') : '00';
    return `LIVE ${minStr}:${secStr}`;
  }, [liveMatches]);

  // Auto-complete finished matches in both groupMatches and bracket states
  useEffect(() => {
    if (Object.keys(liveMatches).length === 0) return;

    setGroupMatches(prevMatches => {
      let changed = false;
      const nextMatches = prevMatches.map(m => {
        const live = liveMatches[m.id];
        if (live && (live.minute === 'FT' || live.isCompleted)) {
          if (!m.isCompleted || m.homeScore !== live.homeScore || m.awayScore !== live.awayScore) {
            changed = true;
            return {
              ...m,
              homeScore: live.homeScore,
              awayScore: live.awayScore,
              isCompleted: true
            };
          }
        }
        return m;
      });
      return changed ? nextMatches : prevMatches;
    });

    setBracket(prevBracket => {
      let changed = false;
      const nextBracket = JSON.parse(JSON.stringify(prevBracket));

      Object.keys(nextBracket).forEach(roundKey => {
        nextBracket[roundKey] = nextBracket[roundKey].map(m => {
          const live = liveMatches[m.id];
          if (live && (live.minute === 'FT' || live.isCompleted)) {
            const liveWinner = live.winner;
            if (!m.isCompleted || m.homeScore !== live.homeScore || m.awayScore !== live.awayScore || m.winner !== liveWinner) {
              changed = true;
              const updatedMatch = {
                ...m,
                homeScore: live.homeScore,
                awayScore: live.awayScore,
                winner: liveWinner,
                isCompleted: true
              };

              // Propagate winner to nextId in nextBracket
              let nextId = m.nextId;
              let currentWinner = liveWinner;
              let currentPosition = m.position;

              while (nextId) {
                const roundCode = nextId.split('_')[0];
                const nextMatch = nextBracket[roundCode].find(nm => nm.id === nextId);
                if (!nextMatch) break;

                const isHome = currentPosition === 'top' || currentPosition === 'home';
                if (isHome) {
                  nextMatch.home = currentWinner;
                } else {
                  nextMatch.away = currentWinner;
                }
                break;
              }
              return updatedMatch;
            }
          }
          return m;
        });
      });

      return changed ? nextBracket : prevBracket;
    });
  }, [liveMatches]);

  // --- Initialize Group Stage & Load Predictions ---
  useEffect(() => {
    const savedMatches = localStorage.getItem('worldcup2026_groupMatches');
    const savedBracket = localStorage.getItem('worldcup2026_bracket');
    const savedBoot = localStorage.getItem('worldcup2026_goldenBoot');
    const savedBall = localStorage.getItem('worldcup2026_goldenBall');
    const savedOverrides = localStorage.getItem('worldcup2026_standingsOverrides');

    if (savedBoot) setGoldenBoot(savedBoot);
    if (savedBall) setGoldenBall(savedBall);
    if (savedOverrides) {
      try {
        setStandingsOverrides(JSON.parse(savedOverrides));
      } catch (e) {
        console.error(e);
      }
    }

    const now = new Date();

    if (savedMatches && savedBracket) {
      const freshMatches = generateGroupMatches();
      // Clean up matches: force future/live matches to have NO scores (be unscheduled/scheduled)
      const parsedMatches = JSON.parse(savedMatches).map(m => {
        const fresh = freshMatches.find(f => f.id === m.id);
        const updatedDate = fresh ? fresh.date : m.date;
        const updatedMatch = { ...m, date: updatedDate };

        const kickoff = parseMatchKickoff(updatedMatch);
        if (kickoff) {
          const end = new Date(kickoff.getTime() + 105 * 60000);
          if (now < end) {
            // It hasn't finished yet in real time! Force clear scores and status
            return { ...updatedMatch, homeScore: null, awayScore: null, isCompleted: false };
          }
        }
        if (m.isCompleted) return updatedMatch;
        return { ...updatedMatch, homeScore: null, awayScore: null };
      });
      setGroupMatches(parsedMatches);
      setBracket(JSON.parse(savedBracket));
    } else {
      // Generate matches and clear any future/live ones
      const initialMatches = generateGroupMatches().map(m => {
        const kickoff = parseMatchKickoff(m);
        if (kickoff) {
          const end = new Date(kickoff.getTime() + 105 * 60000);
          if (now < end) {
            return { ...m, homeScore: null, awayScore: null, isCompleted: false };
          }
        }
        return m;
      });
      setGroupMatches(initialMatches);
    }
    setIsLoaded(true);
  }, []);

  // --- Auto-Save to localStorage when predictions change ---
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('worldcup2026_groupMatches', JSON.stringify(groupMatches));
    localStorage.setItem('worldcup2026_bracket', JSON.stringify(bracket));
    localStorage.setItem('worldcup2026_goldenBoot', goldenBoot);
    localStorage.setItem('worldcup2026_goldenBall', goldenBall);
    localStorage.setItem('worldcup2026_standingsOverrides', JSON.stringify(standingsOverrides));
  }, [groupMatches, bracket, goldenBoot, goldenBall, standingsOverrides, isLoaded]);

  // --- Calculate Standings & Populate R32 ---
  const standings = useMemo(() => {
    if (groupMatches.length === 0) return {};
    // Calculate standings purely from completed matches (real-world data only)
    const calculated = calculateStandings(TEAMS, groupMatches.filter(m => m.isCompleted));
    
    // Apply overrides if present
    const finalStandings = {};
    Object.keys(calculated).forEach(groupKey => {
      if (standingsOverrides[groupKey]) {
        const order = standingsOverrides[groupKey];
        const groupTeamsStats = order.map(code => 
          calculated[groupKey].find(t => t.code === code)
        ).filter(Boolean);
        
        // Fill in any missing teams
        calculated[groupKey].forEach(t => {
          if (!groupTeamsStats.some(s => s.code === t.code)) {
            groupTeamsStats.push(t);
          }
        });
        finalStandings[groupKey] = groupTeamsStats;
      } else {
        finalStandings[groupKey] = calculated[groupKey];
      }
    });
    return finalStandings;
  }, [groupMatches, standingsOverrides]);

  const advancedTeams = useMemo(() => {
    if (Object.keys(standings).length === 0) return { firsts: {}, seconds: {}, thirds: [] };
    return getAdvancedTeams(standings);
  }, [standings]);

  // Sync group standings changes into the R32 Bracket ONLY if the R32 qualified teams differ.
  // This preserves any predicted knockout paths unless the group standings actually change who advances.
  useEffect(() => {
    if (!isLoaded || Object.keys(standings).length === 0) return;

    let hasR32Changed = false;
    const { firsts, seconds, thirds } = advancedTeams;
    
    const r32Mappings = [
      { home: seconds['A']?.code, away: seconds['B']?.code }, // Match 49
      { home: firsts['C']?.code, away: seconds['F']?.code }, // Match 50
      { home: firsts['E']?.code, away: thirds[0]?.code }, // Match 51
      { home: firsts['F']?.code, away: seconds['C']?.code }, // Match 52
      
      { home: seconds['E']?.code, away: seconds['I']?.code }, // Match 53
      { home: firsts['I']?.code, away: thirds[1]?.code }, // Match 54
      { home: firsts['A']?.code, away: thirds[2]?.code }, // Match 55
      { home: firsts['L']?.code, away: thirds[3]?.code }, // Match 56
      
      { home: firsts['G']?.code, away: thirds[4]?.code }, // Match 57
      { home: firsts['D']?.code, away: thirds[5]?.code }, // Match 58
      { home: firsts['H']?.code, away: seconds['J']?.code }, // Match 59
      { home: seconds['K']?.code, away: seconds['L']?.code }, // Match 60
      
      { home: firsts['B']?.code, away: thirds[6]?.code }, // Match 61
      { home: seconds['D']?.code, away: seconds['G']?.code }, // Match 62
      { home: firsts['J']?.code, away: seconds['H']?.code }, // Match 63
      { home: firsts['K']?.code, away: thirds[7]?.code }, // Match 64
    ];

    for (let i = 0; i < r32Mappings.length; i++) {
      const match = bracket.r32[i];
      const mapping = r32Mappings[i];
      // If bracket R32 slots don't match computed advanced teams, we need to sync and reset descendants.
      if (!match || match.home !== mapping.home || match.away !== mapping.away) {
        hasR32Changed = true;
        break;
      }
    }

    if (hasR32Changed) {
      setBracket(prevBracket => {
        const nextBracket = populateRoundOf32(prevBracket, advancedTeams);
        
        // Re-apply any completed knockout matches from liveMatches so they are not lost
        Object.keys(nextBracket).forEach(roundKey => {
          nextBracket[roundKey] = nextBracket[roundKey].map(m => {
            const live = liveMatches[m.id];
            if (live && (live.minute === 'FT' || live.isCompleted)) {
              const liveWinner = live.winner;
              const updatedMatch = {
                ...m,
                homeScore: live.homeScore,
                awayScore: live.awayScore,
                winner: liveWinner,
                isCompleted: true
              };

              // Propagate winner
              let nextId = m.nextId;
              let currentWinner = liveWinner;
              let currentPosition = m.position;

              while (nextId) {
                const roundCode = nextId.split('_')[0];
                const nextMatch = nextBracket[roundCode].find(nm => nm.id === nextId);
                if (!nextMatch) break;

                const isHome = currentPosition === 'top' || currentPosition === 'home';
                if (isHome) {
                  nextMatch.home = currentWinner;
                } else {
                  nextMatch.away = currentWinner;
                }
                break;
              }
              return updatedMatch;
            }
            return m;
          });
        });

        return nextBracket;
      });
    }
  }, [advancedTeams, isLoaded, liveMatches]);

  // --- Dark Mode Effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // --- Handler Functions ---
  
  // Update a single group match score (skips completed matches)
  const handleGroupScoreChange = (matchId, teamType, value) => {
    const scoreVal = value === '' ? null : parseInt(value);
    if (scoreVal !== null && isNaN(scoreVal)) return;

    setGroupMatches(prevMatches => 
      prevMatches.map(m => {
        if (m.id === matchId) {
          if (m.isCompleted) return m; // Skip modifying completed matches
          return {
            ...m,
            [teamType === 'home' ? 'homeScore' : 'awayScore']: scoreVal
          };
        }
        return m;
      })
    );
  };

  // Simulate all group matches (preserves real completed matches)
  const handleSimulateAllGroups = () => {
    setGroupMatches(prevMatches => 
      prevMatches.map(match => {
        if (match.isCompleted) return match; // Keep real scores
        const { homeScore, awayScore } = simulateScore(match.home, match.away);
        return { ...match, homeScore, awayScore };
      })
    );
  };

  const handlePositionChange = (groupKey, teamCode, targetIndex) => {
    setStandingsOverrides(prev => {
      const currentOrder = prev[groupKey] 
        ? [...prev[groupKey]] 
        : (standings[groupKey] || []).map(t => t.code);
        
      if (currentOrder.length < 4) return prev;
      
      const currentIndex = currentOrder.indexOf(teamCode);
      if (currentIndex === -1) return prev;
      
      // Swap positions
      const nextOrder = [...currentOrder];
      const swappedTeam = nextOrder[targetIndex];
      nextOrder[targetIndex] = teamCode;
      nextOrder[currentIndex] = swappedTeam;
      
      return {
        ...prev,
        [groupKey]: nextOrder
      };
    });
  };

  const handlePrevGroup = () => {
    const currentIndex = GROUPS.indexOf(expandedGroup);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + GROUPS.length) % GROUPS.length;
    setExpandedGroup(GROUPS[prevIndex]);
  };

  const handleNextGroup = () => {
    const currentIndex = GROUPS.indexOf(expandedGroup);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % GROUPS.length;
    setExpandedGroup(GROUPS[nextIndex]);
  };

  // Reset all group match predictions (preserves real completed matches)
  const handleResetGroups = () => {
    setGroupMatches(prevMatches => 
      prevMatches.map(match => {
        if (match.isCompleted) return match; // Keep real scores
        return { ...match, homeScore: null, awayScore: null };
      })
    );
  };

  // Sync latest live scores from the network (real-time API fetch)
  const handleSyncLiveScores = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    try {
      // 1. Call custom server middleware endpoint to scrape live data
      const syncResponse = await fetch('/api/sync-live');
      const syncResult = await syncResponse.json();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to sync with FIFA website');
      }

      // 2. Fetch the updated live matches JSON
      const response = await fetch(`/live-matches.json?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        
        // Calculate count of updated matches to display a descriptive toast
        let updatedCount = 0;
        
        groupMatches.forEach(m => {
          const live = data[m.id];
          if (live && (live.minute === 'FT' || live.isCompleted)) {
            if (!m.isCompleted || m.homeScore !== live.homeScore || m.awayScore !== live.awayScore) {
              updatedCount++;
            }
          }
        });
        
        Object.keys(bracket).forEach(roundKey => {
          bracket[roundKey].forEach(m => {
            const live = data[m.id];
            if (live && (live.minute === 'FT' || live.isCompleted)) {
              if (!m.isCompleted || m.homeScore !== live.homeScore || m.awayScore !== live.awayScore || m.winner !== live.winner) {
                updatedCount++;
              }
            }
          });
        });

        // 3. Set the live matches state, which automatically triggers the unified state updates
        setLiveMatches(data);
        
        setSyncToast({
          message: updatedCount > 0 
            ? `Sync completed! Updated ${updatedCount} matches with official FIFA results.`
            : "Synced! All matches are up to date with the official FIFA results.",
          type: 'success'
        });
      } else {
        setSyncToast({
          message: "Failed to fetch live scores from the API server.",
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Failed to sync live scores:', error);
      setSyncToast({
        message: "Error during sync: " + error.message,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  // Predict winner for a knockout match (advances team to next round)
  const handleKnockoutWinner = (roundKey, matchIndex, winnerCode) => {
    if (!winnerCode) return;
    
    setBracket(prevBracket => {
      const newBracket = JSON.parse(JSON.stringify(prevBracket));
      const currentMatch = newBracket[roundKey][matchIndex];
      
      if (currentMatch.winner === winnerCode) return prevBracket; // No change
      
      const oldWinner = currentMatch.winner;
      currentMatch.winner = winnerCode;
      
      // Cascading propagation to the next match
      let nextId = currentMatch.nextId;
      let currentWinner = winnerCode;
      let currentPosition = currentMatch.position;
      
      while (nextId) {
        const roundCode = nextId.split('_')[0];
        const nextMatch = newBracket[roundCode].find(m => m.id === nextId);
        
        if (!nextMatch) break;
        
        const isHome = currentPosition === 'top' || currentPosition === 'home';
        const previousTargetTeam = isHome ? nextMatch.home : nextMatch.away;
        
        // Update the next match's participant slot
        if (isHome) {
          nextMatch.home = currentWinner;
        } else {
          nextMatch.away = currentWinner;
        }
        
        // If the next match's winner was the team we just replaced, we must clear that winner
        // and propagate the deletion down the tree
        if (nextMatch.winner === oldWinner && oldWinner !== null) {
          nextMatch.winner = null;
          currentWinner = null;
          currentPosition = nextMatch.position;
          nextId = nextMatch.nextId;
        } else {
          break;
        }
      }
      
      return newBracket;
    });
  };

  // Get current winner of the tournament
  const tournamentChampion = useMemo(() => {
    const finalMatch = bracket.final[0];
    if (finalMatch && finalMatch.winner) {
      return TEAMS[finalMatch.winner];
    }
    return null;
  }, [bracket]);

  // Custom helper to check if a team is still active in a user's prediction path
  const isTeamInMatchPath = (teamCode, matchId) => {
    if (!teamCode) return false;
    // Walk through bracket and see if teamCode appears in any matches
    let found = false;
    Object.keys(bracket).forEach(round => {
      bracket[round].forEach(m => {
        if (m.id === matchId && (m.home === teamCode || m.away === teamCode)) {
          found = true;
        }
      });
    });
    return found;
  };

  // Share prediction callback
  const handleShare = () => {
    const text = tournamentChampion 
      ? `My FIFA World Cup 2026 champion is ${tournamentChampion.flag} ${tournamentChampion.name}! Predict yours here.`
      : "Predict the FIFA World Cup 2026 bracket and explore host cities!";
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareText('Copied Link!');
      setTimeout(() => setShareText('Share predictions'), 2000);
    } else {
      alert("Bracket URL copied to clipboard!");
    }
  };

  // Save prediction configuration
  const handleSavePredictions = () => {
    setPredictionSaved(true);
    setTimeout(() => setPredictionSaved(false), 3000);
  };

  // Render Bracket Column List (Left or Right)
  const renderBracketColumn = (roundKey, matches, isRight = false) => {
    return (
      <div className="flex flex-col justify-around h-full gap-4 py-4 min-w-[240px] md:min-w-[280px]">
        <h3 className="text-center font-semibold text-xs tracking-wider text-slate-400 uppercase border-b border-slate-700/50 pb-2 mb-2">
          {roundKey === 'r32' && 'Round of 32'}
          {roundKey === 'r16' && 'Round of 16'}
          {roundKey === 'qf' && 'Quarter-Finals'}
          {roundKey === 'sf' && 'Semi-Finals'}
        </h3>
        {matches.map((match, idx) => {
          const actualIdx = idx + (isRight ? (roundKey === 'r32' ? 8 : roundKey === 'r16' ? 4 : roundKey === 'qf' ? 2 : roundKey === 'sf' ? 1 : 0) : 0);
          const homeTeam = TEAMS[match.home];
          const awayTeam = TEAMS[match.away];
          const isHomeWinner = match.winner === match.home && match.winner !== null;
          const isAwayWinner = match.winner === match.away && match.winner !== null;
          
          const isHoveredMatch = hoveredTeam && (match.home === hoveredTeam || match.away === hoveredTeam);
          const isWinnerHovered = hoveredTeam && match.winner === hoveredTeam;

          return (
            <div 
              key={match.id} 
              className={`p-3 rounded-xl transition-all duration-300 relative border ${
                isHoveredMatch 
                  ? 'border-brand-neon bg-slate-900/90 shadow-neon ring-1 ring-brand-neon/30' 
                  : 'border-slate-800/80 bg-brand-cardBg'
              } flex flex-col gap-2`}
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold tracking-tight">
                <span>{match.title}</span>
                <span className="text-brand-neon font-bold font-mono text-[9px]">{match.date}</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                {/* Home Team */}
                <div
                  id={`slot-${match.id}-home`}
                  onMouseEnter={() => match.home && setHoveredTeam(match.home)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => match.home && handleKnockoutWinner(roundKey, actualIdx, match.home)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-all text-xs font-semibold ${
                    !match.home 
                      ? 'text-slate-600 bg-slate-950/20 cursor-not-allowed' 
                      : isHomeWinner 
                        ? 'bg-brand-neon/15 text-brand-neon ring-1 ring-brand-neon/30 font-bold cursor-pointer hover:bg-brand-neon/25' 
                        : 'bg-slate-950/30 text-slate-300 cursor-pointer hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-lg">{homeTeam ? homeTeam.flag : '🏳️'}</span>
                    <span className="truncate">{homeTeam ? homeTeam.name : 'TBD (Group Stage)'}</span>
                  </div>
                  {isHomeWinner && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>

                {/* Away Team */}
                <div
                  id={`slot-${match.id}-away`}
                  onMouseEnter={() => match.away && setHoveredTeam(match.away)}
                  onMouseLeave={() => setHoveredTeam(null)}
                  onClick={() => match.away && handleKnockoutWinner(roundKey, actualIdx, match.away)}
                  className={`flex items-center justify-between w-full p-2 rounded-lg text-left transition-all text-xs font-semibold ${
                    !match.away 
                      ? 'text-slate-600 bg-slate-950/20 cursor-not-allowed' 
                      : isAwayWinner 
                        ? 'bg-brand-neon/15 text-brand-neon ring-1 ring-brand-neon/30 font-bold cursor-pointer hover:bg-brand-neon/25' 
                        : 'bg-slate-950/30 text-slate-300 cursor-pointer hover:bg-slate-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="text-lg">{awayTeam ? awayTeam.flag : '🏳️'}</span>
                    <span className="truncate">{awayTeam ? awayTeam.name : 'TBD (Group Stage)'}</span>
                  </div>
                  {isAwayWinner && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getMatchTimeStatus = useCallback((match) => {
    if (match.isCompleted) {
      return { type: 'prev', isLive: false, isCompleted: true };
    }
    const kickoff = parseMatchKickoff(match);
    if (!kickoff) return { type: 'upcoming', isLive: false, isCompleted: false };
    
    const now = new Date();
    const end = new Date(kickoff.getTime() + 105 * 60000);
    
    if (now < kickoff) {
      return { type: 'upcoming', isLive: false, isCompleted: false };
    } else if (now >= end) {
      return { type: 'prev', isLive: false, isCompleted: true };
    } else {
      return { type: 'current', isLive: true, isCompleted: false };
    }
  }, []);

  const sortedMatches = useMemo(() => {
    return [...groupMatches].sort((a, b) => {
      const dateA = parseMatchKickoff(a);
      const dateB = parseMatchKickoff(b);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [groupMatches]);

  const feedMatches = useMemo(() => {
    return sortedMatches
      .filter(m => m.isCompleted)
      .slice()
      .reverse();
  }, [sortedMatches]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-brand-darkBg text-slate-100' : 'bg-[#F1F5F9] text-slate-800'} font-sans antialiased transition-colors duration-300`}>
      
      {/* Background glow effects for visual wow-factor */}
      {darkMode && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 right-10 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-brand-neon/10 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-royal/10 rounded-full blur-3xl opacity-30"></div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className={`relative z-10 border-b ${darkMode ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-gold/20 p-2 rounded-xl border border-brand-gold/40 glow-gold animate-float">
              <Trophy className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-neon bg-clip-text text-transparent dark:from-white">
                WORLDCUP 2K26
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Interactive Roadmap & Bracket</p>
            </div>
          </div>

          {/* Countdown & Navigation Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 dark:bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800/60 text-xs font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon"></span>
              </span>
              <span className="text-slate-300">World Cup Live in USA, CAN & MEX</span>
            </div>

            {/* Dark Mode toggle */}
            <button 
              id="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-brand-gold" /> : <Moon className="w-4.5 h-4.5" />}
            </button>


          </div>
        </div>
      </header>

      {/* --- MAIN TABS NAV --- */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-2 p-1 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/40 w-full overflow-x-auto scrollbar-none sm:w-fit whitespace-nowrap">
          <button
            id="tab-groups"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'groups' 
                ? 'bg-brand-neon text-slate-950 shadow-neon' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Group Stage & Fixtures</span>
          </button>

          <button
            id="tab-bracket"
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'bracket' 
                ? 'bg-brand-neon text-slate-950 shadow-neon' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Roadmap Tree</span>
          </button>

          <button
            id="tab-venues"
            onClick={() => setActiveTab('venues')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'venues' 
                ? 'bg-brand-neon text-slate-950 shadow-neon' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Stadium Venues</span>
          </button>


        </div>
      </nav>

      {/* --- CONTENT CONTAINER --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        
        {/* ================= ROADMAP TREE TAB ================= */}
        {activeTab === 'bracket' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Legend & Instructions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-neon" />
                  Tournament Bracket Roadmap
                </h2>
                <p className="text-xs text-slate-400">View the qualified teams and progress of the knockout rounds in real time. Hover over any country to highlight their tournament path.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="w-3.5 h-3.5 rounded bg-brand-neon/20 border border-brand-neon/60 inline-block"></span>
                  <span>Qualified / Advanced Team</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="w-3.5 h-3.5 rounded bg-brand-cardBg border border-slate-800 inline-block"></span>
                  <span>TBD / Not Qualified</span>
                </div>
              </div>
            </div>

            {/* Collapsible Group Stage Qualifiers Section */}
            <div className="p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80">
              <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowGroupSelectors(!showGroupSelectors)}>
                <div>
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-brand-neon animate-pulse" />
                    Group Stage Standings & R32 Qualifiers (48 Teams)
                  </h2>
                  <p className="text-xs text-slate-450 mt-1">Directly select group ranks (1st, 2nd, 3rd, 4th) to seed and qualify teams from 48 to 32 in the bracket below.</p>
                </div>
                <button className="text-slate-405 hover:text-white transition-all text-[10px] font-bold flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                  {showGroupSelectors ? 'Hide Group Standings' : 'Show Group Standings'}
                </button>
              </div>

              {showGroupSelectors && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5 animate-fadeIn">
                  {GROUPS.map(g => {
                    const groupStandings = standings[g] || [];
                    return (
                      <div key={g} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-slate-850 transition-all flex flex-col gap-2">
                        <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                          <span className="text-[10px] font-extrabold text-slate-350 tracking-widest">GROUP {g}</span>
                          <span className="text-[8px] text-slate-550 font-mono font-black">RANKING</span>
                        </div>
                        <table className="w-full text-left text-[10px] font-semibold">
                          <thead>
                            <tr className="text-slate-500 font-bold border-b border-slate-900/40">
                              <th className="py-1 w-12 text-[9px]">POS</th>
                              <th className="py-1 text-[9px]">TEAM</th>
                              <th className="py-1 text-center text-[9px] text-brand-neon">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/30">
                            {groupStandings.map((t, index) => {
                              const isQualifying = index < 2;
                              const isBestThird = index === 2 && advancedTeams.thirds.some(th => th.code === t.code);
                              return (
                                <tr key={t.code} className="hover:bg-slate-900/10 transition-all">
                                  <td className="py-1.5">
                                    <select
                                      value={index}
                                      onChange={(e) => handlePositionChange(g, t.code, parseInt(e.target.value))}
                                      className={`flex items-center justify-center w-10 h-5 rounded font-black text-[9px] cursor-pointer transition-all outline-none border px-0.5 ${
                                        index === 0 
                                          ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20' 
                                          : index === 1 
                                            ? 'bg-slate-400/10 border-slate-400/30 text-slate-350 hover:bg-slate-400/20' 
                                            : index === 2 
                                              ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal hover:bg-brand-royal/20' 
                                              : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <option value={0} className="bg-slate-950 text-slate-200">1st</option>
                                      <option value={1} className="bg-slate-950 text-slate-200">2nd</option>
                                      <option value={2} className="bg-slate-950 text-slate-200">3rd</option>
                                      <option value={3} className="bg-slate-950 text-slate-200">4th</option>
                                    </select>
                                  </td>
                                  <td className="py-1.5 text-slate-200 flex items-center gap-1.5 truncate">
                                    <span className="text-base shrink-0">{t.flag}</span>
                                    <span className="truncate max-w-[70px] font-bold" title={t.name}>{t.name}</span>
                                    {isQualifying && <span className="text-[7px] bg-brand-neon/15 border border-brand-neon/30 text-brand-neon px-1 rounded-sm leading-none py-0.5 font-extrabold">R32</span>}
                                    {isBestThird && <span className="text-[7px] bg-brand-royal/15 border border-brand-royal/30 text-brand-royal px-1 rounded-sm leading-none py-0.5 font-extrabold">R32 *</span>}
                                  </td>
                                  <td className="py-1.5 text-center font-extrabold text-[10px] text-brand-neon">{t.points}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tree Bracket Container (Scrollable horizontally) */}
            <div className="overflow-x-auto pb-6">
              <div className="min-w-[1280px] flex gap-4 items-center justify-between select-none">
                
                {/* --- LEFT BRACKET --- */}
                {renderBracketColumn('r32', bracket.r32.slice(0, 8))}
                {renderBracketColumn('r16', bracket.r16.slice(0, 4))}
                {renderBracketColumn('qf', bracket.qf.slice(0, 2))}
                {renderBracketColumn('sf', bracket.sf.slice(0, 1))}

                {/* --- CENTER: TROPHY & FINAL --- */}
                <div className="flex flex-col items-center justify-center min-w-[280px] p-6 rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/90 border border-brand-gold/20 shadow-gold relative">
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-brand-gold font-bold">
                    <Star className="w-3 h-3 fill-brand-gold" />
                    <span>CHAMPIONS</span>
                  </div>

                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-brand-gold/10 rounded-full blur-xl animate-pulse"></div>
                    <Trophy className="w-20 h-20 text-brand-gold drop-shadow-xl animate-float relative z-10" />
                  </div>

                  {/* Final match card */}
                  {bracket.final.map((match, idx) => {
                    const homeTeam = TEAMS[match.home];
                    const awayTeam = TEAMS[match.away];
                    const isHomeWinner = match.winner === match.home && match.winner !== null;
                    const isAwayWinner = match.winner === match.away && match.winner !== null;

                    return (
                      <div key={match.id} className="w-full flex flex-col gap-3">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">The Grand Final</p>
                          <p className="text-[9px] text-brand-neon font-bold font-mono">July 20, 2026 • 05:30 AM IST</p>
                          <p className="text-[8px] text-slate-500 font-semibold mt-0.5">New York/New Jersey</p>
                        </div>

                        <div className="flex flex-col gap-2 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                          {/* Home */}
                          <div
                            id={`slot-final-home`}
                            onMouseEnter={() => match.home && setHoveredTeam(match.home)}
                            onMouseLeave={() => setHoveredTeam(null)}
                            onClick={() => match.home && handleKnockoutWinner('final', idx, match.home)}
                            className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all text-xs font-bold ${
                              !match.home 
                                ? 'text-slate-600 bg-slate-900/20 cursor-not-allowed' 
                                : isHomeWinner 
                                  ? 'bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/50 shadow-gold cursor-pointer hover:bg-brand-gold/30' 
                                  : 'bg-slate-900/50 text-slate-200 cursor-pointer hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden truncate">
                              <span className="text-lg">{homeTeam ? homeTeam.flag : '🏳️'}</span>
                              <span className="truncate">{homeTeam ? homeTeam.name : 'TBD SF 1 Winner'}</span>
                            </div>
                            {isHomeWinner && <Check className="w-4 h-4 shrink-0 text-brand-gold" />}
                          </div>

                          {/* Away */}
                          <div
                            id={`slot-final-away`}
                            onMouseEnter={() => match.away && setHoveredTeam(match.away)}
                            onMouseLeave={() => setHoveredTeam(null)}
                            onClick={() => match.away && handleKnockoutWinner('final', idx, match.away)}
                            className={`flex items-center justify-between w-full p-2.5 rounded-xl text-left transition-all text-xs font-bold ${
                              !match.away 
                                ? 'text-slate-600 bg-slate-900/20 cursor-not-allowed' 
                                : isAwayWinner 
                                  ? 'bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/50 shadow-gold cursor-pointer hover:bg-brand-gold/30' 
                                  : 'bg-slate-900/50 text-slate-200 cursor-pointer hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden truncate">
                              <span className="text-lg">{awayTeam ? awayTeam.flag : '🏳️'}</span>
                              <span className="truncate">{awayTeam ? awayTeam.name : 'TBD SF 2 Winner'}</span>
                            </div>
                            {isAwayWinner && <Check className="w-4 h-4 shrink-0 text-brand-gold" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Champion Reveal Box */}
                  {tournamentChampion ? (
                    <div className="mt-5 text-center animate-bounce">
                      <p className="text-[10px] text-brand-neon font-bold tracking-widest">WORLD CUP CHAMPION</p>
                      <p className="text-lg font-extrabold text-white flex items-center gap-1.5 justify-center mt-1">
                        <span>{tournamentChampion.flag}</span>
                        <span>{tournamentChampion.name.toUpperCase()}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-4 text-center">Predict all matches to crown the champion!</p>
                  )}
                </div>

                {/* --- RIGHT BRACKET --- */}
                {renderBracketColumn('sf', bracket.sf.slice(1, 2), true)}
                {renderBracketColumn('qf', bracket.qf.slice(2, 4), true)}
                {renderBracketColumn('r16', bracket.r16.slice(4, 8), true)}
                {renderBracketColumn('r32', bracket.r32.slice(8, 16), true)}

              </div>
            </div>
          </div>
        )}

        {/* ================= GROUP STANDINGS TAB ================= */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left side: Upcoming Fixtures & Done Matches timeline */}
            <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Upcoming Fixtures widget */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/60 to-slate-950/80 border border-brand-purple/20 backdrop-blur-md relative overflow-hidden shadow-glass">
                {/* Glow accent */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon"></span>
                    </span>
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-1">
                      Upcoming 16 Fixtures
                    </h3>
                  </div>
                  <span className="text-[8px] bg-brand-neon/10 border border-brand-neon/20 text-brand-neon px-2 py-0.5 rounded-full font-bold font-mono">
                    LIVE STATUS
                  </span>
                </div>

                <div className="flex flex-col gap-3 relative z-10 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {upcomingFixtures.map(match => {
                    const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
                    const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
                    const live = liveMatches[match.id];
                    const isMatchLive = live && live.minute !== null && live.minute !== undefined && live.minute !== 'FT' && live.minute !== '';
                    const isLiveOrDone = isMatchLive || match.isCompleted || (live && (live.minute === 'FT' || live.isCompleted));
                    return (
                      <div 
                        key={`today-${match.id}`} 
                        onClick={() => setSelectedMatch(match)}
                        className={`p-3 bg-slate-950/50 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer relative overflow-hidden shrink-0 ${
                          isMatchLive 
                            ? 'border-brand-neon bg-gradient-to-br from-brand-neon/5 to-slate-950/80 shadow-[0_0_15px_rgba(0,242,254,0.1)] ring-1 ring-brand-neon/20' 
                            : 'border-slate-900/85 hover:border-slate-800 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold">
                          <span className="text-brand-neon uppercase font-extrabold flex items-center gap-1">
                            Group {match.group} • Match {match.id}
                            {isMatchLive && (
                              <span className="flex h-1.5 w-1.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-neon"></span>
                              </span>
                            )}
                          </span>
                          <span className="text-slate-450 font-mono">{match.date}</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 py-0.5">
                          {/* Home Team */}
                          <div className={`flex items-center gap-1.5 font-bold flex-1 truncate ${isMatchLive ? 'text-xs text-slate-100 font-black' : 'text-[11px] text-slate-200'}`}>
                            <span className={`shrink-0 ${isMatchLive ? 'text-lg' : 'text-base'}`}>{home.flag}</span>
                            <span className="truncate">{home.name}</span>
                          </div>

                          {/* Live score / VS */}
                          {isLiveOrDone ? (
                            <div className="flex flex-col items-center gap-0.5 shrink-0">
                              <div className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded font-bold font-mono ${
                                isMatchLive 
                                  ? 'bg-brand-neon/20 border border-brand-neon/30 text-brand-neon text-xs' 
                                  : 'bg-slate-800/80 border border-slate-700/50 text-slate-300 text-[10px]'
                              }`}>
                                <span>{match.isCompleted ? match.homeScore : live.homeScore}</span>
                                <span>-</span>
                                <span>{match.isCompleted ? match.awayScore : live.awayScore}</span>
                              </div>
                              <span className={`font-extrabold tracking-wide uppercase ${isMatchLive ? 'text-[8px] text-brand-neon animate-pulse' : 'text-[7px] text-slate-400'}`}>
                                {match.isCompleted ? 'FT' : formatLiveMatchTime(match.id)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[8px] font-extrabold bg-slate-900 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                              VS
                            </span>
                          )}

                          {/* Away Team */}
                          <div className={`flex items-center gap-1.5 font-bold flex-1 justify-end truncate ${isMatchLive ? 'text-xs text-slate-100 font-black' : 'text-[11px] text-slate-200'}`}>
                            <span className="truncate text-right">{away.name}</span>
                            <span className={`shrink-0 ${isMatchLive ? 'text-lg' : 'text-base'}`}>{away.flag}</span>
                          </div>
                        </div>

                        {/* Live match stats expansion (equivalent to space of 3 items) */}
                        {isMatchLive && live.stats && (
                          <div className="mt-1 pt-2 border-t border-slate-800/60 flex flex-col gap-2 text-[9px] text-slate-400 font-bold">
                            {/* Possession Row */}
                            <div className="flex justify-between items-center font-mono text-slate-300">
                              <span>{live.stats.possession?.[0] || 50}%</span>
                              <span className="text-[7px] uppercase tracking-wider text-slate-500 font-sans">Possession</span>
                              <span>{live.stats.possession?.[1] || 50}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden flex">
                              <div className="bg-brand-neon h-full transition-all duration-500" style={{ width: `${live.stats.possession?.[0] || 50}%` }} />
                              <div className="bg-brand-purple h-full transition-all duration-500" style={{ width: `${live.stats.possession?.[1] || 50}%` }} />
                            </div>

                            {/* Stats Summary Row */}
                            <div className="flex justify-around items-center text-[8px] font-mono text-slate-400 pt-0.5">
                              <div className="flex items-center gap-1.5">
                                <span>🎯 Shots:</span>
                                <span className="text-slate-200 font-black">{live.stats.shots?.[0] || 0} - {live.stats.shots?.[1] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>🚩 Corners:</span>
                                <span className="text-slate-200 font-black">{live.stats.corners?.[0] || 0} - {live.stats.corners?.[1] || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>⚡ Fouls:</span>
                                <span className="text-slate-200 font-black">{live.stats.fouls?.[0] || 0} - {live.stats.fouls?.[1] || 0}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {/* Match Timeline Feed Widget */}
              <div className="p-4 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 flex flex-col gap-3">
                <div>
                  <h2 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-brand-neon" />
                    Done Matches
                  </h2>
                  <p className="text-[10px] text-slate-400">Timeline of completed tournament fixtures.</p>
                </div>

                {/* Scrolling List */}
                <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {feedMatches.map(match => {
                    const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
                    const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
                    return (
                      <div 
                        key={`feed-${match.id}`} 
                        onClick={() => setSelectedMatch(match)}
                        className="p-2.5 rounded-xl border transition-all bg-slate-950/70 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/50 cursor-pointer flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-800 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded text-[8px]">FT</span>
                            <span className="text-slate-500 font-mono">Match {match.id} ({match.group})</span>
                          </div>
                          <span className="text-[8px] text-slate-500 font-mono">{match.date}</span>
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-200">
                          {/* Home */}
                          <div className="flex items-center gap-1.5 flex-1 truncate">
                            <span>{home.flag}</span>
                            <span className="truncate">{home.name}</span>
                          </div>

                          {/* Scores */}
                          <div className="px-2.5 py-0.5 bg-slate-950 rounded border border-slate-900 font-extrabold font-mono text-[10px] min-w-[36px] text-center shrink-0">
                            <span className="text-brand-neon">{match.homeScore} - {match.awayScore}</span>
                          </div>

                          {/* Away */}
                          <div className="flex items-center gap-1.5 flex-1 justify-end truncate">
                            <span className="truncate text-right">{away.name}</span>
                            <span>{away.flag}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side: Detailed Group standings and match listing */}
            <div className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-2">

              {/* Standings Table for selected group */}
              <div className="p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80 flex flex-col gap-4">
                
                {/* Small A B C D ... Tabs to filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-900/60 z-10 relative">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest shrink-0 mr-2">Filter Group:</span>
                  <div className="flex gap-1.5">
                    {GROUPS.map(g => {
                      const isActive = expandedGroup === g;
                      return (
                        <button
                          key={g}
                          onClick={() => setExpandedGroup(g)}
                          className={`w-7.5 h-7.5 rounded-lg font-black text-xs transition-all flex items-center justify-center border select-none cursor-pointer ${
                            isActive
                              ? 'border-brand-neon bg-brand-neon/15 text-brand-neon shadow-neon ring-1 ring-brand-neon/20'
                              : 'border-slate-850 bg-slate-950/45 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePrevGroup}
                      className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1 select-none cursor-pointer"
                      title="Previous Group"
                    >
                      ← Prev
                    </button>
                    <span>Group {expandedGroup} Standings</span>
                    <button 
                      onClick={handleNextGroup}
                      className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-bold transition-all flex items-center gap-1 select-none cursor-pointer"
                      title="Next Group"
                    >
                      Next →
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Tie-breakers: Points, GD, GF</span>
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 font-bold">POS</th>
                        <th className="py-2.5 font-bold">TEAM</th>
                        <th className="py-2.5 font-bold text-center">P</th>
                        <th className="py-2.5 font-bold text-center">W</th>
                        <th className="py-2.5 font-bold text-center">D</th>
                        <th className="py-2.5 font-bold text-center">L</th>
                        <th className="py-2.5 font-bold text-center">GD</th>
                        <th className="py-2.5 font-bold text-center text-brand-neon">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(standings[expandedGroup] || []).map((t, index) => {
                        const isQualifying = index < 2;
                        const isBestThird = index === 2 && advancedTeams.thirds.some(th => th.code === t.code);
                        return (
                          <tr key={t.code} className="hover:bg-slate-900/10 transition-all">
                            <td className="py-3 pr-2">
                              <select
                                value={index}
                                onChange={(e) => handlePositionChange(expandedGroup, t.code, parseInt(e.target.value))}
                                className={`flex items-center justify-center w-12 h-6 rounded-lg font-black text-[10px] cursor-pointer transition-all outline-none border px-1 ${
                                  index === 0 
                                    ? 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20' 
                                    : index === 1 
                                      ? 'bg-slate-400/10 border-slate-400/30 text-slate-350 hover:bg-slate-400/20' 
                                      : index === 2 
                                        ? 'bg-brand-royal/10 border-brand-royal/30 text-brand-royal hover:bg-brand-royal/20' 
                                        : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800/50'
                                }`}
                              >
                                <option value={0} className="bg-slate-950 text-slate-200">1st</option>
                                <option value={1} className="bg-slate-950 text-slate-200">2nd</option>
                                <option value={2} className="bg-slate-950 text-slate-200">3rd</option>
                                <option value={3} className="bg-slate-950 text-slate-200">4th</option>
                              </select>
                            </td>
                            <td className="py-3 font-bold flex items-center gap-2 text-slate-200">
                              <span className="text-lg">{t.flag}</span>
                              <span className="truncate">{t.name}</span>
                              {isQualifying && <span className="text-[8px] bg-brand-neon/10 border border-brand-neon/40 text-brand-neon px-1 rounded">R32</span>}
                              {isBestThird && <span className="text-[8px] bg-brand-royal/10 border border-brand-royal/40 text-brand-royal px-1 rounded">R32 *</span>}
                            </td>
                            <td className="py-3 text-center text-slate-400">{t.played}</td>
                            <td className="py-3 text-center text-slate-400">{t.won}</td>
                            <td className="py-3 text-center text-slate-400">{t.drawn}</td>
                            <td className="py-3 text-center text-slate-400">{t.lost}</td>
                            <td className={`py-3 text-center font-semibold ${t.gd > 0 ? 'text-brand-neon' : t.gd < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                              {t.gd > 0 ? `+${t.gd}` : t.gd}
                            </td>
                            <td className="py-3 text-center font-bold text-sm text-brand-neon">{t.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Match list for selected group */}
              <div className="p-5 rounded-2xl bg-brand-cardBg backdrop-blur-md border border-slate-800/80">
                <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-neon" />
                  Group {expandedGroup} Match Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupMatches.filter(m => m.group === expandedGroup).map(match => {
                    const home = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
                    const away = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
                    const live = liveMatches[match.id];
                    const isMatchLive = live && live.minute !== null && live.minute !== undefined && live.minute !== 'FT' && live.minute !== '';
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => setSelectedMatch(match)}
                        className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/30 cursor-pointer transition-all flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold">
                          <span>MATCH {match.id}</span>
                          {match.isCompleted ? (
                            <span className="text-brand-neon bg-brand-neon/10 border border-brand-neon/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold font-mono">Completed (Real)</span>
                          ) : (
                            <span>{match.date}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 justify-between">
                          {/* Home Row */}
                          <div className={`flex items-center gap-2 font-bold text-xs text-slate-200 flex-1 truncate ${match.isCompleted ? 'opacity-85' : ''}`}>
                            <span>{home.flag}</span>
                            <span className="truncate">{home.name}</span>
                          </div>
                          
                          {/* Score display or VS separator (Read-Only) */}
                          <div className="flex items-center gap-1.5 justify-center min-w-[70px]">
                            {match.isCompleted ? (
                              <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-brand-neon font-mono font-black">
                                <span>{match.homeScore}</span>
                                <span className="text-slate-600">:</span>
                                <span>{match.awayScore}</span>
                              </div>
                            ) : isMatchLive ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center justify-center gap-1.5 px-2.5 py-0.5 bg-brand-neon/20 border border-brand-neon/30 rounded-lg text-xs font-bold text-brand-neon font-mono">
                                  <span>{live.homeScore}</span>
                                  <span className="text-brand-neon/60">:</span>
                                  <span>{live.awayScore}</span>
                                </div>
                                <span className="text-[7px] font-extrabold text-brand-neon tracking-wide flex items-center gap-0.5 animate-pulse font-mono">
                                  {formatLiveMatchTime(match.id)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-extrabold bg-slate-900 border border-slate-800 text-slate-500 px-3 py-1 rounded-md font-mono shrink-0">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Away Row */}
                          <div className="flex items-center gap-2 font-bold text-xs text-slate-200 flex-1 justify-end truncate">
                            <span className="truncate">{away.name}</span>
                            <span>{away.flag}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= STADIUM VENUES TAB ================= */}
        {activeTab === 'venues' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-brand-cardBg border border-slate-800/80">
              <h2 className="text-base font-bold text-white">16 Stadium Venues</h2>
              <p className="text-xs text-slate-400">Discover the iconic hosting stadiums across the United States, Canada, and Mexico.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VENUES.map(venue => (
                <div key={venue.name} className="p-5 rounded-2xl border border-slate-800/80 bg-brand-cardBg flex flex-col justify-between hover:border-brand-purple/50 transition-all hover:-translate-y-1 duration-300">
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
                  
                  <div className="border-t border-slate-800/60 mt-4 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>FIFA STANDARD STADIUM</span>
                    <span>2026 WORLD CUP HOST</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



      </main>

      {/* --- FOOTER --- */}
      <footer className={`relative z-10 border-t ${darkMode ? 'border-slate-900 bg-slate-950/50' : 'border-slate-200 bg-white/50'} py-8 mt-12 text-center text-xs text-slate-500 font-bold`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-neon" />
            <span>WORLDCUP 2K26 Interactive Roadmap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for soccer fans worldwide</span>
          </div>
          <p>© 2026 FIFA World Cup Bracket Predictor. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideIn flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-950 border border-brand-neon/40 backdrop-blur-xl shadow-2xl max-w-md">
          <div className="bg-brand-neon/20 p-2 rounded-xl border border-brand-neon/30">
            <Radio className="w-5 h-5 text-brand-neon animate-pulse shrink-0" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">Live Sync Completed</h4>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed font-medium">{syncToast.message}</p>
          </div>
        </div>
      )}

      {/* Match Details Modal (Scorers & Stats) */}
      {selectedMatch && (() => {
        const home = TEAMS[selectedMatch.home] || { name: selectedMatch.home || 'TBD', flag: '🏳️' };
        const away = TEAMS[selectedMatch.away] || { name: selectedMatch.away || 'TBD', flag: '🏳️' };

        const live = liveMatches[selectedMatch.id];
        const details = getMatchDetails(selectedMatch, live);

        const isCompleted = selectedMatch.isCompleted || (live && live.minute === 'FT');
        const isLive = live && live.minute !== 'FT';
        const hasStarted = isCompleted || isLive;

        const homeScore = live ? live.homeScore : (selectedMatch.homeScore ?? 0);
        const awayScore = live ? live.awayScore : (selectedMatch.awayScore ?? 0);

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setSelectedMatch(null)}
          >
            <div 
              className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
                onClick={() => setSelectedMatch(null)}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Match Header */}
              <div className="text-center">
                <div className="text-xs font-extrabold text-brand-neon uppercase tracking-widest mb-1">
                  Group {selectedMatch.group} • Match {selectedMatch.id}
                </div>
                <div className="text-[11px] text-slate-400 font-bold font-mono">
                  {selectedMatch.venue || 'TBD Stadium'} • {selectedMatch.date}
                </div>
              </div>

              {/* Scoreboard */}
              <div className="flex items-center justify-between gap-4 py-3 px-5 bg-slate-950/50 rounded-2xl border border-slate-900">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-4xl select-none">{home.flag}</span>
                  <span className="text-xs font-black text-slate-100 truncate text-center w-full">{home.name}</span>
                </div>

                {/* Score digits */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-black font-mono ${hasStarted ? 'text-white' : 'text-slate-600'}`}>
                      {hasStarted ? homeScore : '-'}
                    </span>
                    <span className="text-xl font-bold text-slate-700">:</span>
                    <span className={`text-3xl font-black font-mono ${hasStarted ? 'text-white' : 'text-slate-600'}`}>
                      {hasStarted ? awayScore : '-'}
                    </span>
                  </div>
                  <div>
                    {isLive ? (
                      <span className="bg-brand-neon/20 text-brand-neon border border-brand-neon/30 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-ping"></span>
                        {live.minute === 'HT' ? 'HT' : (String(live.minute).includes("'") || String(live.minute).toLowerCase() === 'live' ? live.minute : `${String(live.minute).padStart(2, '0')}:${String(live.second).padStart(2, '0')}`)}
                      </span>
                    ) : isCompleted ? (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                        Full Time
                      </span>
                    ) : (
                      <span className="bg-brand-neon/15 text-brand-neon border border-brand-neon/30 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-4xl select-none">{away.flag}</span>
                  <span className="text-xs font-black text-slate-100 truncate text-center w-full">{away.name}</span>
                </div>
              </div>

              {/* Scorers Section */}
              {hasStarted && (
                <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚽</span> Goal Scorers
                  </h4>
                  {details.scorers && details.scorers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 text-[11px] font-bold font-mono">
                      {/* Home Scorers */}
                      <div className="flex flex-col gap-1 text-left">
                        {details.scorers.filter(s => s.team === 'home').map((s, idx) => (
                          <span key={`h-scorer-${idx}`} className="text-slate-300 flex items-center gap-1">
                            <span>{s.player}</span>
                            <span className="text-brand-neon">({s.minute}')</span>
                          </span>
                        ))}
                      </div>
                      {/* Away Scorers */}
                      <div className="flex flex-col gap-1 text-right">
                        {details.scorers.filter(s => s.team === 'away').map((s, idx) => (
                          <span key={`a-scorer-${idx}`} className="text-slate-300 flex items-center justify-end gap-1">
                            <span>{s.player}</span>
                            <span className="text-brand-neon">({s.minute}')</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500 font-bold italic py-1">
                      No goals scored in this match.
                    </div>
                  )}
                </div>
              )}
              {/* Match Timeline */}
              {hasStarted && details.timeline && details.timeline.length > 0 && (
                <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⏱️</span> Match Timeline
                  </h4>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                    {details.timeline
                      .filter(event => {
                        const typeLower = event.type.toLowerCase();
                        return typeLower.includes('goal') || 
                               typeLower.includes('card') || 
                               typeLower.includes('sub') || 
                               typeLower.includes('start') || 
                               typeLower.includes('end') || 
                               typeLower.includes('half') || 
                               typeLower.includes('whistle') || 
                               typeLower.includes('toss') || 
                               typeLower.includes('kick off');
                      })
                      .slice()
                      .reverse()
                      .map((event, idx) => {
                        const normalize = (name) => name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
                        const normText = normalize(event.text);
                        const normHomeName = normalize(home.name);
                        const normAwayName = normalize(away.name);
                        
                        const isHome = normText.includes(normHomeName) || 
                                       event.text.toLowerCase().includes(selectedMatch.home.toLowerCase());
                        const isAway = normText.includes(normAwayName) || 
                                       event.text.toLowerCase().includes(selectedMatch.away.toLowerCase());
                        const eventFlag = isHome ? home.flag : (isAway ? away.flag : null);

                        let icon = '🔔';
                        const typeLower = event.type.toLowerCase();
                        if (typeLower.includes('foul')) icon = '⚡';
                        else if (typeLower.includes('goal') || typeLower.includes('scorer') || typeLower.includes('score')) icon = '⚽';
                        else if (typeLower.includes('attempt') || typeLower.includes('shot')) icon = '🎯';
                        else if (typeLower.includes('corner')) icon = '🚩';
                        else if (typeLower.includes('offside')) icon = '👁️';
                        else if (typeLower.includes('kick off') || typeLower.includes('start') || typeLower.includes('toss')) icon = '🎬';
                        else if (typeLower.includes('yellow')) icon = '🟨';
                        else if (typeLower.includes('red')) icon = '🟥';
                        else if (typeLower.includes('sub')) icon = '🔄';

                        return (
                          <div 
                            key={`timeline-${idx}`} 
                            className="flex items-start gap-3 bg-slate-950/40 border border-slate-800/50 rounded-xl p-2.5 hover:border-slate-700/50 transition-all duration-300 relative"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[11px] shrink-0">
                              {icon}
                            </div>

                            <div className="flex-1 flex flex-col gap-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  {event.type}
                                </span>
                                <span className="text-[10px] font-bold font-mono text-brand-neon">
                                  {event.minuteStr}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300 font-bold leading-relaxed pr-6">
                                {event.text}
                              </p>
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
              )}

              {/* Match Statistics */}
              {hasStarted ? (
                <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Match Statistics
                  </h4>
                  
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Possession', key: 'possession', suffix: '%' },
                      { label: 'Shots', key: 'shots' },
                      { label: 'Shots on Target', key: 'shotsOnTarget' },
                      { label: 'Corners', key: 'corners' },
                      { label: 'Fouls', key: 'fouls' },
                      { label: 'Yellow Cards', key: 'yellowCards' },
                      { label: 'Red Cards', key: 'redCards' }
                    ].map(stat => {
                      const [valHome, valAway] = details.stats[stat.key];
                      const total = valHome + valAway || 1;
                      const pctHome = Math.round((valHome / total) * 100);
                      const pctAway = 100 - pctHome;

                      return (
                        <div key={stat.key} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-300 font-mono">
                            <span>{valHome}{stat.suffix || ''}</span>
                            <span className="text-slate-400 font-sans uppercase tracking-wider text-[8px] font-black">{stat.label}</span>
                            <span>{valAway}{stat.suffix || ''}</span>
                          </div>
                          {/* Bar display */}
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                            <div 
                              className="bg-brand-neon h-full transition-all duration-500" 
                              style={{ width: `${pctHome}%` }}
                            />
                            <div 
                              className="bg-brand-purple h-full transition-all duration-500" 
                              style={{ width: `${pctAway}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-800/80 pt-4 text-center flex flex-col gap-2">
                  <div className="text-xs font-bold text-slate-400">Match Preview</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed px-4">
                    This match has not started yet. Real-time stats and goal scorers will activate automatically when the match kicks off.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default App;
