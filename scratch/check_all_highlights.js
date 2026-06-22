const TEAM_ALIASES = {
  'united states': ['usa', 'united states', 'us'],
  'south korea': ['korea republic', 'south korea', 'korea'],
  'czechia': ['czechia', 'czech republic'],
  'turkey': ['turkiye', 'turkey'],
  'ivory coast': ["cote d'ivoire", 'cote divoire', 'ivory coast'],
  'dr congo': ['dr congo', 'congo dr', 'democratic republic of congo'],
  'cape verde': ['cabo verde', 'cape verde'],
  'bosnia  herzegovina': ['bosnia and herzegovina', 'bosnia & herzegovina', 'bosnia']
};

function normalizeTeamName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // keep alphanumeric and spaces
    .trim();
}

const COMPLETED_MATCHES = [
  { home: "Mexico", away: "South Africa" },
  { home: "South Korea", away: "Czechia" },
  { home: "Canada", away: "Bosnia & Herzegovina" },
  { home: "Qatar", away: "Switzerland" },
  { home: "Brazil", away: "Morocco" },
  { home: "Haiti", away: "Scotland" },
  { home: "United States", away: "Paraguay" },
  { home: "Australia", away: "Turkey" },
  { home: "Germany", away: "Curaçao" },
  { home: "Ivory Coast", away: "Ecuador" },
  { home: "Netherlands", away: "Japan" },
  { home: "Sweden", away: "Tunisia" }
];

async function checkMatch(home, away) {
  const cleanHome = home.replace(/&/g, 'and');
  const cleanAway = away.replace(/&/g, 'and');
  const query = `FIFA ${cleanHome} v ${cleanAway} World Cup highlights`;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!dataMatch) {
      console.log(`❌ [${home} vs ${away}] - ytInitialData not found`);
      return false;
    }
    
    const data = JSON.parse(dataMatch[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) {
      console.log(`❌ [${home} vs ${away}] - Contents not found`);
      return false;
    }
    
    const videos = [];
    for (const section of contents) {
      const itemSection = section.itemSectionRenderer;
      if (itemSection && itemSection.contents) {
        for (const item of itemSection.contents) {
          if (item.videoRenderer) {
            const vr = item.videoRenderer;
            const title = vr.title?.runs?.[0]?.text;
            const videoId = vr.videoId;
            const channel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text;
            const channelUrl = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl 
              || vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl 
              || '';
            const duration = vr.lengthText?.simpleText || '';
            if (title && videoId) {
              videos.push({ title, videoId, channel, channelUrl, duration });
            }
          }
        }
      }
    }

    const realVideos = videos.filter(v => {
      const titleLower = v.title.toLowerCase();
      const channelLower = (v.channel || '').toLowerCase();
      const channelUrlLower = (v.channelUrl || '').toLowerCase();
      
      const isOfficialFIFA = channelLower === 'fifa' && (
        channelUrlLower === '/@fifa' || 
        channelUrlLower.includes('ucpctrcxblq78gzrtutlwebw')
      );
      if (!isOfficialFIFA) {
        return false;
      }
      
      if (!v.duration) {
        return false;
      }
      
      const normTitle = titleLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normHome = normalizeTeamName(home);
      const normAway = normalizeTeamName(away);
      
      const checkTeam = (normName) => {
        const aliases = TEAM_ALIASES[normName] || [normName];
        if (aliases.some(alias => normTitle.includes(alias))) {
          return true;
        }
        const words = normName.split(' ').filter(w => w.length > 3);
        if (words.length > 0) {
          return words.every(word => normTitle.includes(word));
        }
        return false;
      };

      return checkTeam(normHome) && checkTeam(normAway);
    });

    if (realVideos.length > 0) {
      console.log(`✅ [${home} vs ${away}] - FOUND: "${realVideos[0].title}" (ID: ${realVideos[0].videoId})`);
      return true;
    } else {
      console.log(`❌ [${home} vs ${away}] - NO HIGHLIGHT MATCHED. Top search results:`);
      videos.slice(0, 5).forEach((v, idx) => {
        console.log(`  ${idx + 1}. [${v.videoId}] (Ch: ${v.channel}, Url: ${v.channelUrl}, Dur: ${v.duration}) - ${v.title}`);
      });
      return false;
    }
  } catch (err) {
    console.error(`❌ [${home} vs ${away}] - Error: ${err.message}`);
    return false;
  }
}

async function main() {
  for (const m of COMPLETED_MATCHES) {
    await checkMatch(m.home, m.away);
    // Add small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
}

main();
