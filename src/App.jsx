/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, MapPin, Calendar, TrendingUp, Award, Heart, Moon, Zap, Star } from 'lucide-react';
import { TEAMS, generateGroupMatches, KNOCKOUT_MATCHES } from './data/worldcupData';
import { calculateStandings, getAdvancedTeams, populateRoundOf32 } from './data/simulation';
import { 
  parseMatchKickoff, 
  isLiveMatch, 
  getMatchDetails, 
  WorldCupTrophyIcon,
  getAssistPlayer,
  TEAM_PLAYERS
} from './utils/matchHelpers';
import { MatchDetailsModal } from './components/MatchDetailsModal';
import { LiveMatchesBanner } from './components/LiveMatchesBanner';
import { ConfettiShower } from './components/ConfettiShower';
import { FixturesTab } from './components/tabs/FixturesTab';
import { GroupsTab } from './components/tabs/GroupsTab';
import { BracketTab } from './components/tabs/BracketTab';
import { StatsTab } from './components/tabs/StatsTab';
import { PlayerRatingsTab } from './components/tabs/PlayerRatingsTab';
import { VenuesTab } from './components/tabs/VenuesTab';
import defaultFotmobRatings from './data/fotmobPlayerRatings.json';

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('worldcup2026_activeTab') || 'fixtures'); // 'fixtures', 'groups', 'bracket', 'stats', 'venues'
  const [theme, setTheme] = useState(() => localStorage.getItem('worldcup2026_theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('worldcup2026_accent') || 'neon');

  useEffect(() => {
    const accents = {
      neon: { main: '#00FF87', shadow: 'rgba(0, 255, 135, 0.4)' },
      royal: { main: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.4)' },
      gold: { main: '#FBBF24', shadow: 'rgba(251, 191, 36, 0.4)' },
      purple: { main: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.4)' }
    };
    const choice = accents[accent] || accents.neon;
    document.documentElement.style.setProperty('--color-brand-neon', choice.main);
    document.documentElement.style.setProperty('--shadow-neon', `0 0 15px ${choice.shadow}`);
  }, [accent]);


  // Group Stage State
  const [groupMatches, setGroupMatches] = useState([]);
  
  // Bracket State
  const [bracket, setBracket] = useState(KNOCKOUT_MATCHES);
  
  // Group Standing Override State
  const [standingsOverrides, setStandingsOverrides] = useState({});
  
  // Scraper / Live polling states
  const [isLoaded, setIsLoaded] = useState(false);
  const [rawLiveMatches, setRawLiveMatches] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Goal tracking states
  const prevScoresRef = useRef({});
  const [goalAlert, setGoalAlert] = useState(null);
  const [activeGoalFlashMatchIds, setActiveGoalFlashMatchIds] = useState([]);

  // Compute aligned liveMatches from rawLiveMatches to ensure home/away teams are oriented correctly
  const liveMatches = useMemo(() => {
    if (!rawLiveMatches || Object.keys(rawLiveMatches).length === 0) return rawLiveMatches || {};

    const aligned = {};
    const allAppMatches = [];
    if (groupMatches) allAppMatches.push(...groupMatches);
    if (bracket) {
      Object.values(bracket).forEach(roundMatches => {
        if (Array.isArray(roundMatches)) {
          allAppMatches.push(...roundMatches);
        }
      });
    }

    for (const [matchId, match] of Object.entries(rawLiveMatches)) {
      const appMatch = allAppMatches.find(m => String(m.id) === matchId);
      if (appMatch && appMatch.home && appMatch.away && match.home && match.away &&
          match.home === appMatch.away && match.away === appMatch.home) {
        
        const alignedMatch = {
          ...match,
          homeScore: match.awayScore,
          awayScore: match.homeScore,
          home: match.away,
          away: match.home
        };

        if (match.stats) {
          alignedMatch.stats = {};
          Object.keys(match.stats).forEach(k => {
            const val = match.stats[k];
            if (Array.isArray(val) && val.length === 2) {
              alignedMatch.stats[k] = [val[1], val[0]];
            } else {
              alignedMatch.stats[k] = val;
            }
          });
        }

        if (match.events) {
          alignedMatch.events = match.events.map(ev => ({
            ...ev,
            team: ev.team === 'home' ? 'away' : 'home'
          }));
        }

        if (match.winner === 'home') {
          alignedMatch.winner = 'away';
        } else if (match.winner === 'away') {
          alignedMatch.winner = 'home';
        }

        aligned[matchId] = alignedMatch;
      } else {
        aligned[matchId] = match;
      }
    }

    return aligned;
  }, [rawLiveMatches, groupMatches, bracket]);

  // --- Live Goal Detection Effect ---
  useEffect(() => {
    if (!liveMatches || Object.keys(liveMatches).length === 0) {
      return;
    }

    const currentMatches = { ...liveMatches };
    const prevMatches = prevScoresRef.current;
    const hasPreviousData = Object.keys(prevMatches).length > 0;

    for (const [matchId, match] of Object.entries(currentMatches)) {
      const prev = prevMatches[matchId];
      if (prev && hasPreviousData) {
        const homeDiff = (match.homeScore ?? 0) - (prev.homeScore ?? 0);
        const awayDiff = (match.awayScore ?? 0) - (prev.awayScore ?? 0);

        if (homeDiff > 0 || awayDiff > 0) {
          const isHome = homeDiff > 0;
          const homeTeamInfo = TEAMS[match.home] || { name: match.home || 'TBD', flag: '🏳️' };
          const awayTeamInfo = TEAMS[match.away] || { name: match.away || 'TBD', flag: '🏳️' };
          const scoringTeamInfo = isHome ? homeTeamInfo : awayTeamInfo;

          let scorerName = null;
          let goalMinute = match.minute || '90';
          
          if (match.events && Array.isArray(match.events)) {
            const teamSide = isHome ? 'home' : 'away';
            const teamGoals = match.events.filter(e => e.team === teamSide);
            if (teamGoals.length > 0) {
              const lastGoal = teamGoals[teamGoals.length - 1];
              scorerName = lastGoal.player;
              goalMinute = lastGoal.minute;
            }
          }

          // Trigger Alert state
          setGoalAlert({
            matchId,
            homeName: homeTeamInfo.name,
            homeFlag: homeTeamInfo.flag,
            awayName: awayTeamInfo.name,
            awayFlag: awayTeamInfo.flag,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            scoringTeamName: scoringTeamInfo.name,
            scoringTeamFlag: scoringTeamInfo.flag,
            player: scorerName,
            minute: goalMinute
          });

          // Trigger card glow flash
          setActiveGoalFlashMatchIds(prevIds => [...prevIds, matchId]);
          
          // Clear flash after 8s
          setTimeout(() => {
            setActiveGoalFlashMatchIds(prevIds => prevIds.filter(id => id !== matchId));
          }, 8000);

          // Clear alert toast after 6s
          setTimeout(() => {
            setGoalAlert(current => {
              if (current && current.matchId === matchId) {
                return null;
              }
              return current;
            });
          }, 6000);
        }
      }
    }

    // Save current scores to Ref for next comparison
    const scoresToSave = {};
    for (const [id, m] of Object.entries(currentMatches)) {
      scoresToSave[id] = {
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0
      };
    }
    prevScoresRef.current = scoresToSave;
  }, [liveMatches]);

  // Highlights polling states
  const [highlightsMap, setHighlightsMap] = useState({});
  const [loadingHighlightsMap, setLoadingHighlightsMap] = useState({});
  const [fotmobRatings, setFotmobRatings] = useState(defaultFotmobRatings || []);
  const [livePlayerRatings, setLivePlayerRatings] = useState({});

  // --- Live Data Polling Effect ---
  useEffect(() => {
    // Only poll when not on the 'bracket' tab (Roadmap Tree) to prevent losing user updates
    if (activeTab === 'bracket') return;

    const fetchLiveScores = () => {
      fetch('/live-matches.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && typeof data === 'object') {
            setRawLiveMatches(data);
          }
        })
        .catch(err => console.warn('[Live Polling] Ignored failure during live updates fetch:', err));
    };

    fetchLiveScores();

    // Poll endpoint every 15 seconds (15000ms)
    const timer = setInterval(fetchLiveScores, 15000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // --- Ratings Polling Effect ---
  useEffect(() => {
    const fetchRatings = () => {
      fetch('/fotmobPlayerRatings.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setFotmobRatings(data);
          }
        })
        .catch(err => console.warn('[Ratings Polling] Ignored failure during ratings fetch:', err));

      fetch('/live-player-ratings.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && typeof data === 'object') {
            setLivePlayerRatings(data);
          }
        })
        .catch(err => console.warn('[Live Ratings Polling] Ignored failure during live ratings fetch:', err));
    };

    fetchRatings();
    const timer = setInterval(fetchRatings, 30000); // refresh ratings every 30s
    return () => clearInterval(timer);
  }, []);

  // --- Auto-complete finished matches in both groupMatches and bracket states ---
  useEffect(() => {
    if (Object.keys(liveMatches).length === 0) return;

    // Always keep group match scores up-to-date
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

    // Do NOT touch the bracket while the user is actively editing it on the Roadmap tab
    if (activeTab === 'bracket') return;

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
  }, [liveMatches, activeTab]);

  // --- Initialize Group Stage & Load Predictions ---
  useEffect(() => {
    const savedMatches = localStorage.getItem('worldcup2026_groupMatches');
    const savedBracket = localStorage.getItem('worldcup2026_bracket');
    const savedOverrides = localStorage.getItem('worldcup2026_standingsOverrides');

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
    localStorage.setItem('worldcup2026_standingsOverrides', JSON.stringify(standingsOverrides));
  }, [groupMatches, bracket, standingsOverrides, isLoaded]);

  // --- Theme synchronization effect ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'pitch-black');
    if (theme === 'pitch-black') {
      root.classList.add('dark', 'pitch-black');
    } else {
      root.classList.add('dark');
    }
    localStorage.setItem('worldcup2026_theme', theme);
  }, [theme]);

  // --- Active Tab synchronization effect ---
  useEffect(() => {
    localStorage.setItem('worldcup2026_activeTab', activeTab);
  }, [activeTab]);

  // --- Calculate Standings & Populate R32 ---
  const standings = useMemo(() => {
    if (groupMatches.length === 0) return {};
    const calculated = calculateStandings(TEAMS, groupMatches.filter(m => m.isCompleted));
    
    const finalStandings = {};
    Object.keys(calculated).forEach(groupKey => {
      if (standingsOverrides[groupKey]) {
        const order = standingsOverrides[groupKey];
        const groupTeamsStats = order.map(code => 
          calculated[groupKey].find(t => t.code === code)
        ).filter(Boolean);
        
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

  // Sync group standings changes into the R32 Bracket ONLY if the R32 qualified teams differ
  useEffect(() => {
    if (!isLoaded || Object.keys(standings).length === 0) return;
    if (activeTab === 'bracket') return;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedTeams, isLoaded, liveMatches, bracket, activeTab]);

  // --- Predict winner for a knockout match (advances team to next round) ---
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

  // --- Memoized calculations for matches, ticker, stats ---
  const activeLiveMatchesList = useMemo(() => {
    const list = [];
    Object.entries(liveMatches).forEach(([idStr, live]) => {
      const matchId = Number(idStr);
      if (live && !live.isCompleted && live.minute !== 'FT' && live.minute !== null && live.minute !== undefined && live.minute !== '') {
        let match = groupMatches.find(m => m.id === matchId);
        let roundName = 'Group Stage';
        if (match) {
          roundName = `Group ${match.group}`;
        } else {
          Object.keys(bracket).forEach(roundKey => {
            const found = bracket[roundKey].find(m => m.id === matchId);
            if (found) {
              match = found;
              if (roundKey === 'r32') roundName = 'Round of 32';
              else if (roundKey === 'r16') roundName = 'Round of 16';
              else if (roundKey === 'qf') roundName = 'Quarter-Final';
              else if (roundKey === 'sf') roundName = 'Semi-Final';
              else if (roundKey === 'final') roundName = 'Grand Final';
            }
          });
        }
        
        if (match) {
          list.push({
            id: matchId,
            home: match.home,
            away: match.away,
            round: roundName,
            homeScore: live.homeScore !== null ? live.homeScore : 0,
            awayScore: live.awayScore !== null ? live.awayScore : 0,
            minute: live.minute,
            originalMatch: match
          });
        }
      }
    });
    return list;
  }, [liveMatches, groupMatches, bracket]);

  const hasLiveMatches = useMemo(() => {
    return activeLiveMatchesList.length > 0;
  }, [activeLiveMatchesList]);

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
      .reverse();
  }, [sortedMatches]);

  const upcomingFixtures = useMemo(() => {
    const allMatches = [];
    groupMatches.forEach(m => {
      allMatches.push({ ...m, stage: 'group' });
    });
    Object.keys(bracket).forEach(roundKey => {
      bracket[roundKey].forEach(m => {
        if (m.home && m.away) {
          allMatches.push({ ...m, stage: 'knockout' });
        }
      });
    });

    const activeMatches = allMatches.filter(m => {
      const live = liveMatches[m.id];
      const isLive = live && live.minute !== 'FT' && !live.isCompleted && live.minute !== null && live.minute !== undefined && live.minute !== '';
      if (isLive) return false;
      return !m.isCompleted;
    });

    return activeMatches
      .sort((a, b) => {
        const dateA = parseMatchKickoff(a);
        const dateB = parseMatchKickoff(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 16);
  }, [groupMatches, bracket, liveMatches]);

  const playerStats = useMemo(() => {
    const goalsCount = {};
    const assistsCount = {};
    const playerTeams = {};
    const playerRatingsTracker = {};

    const baseRatings = {
      "Lionel Messi": 8.4,
      "Erling Haaland": 8.3,
      "Kylian Mbappé": 8.3,
      "Harry Kane": 8.2,
      "Luis Díaz": 8.1,
      "Jude Bellingham": 8.1,
      "Vinícius Júnior": 8.1,
      "Kevin De Bruyne": 8.1,
      "Mohamed Salah": 8.1,
      "Lamine Yamal": 8.0,
      "Florian Wirtz": 8.0,
      "Jamal Musiala": 8.0,
      "Martin Ødegaard": 8.0,
      "Cristiano Ronaldo": 7.9,
      "Bruno Fernandes": 7.9,
      "Nico Williams": 7.9,
      "Bukayo Saka": 7.9,
      "Phil Foden": 7.9,
      "Darwin Núñez": 7.8,
      "Federico Valverde": 7.8,
      "Son Heung-min": 7.8,
      "Alphonso Davies": 7.8,
      "Alexander Isak": 7.8,
      "Cody Gakpo": 7.8,
      "Memphis Depay": 7.7,
      "Antoine Griezmann": 7.7,
      "Luka Modrić": 7.7,
      "James Rodríguez": 7.7,
      "Christian Pulisic": 7.6,
      "Scott McTominay": 7.6,
      "Victor Gyökeres": 7.6,
      "Lautaro Martínez": 7.6,
      "Julián Álvarez": 7.6,
      "Youssef En-Nesyri": 7.5,
      "Achraf Hakimi": 7.5,
      "Hakan Çalhanoğlu": 7.5,
      "Arda Güler": 7.5,
      "Romelu Lukaku": 7.5,
      "Jérémy Doku": 7.5,
      "Percy Tau": 7.4,
      "Santiago Giménez": 7.4,
      "Patrik Schick": 7.4,
      "Edin Džeko": 7.4,
      "Kaoru Mitoma": 7.4,
      "Takefusa Kubo": 7.4,
      "Sadio Mané": 7.4,
      "Nicolas Jackson": 7.4,
      "Marcel Sabitzer": 7.4,
      "Alexis Mac Allister": 7.4,
      "Lyle Foster": 7.3,
      "Lee Kang-in": 7.3,
      "Hwang Hee-chan": 7.3,
      "Tomáš Souček": 7.3,
      "Granit Xhaka": 7.3,
      "Manuel Akanji": 7.3,
      "Miguel Almirón": 7.3,
      "Julio Enciso": 7.3,
      "Weston McKennie": 7.2,
      "Folarin Balogun": 7.2,
      "Kenan Yıldız": 7.2,
      "Moisés Caicedo": 7.2,
      "Xavi Simons": 7.2,
      "Virgil van Dijk": 7.2,
      "Takumi Minamino": 7.2,
      "Mateo Kovačić": 7.2,
      "Mohammed Kudus": 7.2,
      "Yoane Wissa": 7.2,
    };

    const processMatch = (m, live) => {
      const details = getMatchDetails(m, live);
      if (!details.hasStarted) return;

      const homeCode = m.home;
      const awayCode = m.away;
      if (!homeCode || !awayCode) return;

      const homeScore = live ? live.homeScore : (m.homeScore ?? 0);
      const awayScore = live ? live.awayScore : (m.awayScore ?? 0);

      // Process scorers & assists
      const matchScorers = details.scorers || [];
      const scorersPerPlayer = {};
      const assistsPerPlayer = {};

      matchScorers.forEach(s => {
        const isOG = s.player.includes('(OG)') || s.player.includes('ownGoal') || s.player.includes('OG');
        if (isOG) return;

        const cleanPlayerName = s.player.replace(/\s*\(P\)/, '').trim();
        const teamCode = s.team === 'home' ? homeCode : awayCode;
        if (!teamCode) return;

        playerTeams[cleanPlayerName] = teamCode;
        goalsCount[cleanPlayerName] = (goalsCount[cleanPlayerName] || 0) + 1;
        scorersPerPlayer[cleanPlayerName] = (scorersPerPlayer[cleanPlayerName] || 0) + 1;

        // Determine assist player
        const assistPlayerName = getAssistPlayer(m.id, cleanPlayerName, teamCode, s.minute);
        if (assistPlayerName) {
          playerTeams[assistPlayerName] = teamCode;
          assistsCount[assistPlayerName] = (assistsCount[assistPlayerName] || 0) + 1;
          assistsPerPlayer[assistPlayerName] = (assistsPerPlayer[assistPlayerName] || 0) + 1;
        }
      });

      // Process player match ratings for star players of both teams
      const homePlayers = TEAM_PLAYERS[homeCode] || [];
      const awayPlayers = TEAM_PLAYERS[awayCode] || [];

      const processPlayerRating = (playerName, teamCode, isHome) => {
        playerTeams[playerName] = teamCode;
        
        // Base rating
        const base = baseRatings[playerName] || 6.8;

        // Adjustments
        let scoreBonus = 0;
        const playerGoals = scorersPerPlayer[playerName] || 0;
        const playerAssists = assistsPerPlayer[playerName] || 0;

        scoreBonus += playerGoals * 1.0;
        scoreBonus += playerAssists * 0.6;

        // Team result bonus
        let resultBonus;
        if (homeScore === awayScore) {
          resultBonus = 0.1;
        } else {
          const isWinner = isHome ? (homeScore > awayScore) : (awayScore > homeScore);
          resultBonus = isWinner ? 0.4 : -0.3;
        }

        // Noise
        const rand = (s) => {
          const x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        const seed = m.id * 7 + playerName.charCodeAt(0);
        const noise = rand(seed) * 0.6 - 0.3; // -0.3 to +0.3

        let matchRating = base + scoreBonus + resultBonus + noise;
        matchRating = Math.max(3.0, Math.min(10.0, matchRating));

        // Track overall rating
        if (!playerRatingsTracker[playerName]) {
          playerRatingsTracker[playerName] = { totalRating: 0, matchesPlayed: 0 };
        }
        playerRatingsTracker[playerName].totalRating += matchRating;
        playerRatingsTracker[playerName].matchesPlayed += 1;
      };

      homePlayers.forEach(p => processPlayerRating(p, homeCode, true));
      awayPlayers.forEach(p => processPlayerRating(p, awayCode, false));
    };

    groupMatches.forEach(m => {
      const live = liveMatches[m.id];
      processMatch(m, live);
    });

    Object.keys(bracket).forEach(roundKey => {
      bracket[roundKey].forEach(m => {
        const live = liveMatches[m.id];
        processMatch(m, live);
      });
    });

    const topScorers = Object.entries(goalsCount)
      .map(([name, goals]) => ({ name, goals, team: playerTeams[name] }))
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 10);

    const topAssists = Object.entries(assistsCount)
      .map(([name, assists]) => ({ name, assists, team: playerTeams[name] }))
      .sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name))
      .slice(0, 10);

    const topRatings = fotmobRatings.slice(0, 10);

    return { topScorers, topAssists, topRatings };
  }, [groupMatches, bracket, liveMatches, fotmobRatings]);

  const tournamentChampion = useMemo(() => {
    const finalMatch = bracket.final[0];
    if (finalMatch && finalMatch.winner) {
      return TEAMS[finalMatch.winner];
    }
    return null;
  }, [bracket]);

  // Fetch YouTube highlights for all completed matches
  useEffect(() => {
    const pending = feedMatches.filter(
      m => !highlightsMap[m.id] && !loadingHighlightsMap[m.id]
    );
    if (pending.length === 0) return;

    setLoadingHighlightsMap(prev => {
      const next = { ...prev };
      pending.forEach(m => { next[m.id] = true; });
      return next;
    });

    pending.forEach(match => {
      const homeName = TEAMS[match.home]?.name || match.home;
      const awayName = TEAMS[match.away]?.name || match.away;
      const homeCode = match.home;
      const awayCode = match.away;

      fetch(`/api/match-highlights?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&homeCode=${encodeURIComponent(homeCode)}&awayCode=${encodeURIComponent(awayCode)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.url) {
            setHighlightsMap(prev => ({ ...prev, [match.id]: data.url }));
          }
        })
        .catch(err => console.warn(`[Highlights Fetch] Failed for match ${match.id}:`, err))
        .finally(() => {
          setLoadingHighlightsMap(prev => ({ ...prev, [match.id]: false }));
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMatches]);

  return (
    <div className={`min-h-screen ${theme === 'pitch-black' ? 'bg-black' : 'bg-brand-darkBg'} text-slate-100 font-sans antialiased transition-colors duration-300 dot-grid-bg`}>
      {/* Confetti Shower for Goal Alerts */}
      {goalAlert && <ConfettiShower />}

      {/* Goal Alert Toast Banner */}
      {goalAlert && (
        <div 
          onClick={() => setGoalAlert(null)}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-sm bg-slate-950/95 border-2 border-brand-neon rounded-2xl p-4 shadow-[0_0_30px_rgba(0,255,135,0.4)] backdrop-blur-md cursor-pointer animate-goalAlert"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-900/60 mb-2">
            <span className="text-[10px] font-black tracking-widest text-brand-neon flex items-center gap-1.5 uppercase animate-pulse">
              ⚽ GOAL ALERT!
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Match {goalAlert.matchId}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex items-center gap-2 font-black text-slate-100 text-xs flex-1 min-w-0">
              <span className="text-xl shrink-0">{goalAlert.homeFlag}</span>
              <span className="truncate">{goalAlert.homeName}</span>
            </div>
            
            <div className="px-3 py-0.5 bg-slate-900 border border-brand-neon/30 text-brand-neon rounded-lg font-mono font-black text-xs shadow-[0_0_10px_rgba(0,255,135,0.1)] shrink-0 min-w-[50px] text-center">
              {goalAlert.homeScore} : {goalAlert.awayScore}
            </div>
            
            <div className="flex items-center gap-2 font-black text-slate-100 text-xs justify-end flex-1 min-w-0 text-right">
              <span className="truncate">{goalAlert.awayName}</span>
              <span className="text-xl shrink-0">{goalAlert.awayFlag}</span>
            </div>
          </div>
          
          {goalAlert.player && (
            <div className="text-[9px] text-brand-neon font-black mt-2 text-center uppercase tracking-wider bg-brand-neon/10 py-1 rounded-lg border border-brand-neon/20">
              ⚽ {goalAlert.player} ({goalAlert.minute}')
            </div>
          )}
        </div>
      )}
      {/* Background glow effects for visual wow-factor */}
      {theme !== 'pitch-black' && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 right-10 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-brand-neon/10 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-royal/10 rounded-full blur-3xl opacity-30"></div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="bg-brand-gold/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-brand-gold/40 glow-gold animate-float shrink-0">
              <WorldCupTrophyIcon className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-brand-gold" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-widest bg-gradient-to-r from-white via-slate-200 to-brand-neon bg-clip-text text-transparent whitespace-nowrap uppercase">
                WORLD CUP 2026
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/60 px-3.5 py-1.5 rounded-full border border-slate-800/60 text-xs font-semibold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-neon"></span>
              </span>
              <span className="text-slate-300">World Cup Live in USA, CAN & MEX</span>
            </div>

            {/* Color Accent Picker */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/60 p-1 sm:px-2.5 sm:py-1.5 rounded-full border border-slate-800/60 select-none">
              {[
                { id: 'neon', color: '#00FF87', label: 'Green' },
                { id: 'royal', color: '#3B82F6', label: 'Blue' },
                { id: 'gold', color: '#FBBF24', label: 'Gold' },
                { id: 'purple', color: '#8B5CF6', label: 'Purple' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    localStorage.setItem('worldcup2026_accent', opt.id);
                    setAccent(opt.id);
                  }}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                    accent === opt.id 
                      ? 'scale-125 ring-2 ring-white/50 border-white shadow-lg' 
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={`Use ${opt.label} Accent`}
                />
              ))}
            </div>

            {/* Theme Selector Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'pitch-black' : 'dark')}
              className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                theme === 'pitch-black'
                  ? 'bg-zinc-900 border-zinc-800 text-brand-neon hover:bg-zinc-850'
                  : 'bg-slate-900/60 border-slate-800/60 text-slate-350 hover:bg-slate-800/85 hover:text-white'
              }`}
              title={theme === 'pitch-black' ? 'Switch to Dark Stadium Theme' : 'Switch to Pitch Black Theme'}
            >
              {theme === 'pitch-black' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-brand-neon fill-brand-neon animate-pulse shrink-0" />
                  <span className="hidden sm:inline font-black uppercase tracking-wider text-[10px]">Pitch Black</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline font-bold text-[10px]">Dark Stadium</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN TABS NAV --- */}
      <nav className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 pt-4 sm:pt-6">
        <div className="flex gap-2 p-1 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/40 w-full overflow-x-auto scrollbar-none sm:w-fit whitespace-nowrap">
          {[
            { id: 'fixtures', label: 'Upcoming & Results', icon: Calendar },
            { id: 'groups', label: 'Group Standings', icon: Users },
            { id: 'bracket', label: 'Roadmap Simulation', icon: TrendingUp },
            { id: 'stats', label: 'Player Stats', icon: Award },
            { id: 'ratings', label: 'Player Ratings', icon: Star },
            { id: 'venues', label: 'Stadium Venues', icon: MapPin },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                  isActive 
                    ? 'bg-brand-neon text-slate-950 shadow-neon font-black' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- CONTENT CONTAINER --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Global Live Tracker Banner */}
        {activeTab !== 'fixtures' && (
          <LiveMatchesBanner 
            hasLiveMatches={hasLiveMatches}
            activeLiveMatchesList={activeLiveMatchesList}
            setSelectedMatch={setSelectedMatch}
            activeGoalFlashMatchIds={activeGoalFlashMatchIds}
          />
        )}
        
        {/* --- TABS --- */}
        {activeTab === 'fixtures' && (
          <FixturesTab 
            hasLiveMatches={hasLiveMatches}
            activeLiveMatchesList={activeLiveMatchesList}
            upcomingFixtures={upcomingFixtures}
            feedMatches={feedMatches}
            liveMatches={liveMatches}
            highlightsMap={highlightsMap}
            loadingHighlightsMap={loadingHighlightsMap}
            isLiveMatch={isLiveMatch}
            setSelectedMatch={setSelectedMatch}
            activeGoalFlashMatchIds={activeGoalFlashMatchIds}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsTab 
            groupMatches={groupMatches}
            standings={standings}
            advancedTeams={advancedTeams}
            liveMatches={liveMatches}
            isLiveMatch={isLiveMatch}
            setSelectedMatch={setSelectedMatch}
          />
        )}

        {activeTab === 'bracket' && (
          <BracketTab 
            bracket={bracket}
            standings={standings}
            advancedTeams={advancedTeams}
            tournamentChampion={tournamentChampion}
            handleKnockoutWinner={handleKnockoutWinner}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab 
            playerStats={playerStats}
          />
        )}

        {activeTab === 'ratings' && (
          <PlayerRatingsTab 
            fotmobRatings={fotmobRatings}
          />
        )}

        {activeTab === 'venues' && (
          <VenuesTab 
            groupMatches={groupMatches}
            bracket={bracket}
            liveMatches={liveMatches}
            isLiveMatch={isLiveMatch}
          />
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/50 py-8 mt-12 text-center text-xs text-slate-500 font-bold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-1.5">
            <WorldCupTrophyIcon className="w-4 h-4 text-brand-neon" />
            <span>WORLD CUP 2026 Interactive Roadmap</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by Sarath for football fans worldwide</span>
          </div>
          <p>© 2026 FIFA World Cup Bracket Predictor. All rights reserved.</p>
        </div>
      </footer>

      {selectedMatch && (
        <MatchDetailsModal 
          selectedMatch={selectedMatch}
          liveMatches={liveMatches}
          fotmobRatings={fotmobRatings}
          livePlayerRatings={livePlayerRatings}
          groupMatches={groupMatches}
          standings={standings}
          bracket={bracket}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

export default App;
