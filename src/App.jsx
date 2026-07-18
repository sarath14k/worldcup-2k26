/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Users, MapPin, Calendar, TrendingUp, Award, Heart, Moon, Zap, Star, Activity } from 'lucide-react';
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
import { NextMatchCountdown } from './components/NextMatchCountdown';
import { PlayerAvatar } from './components/PlayerAvatar';
import { FixturesTab } from './components/tabs/FixturesTab';
import { GroupsTab } from './components/tabs/GroupsTab';
import { BracketTab } from './components/tabs/BracketTab';
import { StatsTab } from './components/tabs/StatsTab';
import { PlayerRatingsTab } from './components/tabs/PlayerRatingsTab';
import { VenuesTab } from './components/tabs/VenuesTab';
import SystemTab from './components/tabs/SystemTab';
import defaultFotmobRatings from './data/fotmobPlayerRatings.json';

function propagateLoserToBronze(match, bracketCopy) {
  if (!match.loserNextId || !match.loserPosition || !match.winner) return;
  if (!match.home || !match.away) return;
  let loserCode;
  if (match.winner === 'home' || match.winner === 'away') {
    loserCode = match.winner === 'home' ? match.away : match.home;
  } else if (match.winner === match.home) {
    loserCode = match.away;
  } else if (match.winner === match.away) {
    loserCode = match.home;
  } else {
    loserCode = null;
  }
  if (!loserCode) return;
  let loserMatch = null;
  for (const [, ms] of Object.entries(bracketCopy)) {
    loserMatch = ms.find(nm => nm.id === match.loserNextId);
    if (loserMatch) break;
  }
  if (!loserMatch) return;
  if (match.loserPosition === 'top' || match.loserPosition === 'home') {
    loserMatch.home = loserCode;
  } else {
    loserMatch.away = loserCode;
  }
}

const BASE_RATINGS = {
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

const ACCENTS = {
  neon: { main: '#00FF87', shadow: 'rgba(0, 255, 135, 0.4)', label: 'Neon' },
  royal: { main: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.4)', label: 'Royal' },
  gold: { main: '#FBBF24', shadow: 'rgba(251, 191, 36, 0.4)', label: 'Gold' },
  purple: { main: '#A855F7', shadow: 'rgba(168, 85, 247, 0.4)', label: 'Purple' },
  ruby: { main: '#EF4444', shadow: 'rgba(239, 68, 68, 0.4)', label: 'Ruby' },
  rose: { main: '#F43F5E', shadow: 'rgba(244, 63, 94, 0.4)', label: 'Rose' },
  coral: { main: '#FF6B6B', shadow: 'rgba(255, 107, 107, 0.4)', label: 'Coral' },
  orange: { main: '#FB923C', shadow: 'rgba(251, 146, 60, 0.4)', label: 'Orange' },
  amber: { main: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.4)', label: 'Amber' },
  lime: { main: '#84CC16', shadow: 'rgba(132, 204, 22, 0.4)', label: 'Lime' },
  teal: { main: '#14B8A6', shadow: 'rgba(20, 184, 166, 0.4)', label: 'Teal' },
  cyan: { main: '#06B6D4', shadow: 'rgba(6, 182, 212, 0.4)', label: 'Cyan' },
  sky: { main: '#0EA5E9', shadow: 'rgba(14, 165, 233, 0.4)', label: 'Sky' },
  indigo: { main: '#6366F1', shadow: 'rgba(99, 102, 241, 0.4)', label: 'Indigo' },
  violet: { main: '#7C3AED', shadow: 'rgba(124, 58, 237, 0.4)', label: 'Violet' },
  pink: { main: '#EC4899', shadow: 'rgba(236, 72, 153, 0.4)', label: 'Pink' },
  emerald: { main: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)', label: 'Emerald' },
  ice: { main: '#67E8F9', shadow: 'rgba(103, 232, 249, 0.4)', label: 'Ice' }
};

function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('worldcup2026_activeTab') || 'fixtures'); // 'fixtures', 'groups', 'bracket', 'stats', 'venues'
  const [theme, setTheme] = useState(() => localStorage.getItem('worldcup2026_theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('worldcup2026_accent') || 'neon');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [showAccentPicker, setShowAccentPicker] = useState(false);

  useEffect(() => {
    const choice = ACCENTS[accent] || ACCENTS.neon;
    document.documentElement.style.setProperty('--color-brand-neon', choice.main);
    document.documentElement.style.setProperty('--shadow-neon', `0 0 15px ${choice.shadow}`);
  }, [accent]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTabSwitch = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
    localStorage.setItem('worldcup2026_activeTab', tabId);
  };

  // Group Stage State
  const [groupMatches, setGroupMatches] = useState([]);
  
  // Bracket State (lazy-init from server-injected data, then localStorage, then KNOCKOUT_MATCHES)
  const [bracket, setBracket] = useState(() => {
    // 1. Server-injected live data (fastest, no fetch needed)
    const initData = typeof window !== 'undefined' ? window.__INITIAL_BRACKET_DATA__ : null;
    if (initData && Object.keys(initData).length > 0) {
      const bracketCopy = JSON.parse(JSON.stringify(KNOCKOUT_MATCHES));
      Object.keys(bracketCopy).forEach(roundKey => {
        bracketCopy[roundKey] = bracketCopy[roundKey].map(m => {
          const live = initData[m.id];
          if (live && live.home && live.away) {
            return { ...m, ...live };
          }
          return m;
        });
      });
      // propagate winners
      for (const [, matches] of Object.entries(bracketCopy)) {
        for (const m of matches) {
          if (m.isCompleted && m.winner && m.nextId) {
            const winnerCode = m.winner === 'home' ? m.home : m.winner === 'away' ? m.away : null;
            if (winnerCode) {
              const nextRoundCode = m.nextId.split('_')[0];
              const nextMatch = bracketCopy[nextRoundCode]?.find(nm => nm.id === m.nextId);
              if (nextMatch) {
                if (m.position === 'top' || m.position === 'home') nextMatch.home = winnerCode;
                else nextMatch.away = winnerCode;
              }
            }
          }
        }
      }
      // propagate losers to bronze final
      for (const [, matches] of Object.entries(bracketCopy)) {
        for (const m of matches) propagateLoserToBronze(m, bracketCopy);
      }
      try { localStorage.setItem('worldcup2026_bracket', JSON.stringify(bracketCopy)); } catch {}
      return bracketCopy;
    }
    // 2. localStorage
    try {
      const saved = localStorage.getItem('worldcup2026_bracket');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(KNOCKOUT_MATCHES).forEach(roundKey => {
          if (parsed[roundKey]) {
            parsed[roundKey] = parsed[roundKey].map((m, i) => {
              const fresh = KNOCKOUT_MATCHES[roundKey][i];
              if (fresh) {
                const cleaned = { ...m, title: fresh.title, date: fresh.date };
                if (!TEAMS[cleaned.home]) cleaned.home = fresh.home;
                if (!TEAMS[cleaned.away]) cleaned.away = fresh.away;
                return cleaned;
              }
              return m;
            });
          }
        });
        return parsed;
      }
    } catch {}
    return KNOCKOUT_MATCHES;
  });
  
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
  }, [rawLiveMatches, groupMatches]);

  // --- Memoized calculations for matches, ticker, stats ---
  const activeLiveMatchesList = useMemo(() => {
    const list = [];
    Object.entries(liveMatches).forEach(([idStr, live]) => {
      if (live && !live.isCompleted && live.minute !== 'FT' && live.minute !== null && live.minute !== undefined && live.minute !== '') {
        const numId = Number(idStr);
        let match = groupMatches.find(m => m.id === numId);
        let roundName = 'Group Stage';
        if (match) {
          roundName = `Group ${match.group}`;
        } else {
          Object.keys(bracket).forEach(roundKey => {
            const found = bracket[roundKey].find(m => String(m.id) === idStr);
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
            id: idStr,
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

  // --- Live Goal Detection Effect ---
  const goalTimersRef = useRef([]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      goalTimersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    // Clear stale timers from previous effect run
    goalTimersRef.current.forEach(t => clearTimeout(t));
    goalTimersRef.current = [];

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

          // Find the corresponding appMatch
          const allAppMatches = [];
          if (groupMatches) allAppMatches.push(...groupMatches);
          if (bracket) {
            Object.values(bracket).forEach(roundMatches => {
              if (Array.isArray(roundMatches)) {
                allAppMatches.push(...roundMatches);
              }
            });
          }
          const appMatch = allAppMatches.find(m => String(m.id) === matchId);
          
          const isGroup = appMatch?.type === 'group';
          const matchLabel = isGroup
            ? `Group ${appMatch.group} • Match ${(appMatch.id && !isNaN(appMatch.id) ? ((appMatch.id - 1) % 6) + 1 : appMatch.id)}`
            : appMatch 
              ? (appMatch.title || `${appMatch.round || 'Knockout'} • Match ${appMatch.id}`)
              : `Match ${matchId}`;

          // Play goal alert sound
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          } catch {
            // Audio not available
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
            minute: goalMinute,
            matchLabel
          });

          // Trigger card glow flash
          setActiveGoalFlashMatchIds(prevIds => [...prevIds, matchId]);
          
          // Clear flash after 8s (tracked for cleanup)
          const flashTimer = setTimeout(() => {
            setActiveGoalFlashMatchIds(prevIds => prevIds.filter(id => id !== matchId));
            goalTimersRef.current = goalTimersRef.current.filter(t => t !== flashTimer);
          }, 8000);
          goalTimersRef.current.push(flashTimer);

          // Clear alert toast after 6s (tracked for cleanup)
          const alertTimer = setTimeout(() => {
            setGoalAlert(current => {
              if (current && current.matchId === matchId) {
                return null;
              }
              return current;
            });
            goalTimersRef.current = goalTimersRef.current.filter(t => t !== alertTimer);
          }, 6000);
          goalTimersRef.current.push(alertTimer);
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
  }, [liveMatches, groupMatches, bracket]);

  // Highlights polling states
  const [highlightsMap, setHighlightsMap] = useState({});

  // Bulk-load all cached highlights + fallback for uncached matches
  useEffect(() => {
    const allMatches = [...groupMatches];
    Object.values(bracket).forEach(round => {
      if (Array.isArray(round)) allMatches.push(...round);
    });
    if (allMatches.length === 0) return;

    fetch('/api/all-highlights')
      .then(res => res.json())
      .then(cache => {
        const mapping = {};
        Object.entries(cache).forEach(([key, entry]) => {
          if (entry.url) {
            mapping[key] = entry;
          }
        });
        const idMapping = {};
        const missing = [];
        allMatches.forEach(m => {
          if (m.home && m.away) {
            const key = `${m.home.toLowerCase()}_vs_${m.away.toLowerCase()}`;
            if (mapping[key]) {
              idMapping[m.id] = mapping[key];
            } else {
              missing.push(m);
            }
          }
        });
        setHighlightsMap(idMapping);

        // Fallback: fetch uncached matches individually via the old match-highlights API
        missing.forEach(m => {
          const homeName = TEAMS[m.home]?.name || m.home;
          const awayName = TEAMS[m.away]?.name || m.away;
          fetch(`/api/match-highlights?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&homeCode=${encodeURIComponent(m.home)}&awayCode=${encodeURIComponent(m.away)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.url) {
                setHighlightsMap(prev => ({ ...prev, [m.id]: data }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(err => console.warn('[Highlights] Bulk load failed:', err));
  }, [groupMatches, bracket]);

  const [fotmobRatings, setFotmobRatings] = useState(defaultFotmobRatings || []);
  const [livePlayerRatings, setLivePlayerRatings] = useState({});

  const dbg = import.meta.env.DEV;

  const handleFetchHighlight = useCallback(async (match) => {
    if (!match.home || !match.away) return false;
    const homeName = TEAMS[match.home]?.name || match.home;
    const awayName = TEAMS[match.away]?.name || match.away;
    try {
      const url = `/api/match-highlights?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&homeCode=${encodeURIComponent(match.home)}&awayCode=${encodeURIComponent(match.away)}`;
      if (dbg) console.log('[Highlight] fetching', match.home, 'vs', match.away, 'id:', match.id);
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.url) {
        if (dbg) console.log('[Highlight] found for', match.home, 'vs', match.away, data.url);
        setHighlightsMap(prev => ({ ...prev, [match.id]: data }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch highlights for newly completed matches
  const autoFetchedRef = useRef({});
  useEffect(() => {
    if (!liveMatches || Object.keys(liveMatches).length === 0) return;
    for (const [, m] of Object.entries(liveMatches)) {
      if (!m.isCompleted && m.minute !== 'FT') continue;
      const key = `${m.home}_vs_${m.away}`;
      if (autoFetchedRef.current[key]) continue;
      if (!m.home || !m.away) continue;
      const matchId = [...(groupMatches || []), ...Object.values(bracket || {}).flat()].find(match => match.home === m.home && match.away === m.away)?.id;
      if (!matchId || highlightsMap[matchId]) continue;
      autoFetchedRef.current[key] = true;
      const homeName = TEAMS[m.home]?.name || m.home;
      const awayName = TEAMS[m.away]?.name || m.away;
      fetch(`/api/match-highlights?home=${encodeURIComponent(homeName)}&away=${encodeURIComponent(awayName)}&homeCode=${encodeURIComponent(m.home)}&awayCode=${encodeURIComponent(m.away)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.url && matchId) {
            setHighlightsMap(prev => ({ ...prev, [matchId]: data }));
          }
        })
        .catch(() => {});
    }
  }, [liveMatches, groupMatches, bracket, highlightsMap]);

  // --- Live Data Polling Effect ---
  useEffect(() => {
    const pollingIntervals = {
      fixtures: 30000,
      groups: 120000,
    };
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

    const interval = pollingIntervals[activeTab];

    fetchLiveScores();
    const onVisible = () => { if (!document.hidden) fetchLiveScores(); };
    document.addEventListener('visibilitychange', onVisible);

    if (interval) {
      const timer = setInterval(fetchLiveScores, interval);
      return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
    }
    return () => { document.removeEventListener('visibilitychange', onVisible); };
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

    const onVisible = () => { if (!document.hidden) fetchRatings(); };

    fetchRatings();
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(fetchRatings, 300000);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
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

    setBracket(prevBracket => {
      let changed = false;
      const nextBracket = JSON.parse(JSON.stringify(prevBracket));

      Object.keys(nextBracket).forEach(roundKey => {
        nextBracket[roundKey] = nextBracket[roundKey].map(m => {
          const live = liveMatches[m.id];
          if (live && (live.minute === 'FT' || live.isCompleted)) {
            if (!live.home || !live.away) return m;
            const liveWinner = live.winner;
            if (!m.isCompleted || m.homeScore !== live.homeScore || m.awayScore !== live.awayScore || m.winner !== liveWinner || m.home !== live.home || m.away !== live.away) {
              changed = true;
              const updatedMatch = {
                ...m,
                home: live.home,
                away: live.away,
                homeScore: live.homeScore,
                awayScore: live.awayScore,
                winner: liveWinner,
                isCompleted: true
              };

              // Propagate winner to nextId in nextBracket using live data's team codes
              let nextId = m.nextId;
              let currentWinnerCode;
              if (liveWinner === 'home') currentWinnerCode = live.home;
              else if (liveWinner === 'away') currentWinnerCode = live.away;
              else currentWinnerCode = null;

              while (nextId && currentWinnerCode) {
                const roundCode = nextId.split('_')[0];
                const nextMatch = nextBracket[roundCode].find(nm => nm.id === nextId);
                if (!nextMatch) break;

                if (m.position === 'top' || m.position === 'home') {
                  nextMatch.home = currentWinnerCode;
                } else {
                  nextMatch.away = currentWinnerCode;
                }
                break;
              }
              propagateLoserToBronze(updatedMatch, nextBracket);
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
      const savedBracketData = JSON.parse(savedBracket);
      Object.keys(KNOCKOUT_MATCHES).forEach(roundKey => {
        if (savedBracketData[roundKey]) {
          savedBracketData[roundKey] = savedBracketData[roundKey].map((m, i) => {
            const fresh = KNOCKOUT_MATCHES[roundKey][i];
            if (fresh) {
              const cleaned = { ...m, title: fresh.title, date: fresh.date };
              if (!TEAMS[cleaned.home]) cleaned.home = fresh.home;
              if (!TEAMS[cleaned.away]) cleaned.away = fresh.away;
              return cleaned;
            }
            return m;
          });
        }
      });
      setBracket(savedBracketData);
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
    } else if (theme === 'light') {
      root.classList.add('light');
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
                home: live.home,
                away: live.away,
                homeScore: live.homeScore,
                awayScore: live.awayScore,
                winner: liveWinner,
                isCompleted: true
              };

              // Propagate winner
              let nextId = m.nextId;
              let currentWinnerCode;
              if (liveWinner === 'home') currentWinnerCode = live.home;
              else if (liveWinner === 'away') currentWinnerCode = live.away;
              else currentWinnerCode = null;
              let currentPosition = m.position;

              while (nextId && currentWinnerCode) {
                const roundCode = nextId.split('_')[0];
                const nextMatch = nextBracket[roundCode].find(nm => nm.id === nextId);
                if (!nextMatch) break;

                const isHome = currentPosition === 'top' || currentPosition === 'home';
                if (isHome) {
                  nextMatch.home = currentWinnerCode;
                } else {
                  nextMatch.away = currentWinnerCode;
                }
                break;
              }
              propagateLoserToBronze(updatedMatch, nextBracket);
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
      const currentMatch = newBracket[roundKey]?.[matchIndex];
      if (!currentMatch) return prevBracket;
      if (currentMatch.isCompleted) return prevBracket;
      
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
      propagateLoserToBronze(currentMatch, newBracket);
      return newBracket;
    });
  };

  const handleResetPredictions = () => {
    setBracket(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const rounds = ['r32', 'r16', 'qf', 'sf', 'final'];
      rounds.forEach(rk => {
        next[rk] = next[rk].map(m => {
          if (m.isCompleted) return m;
          const cleared = { ...m, winner: null };
          if (rk !== 'r32') cleared.home = cleared.away = null;
          return cleared;
        });
      });
      return next;
    });
  };

  const sortedGroupMatches = useMemo(() => {
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
    const completedKnockouts = [];
    Object.values(bracket).forEach(round => {
      if (Array.isArray(round)) {
        round.forEach(m => {
          if (m.isCompleted) completedKnockouts.push({ ...m, stage: 'knockout' });
        });
      }
    });
    return [...sortedGroupMatches, ...completedKnockouts]
      .filter(m => m.isCompleted)
      .sort((a, b) => {
        const dateA = parseMatchKickoff(a);
        const dateB = parseMatchKickoff(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      })
      .reverse();
  }, [sortedGroupMatches, bracket]);

  const upcomingFixtures = useMemo(() => {
    const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'];
    const isTeamsConfirmed = (match) => {
      const rk = String(match.id).split('_')[0];
      if (rk === 'r32') return true;
      const idx = ROUND_ORDER.indexOf(rk);
      if (idx < 1) return true;
      const prevRoundKey = ROUND_ORDER[idx - 1];
      const sourceMatches = bracket[prevRoundKey]?.filter(sm => sm.nextId === match.id) || [];
      return sourceMatches.length > 0 && sourceMatches.every(sm => sm.isCompleted);
    };

    const allMatches = [];
    groupMatches.forEach(m => {
      allMatches.push({ ...m, stage: 'group', teamsConfirmed: true });
    });
    Object.keys(bracket).forEach(roundKey => {
      bracket[roundKey].forEach(m => {
        allMatches.push({ ...m, stage: 'knockout', teamsConfirmed: isTeamsConfirmed(m) });
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
      });
  }, [groupMatches, bracket, liveMatches]);

  const playerStats = useMemo(() => {
    const goalsCount = {};
    const assistsCount = {};
    const playerTeams = {};
    const playerRatingsTracker = {};

    const baseRatings = BASE_RATINGS;

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
        if (!s.player) return;
        const isOG = s.player.includes('(OG)') || s.player.includes('ownGoal') || s.player.includes('OG');
        if (isOG) return;

        const cleanPlayerName = s.player.replace(/\s*\(P\)/, '').trim();
        const teamCode = s.team === 'home' ? homeCode : awayCode;
        if (!teamCode) return;

        playerTeams[cleanPlayerName] = teamCode;
        goalsCount[cleanPlayerName] = (goalsCount[cleanPlayerName] || 0) + 1;
        scorersPerPlayer[cleanPlayerName] = (scorersPerPlayer[cleanPlayerName] || 0) + 1;

        // Determine assist player from scraped match events/timeline text if available
        let assistPlayerName = null;
        if (s.assist) {
          assistPlayerName = s.assist;
        } else {
          // Look in timeline for a matching goal text to extract "Assisted by [Name]"
          const matchTimeline = details.timeline || [];
          const goalEvent = matchTimeline.find(t => 
            (t.type?.toLowerCase().includes('goal') || t.text?.toLowerCase().includes('goal')) && 
            t.minute === s.minute && 
            t.text?.toLowerCase().includes(cleanPlayerName.toLowerCase())
          );
          if (goalEvent && goalEvent.text) {
            const assistMatch = goalEvent.text.match(/Assisted by ([^.]+)/i);
            if (assistMatch) {
              const parsedName = assistMatch[1].replace(/\s*with\s+a\s+.*/i, '').replace(/\s*following\s+a\s+.*/i, '').trim();
              // Validate and use matched player name if present in team players for consistency, otherwise use parsed name directly
              const teamPlayers = TEAM_PLAYERS[teamCode] || [];
              const matchedPlayer = teamPlayers.find(p => p.toLowerCase() === parsedName.toLowerCase() || p.toLowerCase().includes(parsedName.toLowerCase()));
              assistPlayerName = matchedPlayer || parsedName;
            }
          }
        }

        // Fallback to getAssistPlayer simulation if no real assist was found
        if (!assistPlayerName) {
          assistPlayerName = getAssistPlayer(m.id, cleanPlayerName, teamCode, s.minute);
        }

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

    const ratingsById = {};
    (fotmobRatings || []).forEach(p => { if (p.playerId) ratingsById[p.name] = p.playerId; });

    const topScorers = Object.entries(goalsCount)
      .map(([name, goals]) => ({ name, goals, team: playerTeams[name], playerId: ratingsById[name] }))
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .slice(0, 10);
    const topAssists = Object.entries(assistsCount)
      .map(([name, assists]) => ({ name, assists, team: playerTeams[name], playerId: ratingsById[name] }))
      .sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name))
      .slice(0, 10);

    const topRatings = fotmobRatings.slice(0, 10);

    return { topScorers, topAssists, topRatings };
  }, [groupMatches, bracket, liveMatches, fotmobRatings]);

  const tournamentChampion = useMemo(() => {
    const finalMatch = bracket.final.find(m => m.id === 'final');
    if (finalMatch && finalMatch.winner) {
      return TEAMS[finalMatch.winner];
    }
    return null;
  }, [bracket]);

  const burnedMatches = useMemo(() => {
    const burned = new Set();
    Object.values(bracket).forEach(round => {
      round.forEach(m => {
        if (m.isCompleted) burned.add(m.id);
      });
    });
    return burned;
  }, [bracket]);

  return (
        <div className={`min-h-screen ${
          theme === 'pitch-black' ? 'bg-black' : 
          theme === 'light' ? 'bg-brand-darkBg' : 'bg-brand-darkBg'
        } text-slate-100 font-sans antialiased transition-colors duration-300 dot-grid-bg`}>
      {/* Confetti Shower for Goal Alerts */}
      {goalAlert && <ConfettiShower />}

      {/* Goal Alert Centered Modal */}
      {goalAlert && (
        <>
          {/* Dimmed, blurred backdrop overlay */}
          <div 
            onClick={() => setGoalAlert(null)}
            className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-[3px] pointer-events-auto cursor-pointer animate-goalAlertBackdrop"
          />
          
          {/* Centered Modal Card Container */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none select-none">
            {/* Centered Modal Card */}
            <div 
              onClick={() => setGoalAlert(null)}
              className="w-full max-w-sm bg-slate-950/95 border-2 border-brand-neon rounded-3xl p-6 shadow-[0_0_50px_rgba(0,255,135,0.4)] backdrop-blur-md cursor-pointer pointer-events-auto animate-goalAlertCenter"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-900/60 mb-4">
                <span className="text-xs font-black tracking-[0.2em] text-brand-neon flex items-center gap-1.5 uppercase animate-pulse">
                  ⚽ GOAL ALERT!
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                  {goalAlert.matchLabel}
                </span>
              </div>
              
              {/* Flags & Scoreboard Block */}
              <div className="flex items-center justify-center gap-6 py-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 text-center w-1/3 min-w-0">
                  <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,255,135,0.2)] animate-bounce leading-none" style={{ animationDuration: '2s' }}>
                    {goalAlert.homeFlag}
                  </span>
                  <span className="font-black text-slate-100 text-sm truncate w-full mt-1">
                    {goalAlert.homeName}
                  </span>
                </div>
                
                {/* Score Box */}
                <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-brand-neon/30 rounded-2xl px-5 py-3 shadow-[inset_0_0_15px_rgba(0,255,135,0.05),0_0_20px_rgba(0,0,0,0.4)] min-w-[110px] shrink-0">
                  <div className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1 font-mono">SCORE</div>
                  <div className="text-3xl font-mono font-black text-brand-neon tracking-wide">
                    {goalAlert.homeScore} : {goalAlert.awayScore}
                  </div>
                </div>
                
                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 text-center w-1/3 min-w-0">
                  <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,255,135,0.2)] animate-bounce leading-none" style={{ animationDuration: '2s', animationDelay: '0.2s' }}>
                    {goalAlert.awayFlag}
                  </span>
                  <span className="font-black text-slate-100 text-sm truncate w-full mt-1">
                    {goalAlert.awayName}
                  </span>
                </div>
              </div>
              
              {/* Scorer Info */}
              {goalAlert.player && (
                <div className="relative mt-4 overflow-hidden rounded-xl border border-brand-neon/30 bg-gradient-to-r from-brand-neon/5 via-brand-neon/15 to-brand-neon/5 py-3 px-4 shadow-[0_4px_20px_rgba(0,255,135,0.05)]">
                  <div className="flex items-center justify-center gap-3">
                    <PlayerAvatar name={goalAlert.player} size="xl" />
                    <div className="text-center font-black text-brand-neon text-sm tracking-wide flex items-center gap-2">
                      <span className="animate-pulse">⚽</span>
                      <span className="truncate">{goalAlert.player}</span>
                      <span className="text-xs text-slate-300">({goalAlert.minute}')</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Click to dismiss helper text */}
              <div className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-4 animate-pulse">
                Click anywhere to dismiss
              </div>
            </div>
          </div>
        </>
      )}
      {/* Background glow effects for visual wow-factor */}
        {theme !== 'pitch-black' && theme !== 'light' && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 right-10 w-48 md:w-96 h-48 md:h-96 bg-brand-purple/20 rounded-full blur-3xl opacity-60 animate-glowDrift1"></div>
          <div className="absolute top-1/3 -left-40 w-48 md:w-96 h-48 md:h-96 bg-brand-neon/10 rounded-full blur-3xl opacity-50 animate-glowDrift2"></div>
          <div className="absolute bottom-10 right-1/4 w-40 md:w-80 h-40 md:h-80 bg-brand-royal/10 rounded-full blur-3xl opacity-40 animate-glowDrift3"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-80 h-48 md:h-80 bg-brand-gold/5 rounded-full blur-3xl opacity-40 animate-glowDrift1" style={{ animationDelay: '-5s' }}></div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-brand-neon/30 before:to-transparent">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0">
              <div className="bg-gradient-to-br from-brand-neon/30 to-emerald-500/20 p-1.5 sm:p-2 rounded-xl border border-brand-neon/30 shadow-[0_0_15px_rgba(0,255,135,0.15)] shrink-0">
                <WorldCupTrophyIcon className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-brand-neon drop-shadow-[0_0_8px_rgba(0,255,135,0.5)]" />
              </div>
              <div className="min-w-0">
                <h1 className="leading-tight">
                  <span className="text-[13px] sm:text-base md:text-lg font-black tracking-[0.25em] bg-gradient-to-r from-white via-slate-100 to-brand-neon/90 bg-clip-text text-transparent uppercase block">
                    WORLD CUP
                  </span>
                  <span className="text-[20px] sm:text-2xl md:text-3xl font-black tracking-[0.1em] text-white/90 uppercase block -mt-0.5">
                    2026
                  </span>
                </h1>
              </div>
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

            {/* Color Accent Picker — single dot opens popup */}
            <div className="relative">
              <button
                onClick={() => setShowAccentPicker(true)}
                className="w-7 h-7 rounded-full border-2 border-slate-700/80 transition-all cursor-pointer hover:scale-110 hover:border-slate-500 shrink-0 shadow-lg"
                style={{ backgroundColor: ACCENTS[accent]?.main || '#00FF87' }}
                title="Change accent color"
              />
              {showAccentPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowAccentPicker(false)}>
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                  <div
                    className="relative bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-fadeIn"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-bold text-sm">Accent Color</h3>
                      <button
                        onClick={() => setShowAccentPicker(false)}
                        className="text-slate-500 hover:text-white transition-colors text-lg leading-none cursor-pointer border-0 bg-transparent"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2.5">
                      {Object.entries(ACCENTS).map(([id, opt]) => (
                        <button
                          key={id}
                          onClick={() => {
                            localStorage.setItem('worldcup2026_accent', id);
                            setAccent(id);
                            setShowAccentPicker(false);
                          }}
                          className={`w-full aspect-square rounded-xl border-2 transition-all cursor-pointer relative ${
                            accent === id
                              ? 'border-white scale-110 shadow-lg z-10'
                              : 'border-transparent hover:scale-110 hover:z-10'
                          }`}
                          style={{ backgroundColor: opt.main }}
                          title={opt.label}
                        >
                          {accent === id && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black/60 drop-shadow-sm">
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 text-center mt-4">
                      Selected: <span className="text-slate-300 font-semibold">{ACCENTS[accent]?.label}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Selector Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'pitch-black' : prev === 'pitch-black' ? 'light' : 'dark')}
              className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                theme === 'pitch-black'
                  ? 'bg-zinc-900 border-zinc-700 text-brand-neon hover:bg-zinc-800'
                  : theme === 'light'
                    ? 'bg-white/80 border-slate-300/60 text-slate-700 hover:bg-white hover:border-slate-400'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={theme === 'pitch-black' ? 'Light mode' : theme === 'light' ? 'Dark mode' : 'Pitch Black mode'}
            >
              {theme === 'pitch-black' ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-brand-neon fill-brand-neon animate-pulse shrink-0" />
                  <span className="hidden sm:inline font-black uppercase tracking-wider text-[10px]">Pitch Black</span>
                </>
              ) : theme === 'light' ? (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  <span className="hidden sm:inline font-bold text-[10px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline font-bold text-[10px]">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN TABS NAV --- */}
      <nav className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 pt-4 sm:pt-6" role="tablist" aria-label="Main navigation tabs">
        <div className="flex gap-2 p-1 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-800/40 w-full overflow-x-auto scrollbar-none sm:w-fit whitespace-nowrap">
          {[
            { id: 'fixtures', label: 'Upcoming & Results', icon: Calendar, live: activeLiveMatchesList.length },
            { id: 'groups', label: 'Group Standings', icon: Users },
            { id: 'bracket', label: 'Roadmap Simulation', icon: TrendingUp },
            { id: 'stats', label: 'Player Stats', icon: Award },
            { id: 'ratings', label: 'Player Ratings', icon: Star },
            { id: 'venues', label: 'Stadium Venues', icon: MapPin },
            { id: 'system', label: 'System', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none cursor-pointer ${
                  isActive 
                    ? 'bg-brand-neon text-slate-950 shadow-neon font-black' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'fixtures' && tab.live > 0 && (
                  <span className="flex items-center gap-1 ml-0.5">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <span className={`text-[10px] font-mono font-black ${isActive ? 'text-red-800' : 'text-red-400'}`}>
                      {tab.live}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- CONTENT CONTAINER --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* --- TABS --- */}
        <div>
          {activeTab === 'fixtures' && (
            <div role="tabpanel" id="panel-fixtures" aria-labelledby="tab-fixtures">
              <FixturesTab 
                hasLiveMatches={hasLiveMatches}
                activeLiveMatchesList={activeLiveMatchesList}
                upcomingFixtures={upcomingFixtures}
                feedMatches={feedMatches}
                liveMatches={liveMatches}
              highlightsMap={highlightsMap}
              isLiveMatch={isLiveMatch}
                setSelectedMatch={setSelectedMatch}
                activeGoalFlashMatchIds={activeGoalFlashMatchIds}
                nextMatchCountdown={<NextMatchCountdown upcomingFixtures={upcomingFixtures} />}
                onFetchHighlight={handleFetchHighlight}
              />
            </div>
          )}

          {activeTab === 'groups' && (
            <div role="tabpanel" id="panel-groups" aria-labelledby="tab-groups">
              <GroupsTab 
                groupMatches={groupMatches}
                standings={standings}
                advancedTeams={advancedTeams}
                liveMatches={liveMatches}
                isLiveMatch={isLiveMatch}
                setSelectedMatch={setSelectedMatch}
              />
            </div>
          )}

          {activeTab === 'bracket' && (
            <div role="tabpanel" id="panel-bracket" aria-labelledby="tab-bracket">
              <BracketTab 
                bracket={bracket}
                standings={standings}
                advancedTeams={advancedTeams}
                tournamentChampion={tournamentChampion}
                burnedMatches={burnedMatches}
                handleKnockoutWinner={handleKnockoutWinner}
                onResetPredictions={handleResetPredictions}
                onRestoreBracket={(winners) => {
                  setBracket(prev => {
                    const next = JSON.parse(JSON.stringify(prev));
                    const rounds = ['r32', 'r16', 'qf', 'sf', 'final'];
                    rounds.forEach(rk => {
                      next[rk] = next[rk].map(m => {
                        const winner = winners[m.id];
                        if (winner && m.home && m.away && (winner === m.home || winner === m.away)) {
                          const updated = { ...m, winner };
                          if (m.nextId) {
                            const nextRound = m.nextId.split('_')[0];
                            const nextMatch = next[nextRound]?.find(nm => nm.id === m.nextId);
                            if (nextMatch) {
                              const isHome = m.position === 'top' || m.position === 'home';
                              if (isHome) nextMatch.home = winner;
                              else nextMatch.away = winner;
                            }
                          }
                          return updated;
                        }
                        return m;
                      });
                    });
                    return next;
                  });
                }}
              />
            </div>
          )}

          {activeTab === 'stats' && (
            <div role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
              <StatsTab 
                playerStats={playerStats}
                fotmobRatings={fotmobRatings}
              />
            </div>
          )}

          {activeTab === 'ratings' && (
            <div role="tabpanel" id="panel-ratings" aria-labelledby="tab-ratings">
              <PlayerRatingsTab 
                fotmobRatings={fotmobRatings}
              />
            </div>
          )}

          {activeTab === 'venues' && (
            <div role="tabpanel" id="panel-venues" aria-labelledby="tab-venues">
              <VenuesTab 
                groupMatches={groupMatches}
                bracket={bracket}
                liveMatches={liveMatches}
                isLiveMatch={isLiveMatch}
              />
            </div>
          )}

          {activeTab === 'system' && (
            <div role="tabpanel" id="panel-system" aria-labelledby="tab-system">
              <SystemTab />
            </div>
          )}
        </div>

        {/* Global Live Tracker Banner (at bottom for non-fixtures tabs) */}
        {activeTab !== 'fixtures' && (
          <LiveMatchesBanner 
            hasLiveMatches={hasLiveMatches}
            activeLiveMatchesList={activeLiveMatchesList}
            setSelectedMatch={setSelectedMatch}
            activeGoalFlashMatchIds={activeGoalFlashMatchIds}
          />
        )}
      </main>

      {/* --- BACK TO TOP --- */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-brand-neon text-slate-950 shadow-neon hover:scale-110 transition-all cursor-pointer animate-backToTop border-0"
          aria-label="Back to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

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
