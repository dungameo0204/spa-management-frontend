const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://127.0.0.1:28895/', { waitUntil: 'networkidle' });
  const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
  console.log('Root HTML:', rootHtml.slice(0, 400));
  await browser.close();
})();

