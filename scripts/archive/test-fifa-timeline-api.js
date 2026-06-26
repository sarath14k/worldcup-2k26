import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTimeline() {
  try {
    const idCompetition = 'cesdwwnxbc5fmajgroc0hqzy2';
    const idSeason = 'dezv8l0fzgcxtejl0dwmy1gyc';
    const idStage = '2m1wojm5bt709wu4kugtytxqs';
    const idMatch = '4nv1wepnt2xejyfeh01qnantg';
    
    const url = `https://givevoicetofootball.fifa.com/api/v1/timelines/${idCompetition}/${idSeason}/${idStage}/${idMatch}?language=en-GB`;
    console.log(`Fetching: ${url}`);
    
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`Failed to fetch timeline: HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log('Keys of response:', Object.keys(data));
    fs.writeFileSync(path.join(__dirname, '../public/sample_timeline.json'), JSON.stringify(data, null, 2));
    console.log('Saved timeline JSON to public/sample_timeline.json');
  } catch (err) {
    console.error('Error fetching timeline API:', err);
  }
}

testTimeline();
