import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testApi() {
  try {
    // FIFA WC 2026 Season ID is probably part of the calendar request.
    // Let's request all matches in the date range of the group stage (June 11 to June 20, 2026)
    const url = 'https://api.fifa.com/api/v3/calendar/matches?from=2026-06-11T00:00:00Z&to=2026-06-22T23:59:59Z&language=en&count=100';
    console.log(`Fetching: ${url}`);
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`API returned ${data.Results?.length || 0} matches.`);
    
    if (data.Results && data.Results.length > 0) {
      // Find a completed match (e.g. England vs Croatia or Mexico vs South Africa)
      const finished = data.Results.filter(m => m.MatchStatus === 0 || m.MatchStatus === 'Finished' || m.Period === 10); // 10 is usually FT
      console.log(`Found ${finished.length} finished matches.`);
      
      if (finished.length > 0) {
        const sample = finished[0];
        console.log('--- SAMPLE MATCH JSON KEYS ---', Object.keys(sample));
        console.log('Home Team:', sample.Home?.TeamName);
        console.log('Away Team:', sample.Away?.TeamName);
        console.log('Score:', sample.Home?.Score, '-', sample.Away?.Score);
        
        // Let's write the first finished match to a file to inspect its full properties!
        fs.writeFileSync(path.join(__dirname, '../public/sample_match_api.json'), JSON.stringify(sample, null, 2));
        console.log('Saved sample finished match to public/sample_match_api.json');
      }
    }
  } catch (err) {
    console.error('Error fetching FIFA API:', err);
  }
}

testApi();
