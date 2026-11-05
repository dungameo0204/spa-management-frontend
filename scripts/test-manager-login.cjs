const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to app...');
  await page.goto('http://127.0.0.1:28895/', { waitUntil: 'networkidle' });

  console.log('Filling login form...');
  await page.fill('input[placeholder="Nhập tên đăng nhập"]', '3thang10');
  await page.fill('input[placeholder="Nhập mật khẩu"]', '123');
  
  console.log('Clicking login...');
  await page.click('button.login-submit');

  console.log('Waiting for network idle / URL change...');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Body preview:', bodyText);

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href')
    })).filter(x => x.text);
  });
  console.log('Links:', links);

  await browser.close();
})();

