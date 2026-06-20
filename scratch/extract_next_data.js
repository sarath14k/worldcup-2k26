import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('temp_dump.html', 'utf8');
const $ = cheerio.load(html);

const nextDataScript = $('#__NEXT_DATA__');
if (nextDataScript.length > 0) {
  console.log('Found __NEXT_DATA__ script!');
  try {
    const data = JSON.parse(nextDataScript.text());
    console.log('Successfully parsed NEXT_DATA JSON!');
    fs.writeFileSync('next_data.json', JSON.stringify(data, null, 2));
    console.log('Saved NEXT_DATA to next_data.json. Size:', fs.statSync('next_data.json').size, 'bytes');
  } catch (e) {
    console.error('Failed to parse NEXT_DATA:', e.message);
  }
} else {
  console.log('No __NEXT_DATA__ script found.');
}
