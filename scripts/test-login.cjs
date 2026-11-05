const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:28895/', { waitUntil: 'networkidle' });
  
  // Login as 3thang10 / 123
  await page.fill('input[type="text"]', '3thang10');
  await page.fill('input[type="password"]', '123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1000);
  
  console.log('After login URL:', page.url());
  const navItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, button')).map(el => ({
      text: el.innerText.trim(),
      href: el.getAttribute('href'),
      class: el.className
    })).filter(x => x.text);
  });
  console.log('Nav items found:', navItems.slice(0, 30));
  await browser.close();
})();

