const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:28895/', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="Nhập tên đăng nhập"]', 'nvcs1');
  await page.fill('input[placeholder="Nhập mật khẩu"]', '123456');
  await page.click('button.login-submit');
  await page.waitForTimeout(2500);
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('aside a, nav a')).map(a => a.innerText.trim()).filter(Boolean));
  console.log('Staff menus:', links);
  await browser.close();
})();

