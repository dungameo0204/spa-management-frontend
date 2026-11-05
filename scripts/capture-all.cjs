const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'docs', 'images', 'rosa-huong-dan');

async function snap(page, name, selector = null) {
  const file = path.join(outDir, name);
  if (selector) {
    const el = await page.$(selector);
    if (el) {
      await el.screenshot({ path: file });
      console.log('Saved selector screenshot:', name);
      return;
    }
  }
  await page.screenshot({ path: file, fullPage: false });
  console.log('Saved page screenshot:', name);
}

async function closeOpenDrawers(page) {
  const closeButtons = await page.$$('.drawer-close, .modal-close, button:has-text("Đóng"), button:has-text("Hủy")');
  for (const btn of closeButtons) {
    try {
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    } catch (e) {}
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login Page
  await page.goto('http://127.0.0.1:28895/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await snap(page, '01-dang-nhap.png');

  // Fill login
  await page.fill('input[placeholder="Nhập tên đăng nhập"]', '3thang10');
  await page.fill('input[placeholder="Nhập mật khẩu"]', '123');
  await page.click('button.login-submit');
  await page.waitForTimeout(2000);

  // 2. Dashboard (Tổng quan)
  await snap(page, '02-tong-quan.png');

  // 3. Cơ sở / Chi nhánh
  await page.goto('http://127.0.0.1:28895/branches', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '03-chi-nhanh-danh-sach.png');
  const addBranchBtn = await page.$('button:has-text("Thêm mới")');
  if (addBranchBtn) {
    await addBranchBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '03-chi-nhanh-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 4. Chức vụ
  await page.goto('http://127.0.0.1:28895/roles', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '04-chuc-vu-danh-sach.png');
  const addRoleBtn = await page.$('button:has-text("Thêm mới")');
  if (addRoleBtn) {
    await addRoleBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '04-chuc-vu-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 5. Tài khoản nhân viên
  await page.goto('http://127.0.0.1:28895/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '05-tai-khoan-danh-sach.png');
  const addUserBtn = await page.$('button:has-text("Thêm mới")');
  if (addUserBtn) {
    await addUserBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '05-tai-khoan-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 6. Hồ sơ nhân viên
  await page.goto('http://127.0.0.1:28895/staffs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '06-nhan-su-danh-sach.png');
  const addStaffBtn = await page.$('button:has-text("Thêm mới")');
  if (addStaffBtn) {
    await addStaffBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '06-nhan-su-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 7. Sản phẩm & Dịch vụ (có dịch vụ con)
  await page.goto('http://127.0.0.1:28895/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '07-san-pham-dich-vu-danh-sach.png');
  
  // Mở modal Thêm mới Dịch vụ
  const addProdBtn = await page.$('button:has-text("Thêm mới")');
  if (addProdBtn) {
    await addProdBtn.click();
    await page.waitForTimeout(500);
    // Click chọn phân loại dịch vụ
    const radioService = await page.$('input[value="service"], input[value="0"], label:has-text("Dịch vụ")');
    if (radioService) await radioService.click();
    await page.waitForTimeout(500);
    await snap(page, '07-dich-vu-modal-dich-vu-con.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 8. Khách hàng & Hồ sơ khách & Tải ảnh da
  await page.goto('http://127.0.0.1:28895/customers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '08-khach-hang-danh-sach.png');
  
  // Click thêm mới khách hàng
  const addCustomerBtn = await page.$('button:has-text("Thêm mới")');
  if (addCustomerBtn) {
    await addCustomerBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '08-khach-hang-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // Xem hồ sơ khách hàng đầu tiên
  const firstCustomerRow = await page.$('table tbody tr');
  if (firstCustomerRow) {
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);
    await snap(page, '08-ho-so-khach-hang.png');

    // Chuyển sang tab hoặc xem album ảnh da
    const albumBtn = await page.$('button:has-text("Ảnh da"), button:has-text("Album"), button:has-text("Hình ảnh"), [aria-label*="ảnh"]');
    if (albumBtn) {
      await albumBtn.click();
      await page.waitForTimeout(600);
      await snap(page, '08-tai-anh-da-khach.png');
    }
  }

  // 9. Khách đặt lịch (tính năng mới)
  await page.goto('http://127.0.0.1:28895/customer-bookings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '09-khach-dat-lich-danh-sach.png');
  const addBookingBtn = await page.$('button:has-text("Thêm mới"), button:has-text("Tạo"), button:has-text("Đặt lịch")');
  if (addBookingBtn) {
    await addBookingBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '09-khach-dat-lich-modal.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 10. Lịch hẹn & Ghi chú liên hệ lịch hẹn (tính năng mới)
  await page.goto('http://127.0.0.1:28895/appointments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '10-lich-hen-danh-sach.png');
  
  // Click xem/sửa lịch hẹn để thấy ghi chú tại lịch hẹn
  const editApptBtn = await page.$('table tbody tr button:has-text("Sửa"), table tbody tr');
  if (editApptBtn) {
    await editApptBtn.click();
    await page.waitForTimeout(800);
    await snap(page, '10-lich-hen-ghi-chu-lien-he.png', '.form-drawer, .modal, [role="dialog"]');
    await closeOpenDrawers(page);
  }

  // 11. Bán hàng & Hóa đơn (có chọn dịch vụ con & nhân viên làm con)
  await page.goto('http://127.0.0.1:28895/invoices', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '11-ban-hang-danh-sach.png');
  const addInvBtn = await page.$('button:has-text("Tạo hóa đơn"), button:has-text("Thêm mới")');
  if (addInvBtn) {
    await addInvBtn.click();
    await page.waitForTimeout(800);
    await snap(page, '11-tao-hoa-don.png');
    await closeOpenDrawers(page);
  }

  // 12. Liệu trình
  await page.goto('http://127.0.0.1:28895/treatments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '12-lieu-trinh-danh-sach.png');
  // Click thẻ hoặc tạo thẻ
  const firstTreatment = await page.$('table tbody tr, .treatment-card');
  if (firstTreatment) {
    await firstTreatment.click();
    await page.waitForTimeout(800);
    await snap(page, '12-chi-tiet-lieu-trinh.png');
  }

  // 13. Nhập kho & Tồn kho
  await page.goto('http://127.0.0.1:28895/imports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '13-nhap-kho.png');
  await page.goto('http://127.0.0.1:28895/inventory', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '13-ton-kho.png');

  // 14. Ví khách hàng & Thu nợ
  await page.goto('http://127.0.0.1:28895/wallet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '14-vi-khach-hang.png');
  await page.goto('http://127.0.0.1:28895/debts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '14-thu-cong-no.png');

  // 15. Phiếu chi
  await page.goto('http://127.0.0.1:28895/expenses', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '15-phieu-chi.png');

  // 16. Công ca, Tư vấn & Báo cáo
  await page.goto('http://127.0.0.1:28895/commissions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '16-cong-ca.png');
  await page.goto('http://127.0.0.1:28895/consultants', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '16-tu-van.png');
  await page.goto('http://127.0.0.1:28895/reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snap(page, '16-bao-cao.png');

  console.log('ALL SCREENSHOTS COMPLETED SUCCESSFULLY!');
  await browser.close();
})();
