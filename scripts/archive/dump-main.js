import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const url = 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=IN&wtw-filter=ALL';
const tempHtmlPath = '/home/sarath/.gemini/antigravity/brain/a1cc961f-d7a6-4aac-b25d-5d9b477ecdd3/scratch/main_page.html';

console.log('Dumping main page HTML...');
execSync(`google-chrome --headless=new --disable-gpu --virtual-time-budget=10000 --dump-dom "${url}" > "${tempHtmlPath}"`, { stdio: 'ignore' });
console.log('Dump complete.');
