const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/images/rosa-huong-dan');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function closeDrawer(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
  });
  const page = await context.newPage();

  console.log('1. Đăng nhập...');
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT_DIR, '01-dang-nhap.png') });

  await page.getByPlaceholder('Nhập tên đăng nhập').fill('3thang10');
  await page.getByPlaceholder('Nhập mật khẩu').fill('123');
  await page.locator('button.login-submit').click();
  await page.waitForTimeout(1500);

  console.log('2. Tổng quan...');
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '02-tong-quan.png') });

  console.log('3. Khách hàng...');
  await page.goto('http://127.0.0.1:5173/customers');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '03-khach-hang-danh-sach.png') });

  // Mở drawer thêm khách
  const addCustomerBtn = page.getByRole('button', { name: /Tạo khách hàng|Thêm khách hàng|Thêm mới/i }).first();
  if (await addCustomerBtn.isVisible()) {
    await addCustomerBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '04-khach-hang-them-moi.png') });
    await closeDrawer(page);
  }

  // Xem chi tiết khách hàng đầu tiên
  const viewCustomerBtn = page.locator('button:has-text("Xem"), button:has-text("Chi tiết"), .data-table tbody tr').first();
  if (await viewCustomerBtn.isVisible()) {
    await viewCustomerBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT_DIR, '05-khach-hang-chi-tiet-ho-so.png') });

    // Kiểm tra album ảnh da trong overview
    const albumSection = page.locator('.skin-album, .skin-dropzone, aside.customer-profile-column').first();
    if (await albumSection.isVisible()) {
      await albumSection.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(OUT_DIR, '06-khach-hang-tai-anh-da.png') });
    }
    await closeDrawer(page);
  }

  console.log('4. Khách đặt lịch (/customer-bookings)...');
  await page.goto('http://127.0.0.1:5173/customer-bookings');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '07-khach-dat-lich-danh-sach.png') });

  const addBookingBtn = page.getByRole('button', { name: /Tạo đặt lịch|Thêm mới|Đặt lịch/i }).first();
  if (await addBookingBtn.isVisible()) {
    await addBookingBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '08-khach-dat-lich-them-moi.png') });
    await closeDrawer(page);
  }

  console.log('5. Lịch hẹn (/appointments)...');
  await page.goto('http://127.0.0.1:5173/appointments');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '09-lich-hen-danh-sach.png') });

  const addApptBtn = page.getByRole('button', { name: /Tạo lịch hẹn|Đặt lịch hẹn|Thêm mới/i }).first();
  if (await addApptBtn.isVisible()) {
    await addApptBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '10-lich-hen-them-moi.png') });
    await closeDrawer(page);
  }

  console.log('6. Sản phẩm & dịch vụ (/products)...');
  await page.goto('http://127.0.0.1:5173/products');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '11-san-pham-dich-vu.png') });

  const addProdBtn = page.getByRole('button', { name: /Tạo sản phẩm|Thêm sản phẩm|Thêm mới/i }).first();
  if (await addProdBtn.isVisible()) {
    await addProdBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '12-tao-san-pham-dich-vu.png') });
    await closeDrawer(page);
  }

  console.log('7. Bán hàng & Hóa đơn (/invoices)...');
  await page.goto('http://127.0.0.1:5173/invoices');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '13-ban-hang-danh-sach.png') });

  const addInvoiceBtn = page.getByRole('button', { name: /Tạo hóa đơn|Thêm mới/i }).first();
  if (await addInvoiceBtn.isVisible()) {
    await addInvoiceBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '14-tao-hoa-don-ban-hang.png') });

    // Thêm 1 dòng sản phẩm/dịch vụ để xem chi tiết dòng hóa đơn
    const addLineBtn = page.getByRole('button', { name: /Thêm sản phẩm\s*\/\s*dịch vụ/i }).first();
    if (await addLineBtn.isVisible()) {
      await addLineBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, '15-hoa-don-chi-tiet-dong.png') });
    }
    await closeDrawer(page);
  }

  console.log('8. Liệu trình (/treatments)...');
  await page.goto('http://127.0.0.1:5173/treatments');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '16-the-lieu-trinh-danh-sach.png') });

  // Mở chi tiết 1 thẻ hoặc nút Thực hiện nếu có
  const execBtn = page.getByRole('button', { name: /Thực hiện/i }).first();
  if (await execBtn.isVisible()) {
    await execBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '17-lieu-trinh-thuc-hien.png') });
    await closeDrawer(page);
  }

  console.log('9. Nhập kho (/imports)...');
  await page.goto('http://127.0.0.1:5173/imports');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '18-nhap-kho-danh-sach.png') });

  const addImportBtn = page.getByRole('button', { name: /Tạo phiếu nhập|Thêm mới/i }).first();
  if (await addImportBtn.isVisible()) {
    await addImportBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '19-tao-phieu-nhap-kho.png') });
    await closeDrawer(page);
  }

  console.log('10. Tồn kho (/inventory)...');
  await page.goto('http://127.0.0.1:5173/inventory');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '20-ton-kho-danh-sach.png') });

  console.log('11. Phiếu chi (/expenses)...');
  await page.goto('http://127.0.0.1:5173/expenses');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '21-phieu-chi-danh-sach.png') });

  const addExpenseBtn = page.getByRole('button', { name: /Tạo phiếu chi|Thêm mới/i }).first();
  if (await addExpenseBtn.isVisible()) {
    await addExpenseBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '22-tao-phieu-chi.png') });
    await closeDrawer(page);
  }

  console.log('12. Ví khách hàng (/wallet)...');
  await page.goto('http://127.0.0.1:5173/wallet');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '23-vi-khach-hang-danh-sach.png') });

  const addWalletBtn = page.getByRole('button', { name: /Nạp ví|Thêm mới/i }).first();
  if (await addWalletBtn.isVisible()) {
    await addWalletBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '24-nap-vi-khach-hang.png') });
    await closeDrawer(page);
  }

  console.log('13. Thu công nợ (/debts)...');
  await page.goto('http://127.0.0.1:5173/debts');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '25-thu-cong-no-danh-sach.png') });

  const addDebtBtn = page.getByRole('button', { name: /Thu nợ|Thêm mới/i }).first();
  if (await addDebtBtn.isVisible()) {
    await addDebtBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, '26-tao-phieu-thu-no.png') });
    await closeDrawer(page);
  }

  console.log('14. Hồ sơ nhân sự (/staffs)...');
  await page.goto('http://127.0.0.1:5173/staffs');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '27-ho-so-nhan-su.png') });

  console.log('15. Công ca (/commissions)...');
  await page.goto('http://127.0.0.1:5173/commissions');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '28-cong-ca-nhan-vien.png') });

  console.log('16. Hoa hồng · tư vấn (/consultants)...');
  await page.goto('http://127.0.0.1:5173/consultants');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '29-hoa-hong-tu-van.png') });

  console.log('17. Báo cáo (/reports)...');
  await page.goto('http://127.0.0.1:5173/reports');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '30-bao-cao-kinh-doanh.png') });

  console.log('18. Chi nhánh (/branches)...');
  await page.goto('http://127.0.0.1:5173/branches');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '31-chi-nhanh.png') });

  console.log('19. Chức vụ (/roles)...');
  await page.goto('http://127.0.0.1:5173/roles');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '32-chuc-vu.png') });

  console.log('20. Tài khoản (/users)...');
  await page.goto('http://127.0.0.1:5173/users');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '33-tai-khoan.png') });

  console.log('Hoàn thành chụp toàn bộ màn hình ROSA thành công!');
  await browser.close();
}

capture().catch(err => {
  console.error('Lỗi chụp ảnh:', err);
  process.exit(1);
});
