const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })));
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/auth/session') || url.pathname.includes('/auth/me')) {
      return route.fulfill({ json: { data: { user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER', branch_id: 1 }, tenant: {}, expires_at: '2099-01-01' } } });
    }
    if (url.pathname === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS HN' }] } });
    if (url.pathname === '/api/staffs') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Nhân viên 1' }] } });
    if (url.pathname === '/api/customers') return route.fulfill({ json: { data: [{ id: 10, fullname: 'Khách Test' }] } });
    if (url.pathname.startsWith('/api/products')) {
      return route.fulfill({ json: { data: [
        { id: 101, name: 'pnp', price: 1000000, is_product: 0, is_service_group: 0 }
      ] } });
    }
    return route.fulfill({ json: { data: [], total: 0 } });
  });

  await page.goto('http://localhost:5173/invoices');
  await page.getByRole('button', { name: 'Tạo hóa đơn' }).click();
  await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click();
  const rows = page.locator('.invoice-drawer .product-entry-row');
  await rows.nth(0).getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' }).click();
  await rows.nth(0).getByRole('option', { name: 'pnp' }).click();

  const choice = page.locator('.invoice-lifetime-choice');
  const span = choice.locator('span');
  const choiceBox = await choice.boundingBox();
  const spanBox = await span.boundingBox();
  const spanText = await span.innerText();
  const spanStyles = await span.evaluate(el => {
    const cs = window.getComputedStyle(el);
    return {
      width: cs.width,
      overflow: cs.overflow,
      whiteSpace: cs.whiteSpace,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      display: cs.display
    };
  });
  console.log('Choice box:', choiceBox);
  console.log('Span box:', spanBox);
  console.log('Span text:', spanText);
  console.log('Span styles:', spanStyles);

  await browser.close();
})();
