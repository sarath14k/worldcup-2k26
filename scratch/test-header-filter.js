import fs from 'fs';
import * as cheerio from 'cheerio';

function main() {
  const html = fs.readFileSync('scratch/overview.html', 'utf8');
  const $ = cheerio.load(html);
  
  const homeScorers = [];
  const homeContainer = $('[class*="match-details-header-events-component_home__"]');
  if (homeContainer.length > 0) {
    const events = homeContainer.find('[class*="match-details-header-events-component_event__"]');
    events.each((i, el) => {
      const nameEl = $(el).find('[class*="match-details-header-events-component_playerNameLeft__"]');
      const timeEl = $(el).find('[class*="match-details-header-events-component_timeBox__"]');
      const ogEl = $(el).find('[class*="match-details-header-events-component_ownGoal__"]');
      const goalIcon = $(el).find('[class*="goalIcon"], [class*="ownGoal"], svg.match-details-header-events-component_goalIcon__9bMk6');
      
      console.log(`Home Event ${i}: name: ${nameEl.text().trim()}, time: ${timeEl.text().trim()}, hasGoalIcon: ${goalIcon.length > 0}`);
      
      if (nameEl.length > 0 && goalIcon.length > 0) {
        homeScorers.push({
          team: 'home',
          player: nameEl.text().trim(),
          time: timeEl.text().trim()
        });
      }
    });
  }
  
  const awayScorers = [];
  const awayContainer = $('[class*="match-details-header-events-component_away__"]');
  if (awayContainer.length > 0) {
    const events = awayContainer.find('[class*="match-details-header-events-component_event__"]');
    events.each((i, el) => {
      const nameEl = $(el).find('[class*="match-details-header-events-component_playerNameRight__"]');
      const timeEl = $(el).find('[class*="match-details-header-events-component_timeBox__"]');
      const ogEl = $(el).find('[class*="match-details-header-events-component_ownGoal__"]');
      const goalIcon = $(el).find('[class*="goalIcon"], [class*="ownGoal"], svg.match-details-header-events-component_goalIcon__9bMk6');
      
      console.log(`Away Event ${i}: name: ${nameEl.text().trim()}, time: ${timeEl.text().trim()}, hasGoalIcon: ${goalIcon.length > 0}`);
      
      if (nameEl.length > 0 && goalIcon.length > 0) {
        awayScorers.push({
          team: 'away',
          player: nameEl.text().trim(),
          time: timeEl.text().trim()
        });
      }
    });
  }
  
  console.log('Filtered Home Scorers:', homeScorers);
  console.log('Filtered Away Scorers:', awayScorers);
}

main();
