import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const url = 'https://www.fifa.com/en/match-centre/match/17/285023/289273/400021443';
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('Waiting for elements...');
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  const content = await page.content();
  fs.writeFileSync('scratch/overview.html', content, 'utf8');
  console.log('Saved HTML to scratch/overview.html');
  
  await browser.close();
}

main().catch(err => {
  console.error(err);
});
