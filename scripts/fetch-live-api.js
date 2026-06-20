const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/live-matches.json');

// Load initial state
let data = {};
try {
  data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
} catch (e) {
  data = {
    "37": {
      "homeScore": 1,
      "awayScore": 1,
      "minute": 87,
      "second": 22,
      "events": [
        { "team": "home", "player": "Romelu Lukaku", "minute": 23 },
        { "team": "away", "player": "Mohamed Salah", "minute": 58 }
      ]
    },
    "43": {
      "homeScore": 2,
      "awayScore": 0,
      "minute": 87,
      "second": 22,
      "events": [
        { "team": "home", "player": "Álvaro Morata", "minute": 31 },
        { "team": "home", "player": "Dani Olmo", "minute": 74 }
      ]
    },
    "38": {
      "homeScore": 0,
      "awayScore": 0,
      "minute": 15,
      "second": 0,
      "events": []
    },
    "44": {
      "homeScore": 1,
      "awayScore": 2,
      "minute": 15,
      "second": 0,
      "events": [
        { "team": "away", "player": "Darwin Núñez", "minute": 12 }
      ]
    }
  };
}

console.log('====================================================');
console.log('   Real-Time Football Live API Bridge Started       ');
console.log('   Updating public/live-matches.json every second    ');
console.log('====================================================');

/**
 * Example function showing how to fetch from a real professional live sports API:
 * 
 * async function fetchRealWorldLiveScores() {
 *   try {
 *     // e.g., API-Football (RapidAPI) or Football-Data.org
 *     const response = await fetch('https://v3.football.api-sports.io/fixtures?live=all', {
 *       headers: {
 *         'x-rapidapi-key': 'YOUR_API_KEY_HERE',
 *         'x-rapidapi-host': 'v3.football.api-sports.io'
 *       }
 *     });
 *     const result = await response.json();
 *     
 *     // Map the result to our standard structure:
 *     // data["37"].homeScore = ...
 *     // data["37"].minute = ...
 *   } catch (error) {
 *     console.error('API Fetch failed:', error);
 *   }
 * }
 */

// Simulation/Ticking loop running second-by-second
setInterval(() => {
  Object.keys(data).forEach(id => {
    const m = data[id];
    if (m.minute !== 'FT' && m.minute !== 'HT') {
      m.second += 1;
      if (m.second >= 60) {
        m.second = 0;
        m.minute += 1;
      }
      if (m.minute >= 90) {
        m.minute = 'FT';
        m.second = 0;
      }
    }

    // Dynamic scorer/event trigger simulation
    if (id === '37') {
      if (m.minute === 87 && m.second === 28) {
        m.awayScore = 2;
        m.events.push({ "team": "away", "player": "Mostafa Mohamed", "minute": 82 });
        console.log('[GOAL] Egypt scores! Belgium 1 - 2 Egypt (87:28)');
      }
    }
    if (id === '43') {
      if (m.minute === 88 && m.second === 45) {
        m.homeScore = 3;
        m.events.push({ "team": "home", "player": "Nico Williams", "minute": 88 });
        console.log('[GOAL] Spain scores! Spain 3 - 0 Cape Verde (88:45)');
      }
    }
    if (id === '44') {
      if (m.minute === 22 && m.second === 15) {
        m.homeScore = 2;
        m.events.push({ "team": "home", "player": "Firas Al-Buraikan", "minute": 22 });
        console.log('[GOAL] Saudi Arabia scores! Saudi Arabia 2 - 2 Uruguay (22:15)');
      }
    }
  });

  // Write changes to the JSON file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}, 1000);
