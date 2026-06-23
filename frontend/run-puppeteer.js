const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:3000/#/dashboard', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => document.getElementById('dashboard-content').innerHTML);
  console.log('DASHBOARD CONTENT LENGTH:', content.length);
  
  await browser.close();
})();
