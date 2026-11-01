const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  
  const viewports = [
    { name: 'laptop-1366', width: 1366, height: 768 },
    { name: 'ipad-landscape-1024', width: 1024, height: 768 },
    { name: 'ipad-portrait-820', width: 820, height: 1180 },
    { name: 'ipad-portrait-768', width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.addInitScript(() => localStorage.setItem('xuly.session', JSON.stringify({ token: 'test-token', user: { id: 1, branch_id: 1, fullname: 'Quản lý', system_role: 'MANAGER' } })));
    await page.route('**/api/**', route => {
      const url = new URL(route.request().url());
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname.includes('/auth/session') || url.pathname.includes('/auth/me')) {
        return route.fulfill({ json: { data: { user: { id: 1, fullname: 'Quản lý', system_role: 'MANAGER', branch_id: 1 }, tenant: {}, expires_at: '2099-01-01' } } });
      }
      if (url.pathname === '/api/branches') return route.fulfill({ json: { data: [{ id: 1, name: 'CS HN' }] } });
      if (url.pathname === '/api/staffs') return route.fulfill({ json: { data: [{ id: 1, fullname: 'Nhân viên 1' }] } });
      if (url.pathname === '/api/customers') return route.fulfill({ json: { data: [{ id: 10, fullname: 'Khách Test', wallet_balance: 0, total_debt: 0 }] } });
      if (url.pathname.startsWith('/api/products')) {
        const combo = { id: 100, name: 'dịch vụ chữa nám trọn đời', price: 30000000, is_product: 0, is_service_group: 1, child_service_ids: [101, 102, 103, 104], serviceChildren: [
          { product_id: 101, product_name: 'pnp', quantity: 1, is_lifetime: 1 },
          { product_id: 102, product_name: 'tan nhang', quantity: 1, is_lifetime: 1 },
          { product_id: 103, product_name: 'laser nám', quantity: 1, is_lifetime: 1 },
          { product_id: 104, product_name: 'massage', quantity: 1, is_lifetime: 1 }
        ] };
        if (url.pathname === '/api/products/100') return route.fulfill({ json: { data: combo } });
        if (url.pathname === '/api/products/101') return route.fulfill({ json: { data: { id: 101, name: 'pnp', price: 1000000, is_product: 0, is_service_group: 0 } } });
        if (url.pathname === '/api/products/102') return route.fulfill({ json: { data: { id: 102, name: 'tan nhang', price: 1000000, is_product: 0, is_service_group: 0 } } });
        if (url.pathname === '/api/products/103') return route.fulfill({ json: { data: { id: 103, name: 'laser nám', price: 1000000, is_product: 0, is_service_group: 0 } } });
        if (url.pathname === '/api/products/104') return route.fulfill({ json: { data: { id: 104, name: 'massage', price: 1000000, is_product: 0, is_service_group: 0 } } });
        return route.fulfill({ json: { data: [
          combo,
          { id: 101, name: 'pnp', price: 1000000, is_product: 0, is_service_group: 0 },
          { id: 102, name: 'Demo - Sản phẩm dưỡng da', price: 450000, is_product: 1, inventory: [{ branch_id: 1, branch_name: 'CS HN', quantity: 8 }] }
        ] } });
      }
      return route.fulfill({ json: { data: [], total: 0 } });
    });

    await page.goto('http://localhost:5173/invoices');
    await page.getByRole('button', { name: 'Tạo hóa đơn' }).click();

    // 1st item (combo)
    await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click();
    const rows = page.locator('.invoice-drawer .product-entry-row');
    const p0 = rows.nth(0).getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' });
    await p0.click();
    await rows.nth(0).getByRole('option', { name: 'dịch vụ chữa nám trọn đời' }).click();

    // 2nd item (single service with Làm ngay / performNow=true)
    await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click();
    const p1 = rows.nth(1).getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' });
    await p1.click();
    await rows.nth(1).getByRole('option', { name: 'pnp' }).click();

    // 3rd item (product)
    await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click();
    const p2 = rows.nth(2).getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' });
    await p2.click();
    await rows.nth(2).getByRole('option', { name: 'Demo - Sản phẩm dưỡng da' }).click();

    const spanText = await rows.nth(1).locator('.invoice-lifetime-choice span').innerText();
    const spanBox = await rows.nth(1).locator('.invoice-lifetime-choice span').boundingBox();
    const qBox = await rows.nth(1).locator('.quantity-field input').boundingBox();
    const prBox = await rows.nth(1).getByRole('textbox', { name: 'Đơn giá', exact: true }).boundingBox();
    const debug = await rows.nth(1).evaluate(row => {
      const qField = row.querySelector('.quantity-field');
      const prField = row.querySelector('.money-field');
      return {
        qFieldStyle: {
          display: getComputedStyle(qField).display,
          gridTemplateRows: getComputedStyle(qField).gridTemplateRows,
          height: qField.offsetHeight
        },
        prFieldStyle: {
          display: getComputedStyle(prField).display,
          gridTemplateRows: getComputedStyle(prField).gridTemplateRows,
          height: prField.offsetHeight
        }
      };
    });
    console.log(`[${vp.name}] debug:`, JSON.stringify(debug));

    // 4th item (newly added, click to open dropdown so we can verify dropdown is not clipped!)
    await page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/ }).click();
    const p3 = rows.nth(3).getByRole('combobox', { name: 'Tìm sản phẩm / dịch vụ' });
    await p3.click();

    await page.evaluate(() => {
      const body = document.querySelector('.invoice-drawer .drawer-body');
      if (body) body.scrollTop = 0;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `scratch/view-${vp.name}.png` });
    await page.close();
  }

  await browser.close();
  console.log('All screenshots taken!');
})();
