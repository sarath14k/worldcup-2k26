import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json['@type'] === 'LiveBlogPosting' && json.liveBlogUpdate) {
        // Find periods
        const starts = json.liveBlogUpdate
          .filter(e => e.headline === 'Start Time' || e.headline === 'Kick Off')
          .map(e => new Date(e.datePublished).getTime());
        
        const ends = json.liveBlogUpdate
          .filter(e => e.headline === 'End Time' || e.headline === 'Half Time' || e.headline === 'Match end')
          .map(e => new Date(e.datePublished).getTime());
          
        console.log('Starts:', starts.map(t => new Date(t).toISOString()));
        console.log('Ends:', ends.map(t => new Date(t).toISOString()));
        
        if (starts.length < 2) {
          console.log('Not enough period start times.');
          return;
        }
        
        const p1Start = starts[0];
        const p1End = ends[0] || (p1Start + 45 * 60 * 1000);
        const p2Start = starts[1];
        const p2End = ends[1] || (p2Start + 45 * 60 * 1000);
        
        json.liveBlogUpdate.forEach((update, idx) => {
          const headline = update.headline;
          const body = update.articleBody || '';
          const time = new Date(update.datePublished).getTime();
          
          const isGoal = headline.toLowerCase().includes('goal!') || headline.toLowerCase().includes('own goal');
          const isCard = headline.toLowerCase().includes('card');
          const isSub = headline.toLowerCase().includes('substitution');
          
          if (isGoal || isCard || isSub) {
            let minute = 0;
            let minuteStr = '';
            
            if (time <= p1End) {
              const diffMin = Math.ceil((time - p1Start) / 60000);
              minute = diffMin;
              if (minute > 45) {
                minuteStr = `45'+${minute - 45}`;
              } else {
                minuteStr = `${minute}'`;
              }
            } else if (time > p1End && time < p2Start) {
              minute = 45;
              minuteStr = "HT";
            } else {
              const diffMin = Math.ceil((time - p2Start) / 60000);
              minute = 45 + diffMin;
              if (minute > 90) {
                minuteStr = `90'+${minute - 90}`;
              } else {
                minuteStr = `${minute}'`;
              }
            }
            
            console.log(`[Event] type: "${headline}", min: "${minuteStr}" (${minute}), text: "${body}"`);
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
}

main();
