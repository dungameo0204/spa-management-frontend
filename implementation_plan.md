# Implementation Plan

## Overview

Xây dựng phần mềm quản lý spa bằng JavaScript với giao diện web responsive cao cấp và Progressive Web App (PWA) cài trực tiếp từ trình duyệt trên Android/iOS, không phát hành trên CH Play/App Store.

Hiện thư mục dự án chỉ có `docs/API_FRONTEND.md` (1.311 dòng), chưa có ứng dụng, manifest dependency hoặc bộ test; đây là kế hoạch tạo mới frontend, **không thay đổi backend**. Tài liệu API trong `docs/` là hợp đồng tích hợp; ưu tiên phần cập nhật phân trang ở đầu tài liệu (09/10/2026) nếu mâu thuẫn với phần tổng quan cũ. Giao diện tiếng Việt, tối ưu thao tác nhanh cho người quản lý spa 30–40 tuổi và nhân viên lễ tân/kỹ thuật; thẩm mỹ tinh tế, thân thiện, tương phản tốt, không mặc định mọi người dùng là nữ.

Chọn một ứng dụng React + Vite bằng JavaScript/JSX chạy chung trên desktop, Android, iOS; PWA có manifest, icon, service worker chỉ lưu tài nguyên tĩnh và trang báo mất kết nối, **không hỗ trợ thao tác nghiệp vụ offline**. Mọi giao dịch cần mạng và xác nhận từ API. Không xây MiniApp khách hàng, màn SUPER_ADMIN/tenant, tính năng push, thanh toán tự động, xuất báo cáo Excel/PDF hoặc upload ảnh vì API được cung cấp chưa mô tả luồng tương ứng. Những dữ liệu nhạy cảm/tài chính phải được phản ánh đúng nghiệp vụ backend.

## Types

JavaScript thuần; hợp đồng dữ liệu được khai báo bằng JSDoc trong `src/types/contracts.js`, kiểm tra đầu vào UI bằng schema form (nếu dùng thư viện, xem Dependencies) và kiểm tra response bắt buộc bằng các hàm normalize. Không thêm TypeScript.

- `AuthSession`: `{ token: string, user: { id: number, tenant_id: number, branch_id: number|null, username: string, fullname: string, system_role: 'MANAGER'|'STAFF' } }`; `SUPER_ADMIN` được nhận diện để từ chối truy cập ứng dụng spa thay vì hiển thị module sai quyền.
- `Permission`: danh sách khóa `branches.manage`, `roles.manage`, `products.view`, `products.manage`, `reports.view`, `users.manage`, `treatments.create`, `staffs.manage`, `customers.manage`, `appointments.manage`, `invoices.manage`, `inventory.manage`, `expenses.manage`, `wallet.manage`, `debts.manage`, `treatments.execute`, `bookings.view`, `commissions.view`; `products.view` dành cho MANAGER và STAFF, `products.manage` chỉ MANAGER. Ma trận trong `src/auth/permissions.js` bám theo route backend. Quyền trên UI không thay thế kiểm tra server.
- `PagedResult<T>` (JSDoc generic): `{ data: T[], total: number, page: number, pageSize: number, totalPages: number, message?: string }`; dùng cho các danh sách ở đầu tài liệu và `reports/details`; báo cáo tổng hợp nhân sự dùng `staffTotals` thay `data`. Kết quả rỗng hỗ trợ `totalPages: 0` hoặc response thực tế của backend.
- `ApiError`: `{ status: number, message: string, fields?: Record<string,string> }`; phân biệt 400, 401, 403, 404, 500/network; 403 do token hết hạn và 403 do thiếu quyền cần xử lý riêng theo ngữ cảnh (không tự xóa phiên chỉ vì thiếu quyền).
- `BranchContext`: `{ branchId: number|null, locked: boolean }`; MANAGER chọn tất cả/chi nhánh trong danh sách; STAFF cố định `user.branch_id`, không gửi branch khác khi backend bỏ qua tham số. Các giao dịch yêu cầu manager chỉ định một branch cụ thể trước khi gửi.
- `MoneyInput`: số nguyên VND không âm từ chuỗi người dùng nhập; định dạng tiền tách khỏi payload; `DECIMAL` từ API có thể là string, không chuyển sang float để cộng tổng/đối soát; dùng tổng từ backend. Ngày API dạng `YYYY-MM-DD`, datetime giữ nguyên theo quy ước API, hiển thị `vi-VN` theo múi giờ spa đã xác nhận, không suy ra ngày nghiệp vụ từ UTC của máy người dùng.
- `ProductDraft`: `name, images: string[]|null, description, benefits, price, unit, is_product, is_treatment_combo, default_sessions, session_unit, next_appointment_days, commissions: {role_id,commission_percent?,commission_fixed_amount?}[], inventory?: {branch_id,quantity}[]`; `inventory` chỉ gửi khi POST, không gửi khi PUT.
- `InvoiceDraft`: `customer_id, branch_id?, items: {product_id,quantity,unit_price?,discount_percent?,discount_amount?,consultants?: {staff_id,revenue_amount?,role_type?}[]}[], discount_percent?, discount_amount?, paid_amount?, wallet_used?, payment_method?, note?, invoice_date?`; khi PUT gửi toàn bộ `items`, không gửi tổng tiền do UI tự tính.
- `ReportRange`: `{startDate: string, endDate: string, branchId?: number}`; `ReportDetailType`: `invoices|debt_payments|wallet_logs|expenses|inventory_imports|commissions|consultants`; `revenue` dùng thẻ doanh thu/thu/chi/dòng tiền, không gộp `totalRevenue` với `receipts.total` hoặc coi `netCashFlow` là lợi nhuận.
- `AppointmentStatus`: chỉ để hiển thị/lọc `'Khách chưa đến'|'Khách đã đến'`; không gửi `status` ở POST/PUT vì trạng thái được tính khi GET.

## Files

Tất cả đường dẫn sau là đường dẫn tuyệt đối; tạo mới nếu chưa tồn tại. Không xóa hoặc sửa `d:\Project\SpaManagement\spa-management-frontend\docs\API_FRONTEND.md`.

| Đường dẫn | Mục đích/thay đổi |
|---|---|
| `d:\Project\SpaManagement\spa-management-frontend\package.json` | Scripts `dev`, `build`, `preview`, `lint`, `test`, `test:e2e`; dependency được xác minh tương thích trước khi cài. |
| `d:\Project\SpaManagement\spa-management-frontend\index.html` | Metadata tiếng Việt, theme-color, viewport/safe area, favicon/apple-touch-icon. |
| `d:\Project\SpaManagement\spa-management-frontend\vite.config.js` | React plugin, Vite PWA plugin, manifest và precache asset tĩnh; proxy local `/api` sang backend 5000 khi development. |
| `d:\Project\SpaManagement\spa-management-frontend\.env.example` | `VITE_API_BASE_URL` cho môi trường deploy; không chứa secrets. |
| `d:\Project\SpaManagement\spa-management-frontend\.gitignore` | Bỏ qua node_modules, dist, `.env*` trừ `.env.example`. |
| `d:\Project\SpaManagement\spa-management-frontend\eslint.config.js` | Quy tắc ESLint cho React/JSX. |
| `d:\Project\SpaManagement\spa-management-frontend\src\main.jsx` | Mount ứng dụng với providers router/query/auth. |
| `d:\Project\SpaManagement\spa-management-frontend\src\app\App.jsx` | Route tree lazy-load, login, authenticated layout, 404/403 và lỗi tải trang. |
| `d:\Project\SpaManagement\spa-management-frontend\src\app\routes.js` | Định nghĩa route/permission/menu dùng chung, route manager-only. |
| `d:\Project\SpaManagement\spa-management-frontend\src\types\contracts.js` | JSDoc API contracts nêu ở Types. |
| `d:\Project\SpaManagement\spa-management-frontend\src\auth\AuthProvider.jsx` | Phiên đăng nhập, login/logout, phục hồi phiên và thông báo hết phiên. |
| `d:\Project\SpaManagement\spa-management-frontend\src\auth\permissions.js` | Ma trận quyền, ràng buộc chi nhánh và quyền thao tác theo dòng. |
| `d:\Project\SpaManagement\spa-management-frontend\src\auth\RequireAuth.jsx` | Chặn route chưa đăng nhập hoặc sai role. |
| `d:\Project\SpaManagement\spa-management-frontend\src\api\client.js` | fetch JSON, Bearer token, base URL, lỗi chuẩn hóa, AbortSignal; không cache response chứa JWT. |
| `d:\Project\SpaManagement\spa-management-frontend\src\api\resources.js` | Endpoint wrappers cho auth, users, roles, branches, staffs, customers, products, appointments, bookings, invoices, imports, expenses, wallets, debts, treatments, reports. |
| `d:\Project\SpaManagement\spa-management-frontend\src\api\queryKeys.js` | Query key theo resource/filter/branch và invalidation sau mutation. |
| `d:\Project\SpaManagement\spa-management-frontend\src\utils\format.js` | Định dạng VND, ngày giờ, giá trị trống. |
| `d:\Project\SpaManagement\spa-management-frontend\src\utils\validation.js` | Rule số tiền, ngày, điện thoại, chi nhánh, mảng items và thông báo form. |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\AppShell.jsx` | Sidebar desktop, bottom navigation mobile, header, branch switcher, profile/logout, cài PWA. |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\DataList.jsx` | Bảng desktop chuyển thành thẻ mobile, tìm kiếm/filter, phân trang phía server, empty/loading/error/retry. |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\FormDrawer.jsx` | Form desktop drawer / mobile full-screen sheet, confirm thao tác phá hủy và feedback. |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\MoneyField.jsx` | Nhập/hiển thị VND không làm tròn sai; hỗ trợ bàn phím số mobile. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\LoginPage.jsx` | Đăng nhập và xử lý lỗi thông tin/phiên. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\DashboardPage.jsx` | MANAGER: thẻ báo cáo doanh thu/thu/chi/tiền ròng + lịch và thao tác nhanh; STAFF: lịch, khách chờ, lối tắt nghiệp vụ, không gọi `/api/reports`. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\AppointmentsPage.jsx` | Lịch theo ngày/tuần, chưa đến, ngày mai; CRUD; trạng thái chỉ đọc. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\CustomerBookingsPage.jsx` | Booking MiniApp chỉ đọc, lọc và hướng dẫn tạo lịch thủ công khi cần. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\CustomersPage.jsx` | Danh sách, hồ sơ, CRUD, ví/nợ và điều hướng giao dịch; không hiển thị reset-password public chưa an toàn. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\InvoicesPage.jsx` | Danh sách/chi tiết/tạo/sửa/xóa, dòng hàng, tư vấn, ví và cảnh báo nợ/tồn âm; staff hạn chế sửa/xóa theo ngày. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\TreatmentsPage.jsx` | Thẻ/liệu trình, lịch sử trừ buổi/hoàn tác/gán nhân viên, tạo thẻ thủ công chỉ MANAGER. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\InventoryImportsPage.jsx` | Phiếu nhập kho, danh sách/tạo/sửa/xóa; không giả định endpoint chi tiết theo ID. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\ExpensesPage.jsx` | Danh sách/chi tiết/CRUD chi phí. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\WalletPage.jsx` | Nạp ví/list/detail/sửa/xóa với cảnh báo hoàn tác số dư. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\DebtPaymentsPage.jsx` | Thu nợ, tra nợ còn lại theo invoice, hiển thị chi nhánh hạch toán và nơi thực thu. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\StaffsPage.jsx` | Hồ sơ nhân viên, lọc branch/role, CRUD theo phạm vi backend. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\CommissionsPage.jsx` | Dòng hoa hồng của cơ sở cho STAFF; tổng hợp toàn spa ở màn Reports MANAGER. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\BranchesPage.jsx` | MANAGER quản lý branch; che khóa API thanh toán và chỉ gửi khi người dùng chủ động sửa. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\RolesPage.jsx` | MANAGER CRUD chức vụ. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\ProductsPage.jsx` | MANAGER và STAFF cùng xem/tìm kiếm danh sách/chi tiết sản phẩm, dịch vụ; chỉ MANAGER thấy và dùng tạo/sửa/xóa/khôi phục cùng cấu hình commission/tồn đầu kỳ; điều chỉnh tồn qua phiếu nhập. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\UsersPage.jsx` | MANAGER CRUD tài khoản, khóa/khôi phục, gán branch cho STAFF. |
| `d:\Project\SpaManagement\spa-management-frontend\src\pages\ReportsPage.jsx` | MANAGER: kỳ/branch, summary, bảng chứng từ 7 loại lazy fetch, tổng hoa hồng/tư vấn và drill-down. |
| `d:\Project\SpaManagement\spa-management-frontend\src\styles\tokens.css` | Design tokens typography, màu, spacing, shadows, breakpoint, giảm chuyển động. |
| `d:\Project\SpaManagement\spa-management-frontend\src\styles\global.css` | Layout responsive và accessibility, light theme ưu tiên. |
| `d:\Project\SpaManagement\spa-management-frontend\public\icons\` | Icon PWA 192/512, maskable, Apple touch icon và favicon thiết kế thống nhất (SVG nguồn + PNG xuất thật). |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\InstallPrompt.jsx` | Nút cài khi browser hỗ trợ, hướng dẫn Safari iOS chia sẻ → Thêm vào Màn hình chính. |
| `d:\Project\SpaManagement\spa-management-frontend\src\components\OfflineNotice.jsx` | Báo offline, khóa submit, retry khi có mạng; tránh hứa hẹn đồng bộ ngầm. |
| `d:\Project\SpaManagement\spa-management-frontend\src\test\setup.js` | Thiết lập test UI / fake API; không dùng dữ liệu khách thực. |
| `d:\Project\SpaManagement\spa-management-frontend\tests\e2e\` | E2E luồng đăng nhập, phân quyền, desktop/mobile, PWA (file từng flow). |
| `d:\Project\SpaManagement\spa-management-frontend\README.md` | Chạy local, cấu hình API/HTTPS, cài trên Android/iOS, scope offline và quy tắc deploy SPA. |

### Bản thiết kế giao diện và điều hướng

- Ngôn ngữ hình ảnh: **spa sang trọng, điềm tĩnh**; nền kem sáng `#F7F5F1`, bề mặt trắng ngà `#FFFEFC`, chữ mực nâu đậm `#302E2B`, xanh lá sage sâu `#315E50` (CTA chính), vàng champagne `#C7A870` (nhấn), đỏ cảnh báo `#B3444B` (nợ/lỗi); kiểm tra tương phản WCAG AA trước khi cố định mã màu. Typography dùng font hệ thống ưu tiên chữ Việt (nếu có font web thì tải tối ưu), tiêu đề 24–32px, thân 15–16px, số tiền 18–28px dạng tabular; khoảng trắng thoáng, góc 12–18px, icon rõ nghĩa; không dùng màu làm dấu hiệu duy nhất.
- Desktop ≥ 1024px: sidebar 248px gồm Tổng quan, Lịch hẹn, Khách hàng, Bán hàng, Vận hành, Nhân sự, Quản trị/Báo cáo theo role; header 64px có chi nhánh, tìm kiếm theo màn, hồ sơ; dashboard lưới 4 KPI, lịch ngày, danh sách cần xử lý, bộ lọc sticky. Màn danh sách: tiêu đề + nút tạo, filter, bảng có hành động cuối dòng; form ở drawer tối đa 640px; đơn hàng ở trang rộng hai cột (dòng hàng bên trái, tổng/thanh toán bên phải).
- Mobile 320–767px: topbar gọn, bottom tabs `Tổng quan`, `Lịch hẹn`, `Khách hàng`, `Bán hàng`, `Thêm` (các module khác trong Thêm theo quyền); nội dung dùng card thay bảng, filter trong bottom sheet, tạo mới là nút nổi khi phù hợp, form toàn màn hình với CTA cố định trên safe area. Không đưa nút xóa gần nút xác nhận; vùng chạm tối thiểu ~44px, keypad số cho tiền; tránh scrollbar ngang.
- Tablet 768–1023px: menu thu gọn/drawer, lưới KPI 2 cột; giữ bố cục tạo đơn rõ ràng. Màn thiếu dữ liệu có minh họa nhẹ + CTA; skeleton tải, trạng thái lỗi có nút thử lại, toast thành công và dialog xác nhận xóa/hoàn tác kèm hậu quả tiền/tồn kho.
- Vai trò: MANAGER có Chi nhánh, Chức vụ, Sản phẩm/Dịch vụ (đầy đủ CRUD), Báo cáo, Tài khoản và tạo thẻ liệu trình thủ công. STAFF **có menu Sản phẩm/Dịch vụ** để xem/tìm kiếm danh sách, xem chi tiết và tồn kho của chi nhánh mình; không có nút tạo/sửa/xóa/khôi phục sản phẩm, không gọi POST/PUT/DELETE/PATCH `/api/products`. STAFF không thấy menu/route/request của các mục quản trị còn lại, chỉ thao tác nghiệp vụ theo branch. STAFF vẫn có thể xem dòng commission theo endpoint riêng; không gọi reports. Chọn chi nhánh manager lưu trạng thái theo phiên, mọi bộ lọc và cache gắn branch, reset page khi đổi branch; staff không có switcher.

## Functions

Các hàm mới (file và chữ ký dự kiến; thay đổi tên chỉ khi kiểm chứng thư viện/API yêu cầu):

| Hàm | File | Mục đích |
|---|---|---|
| `request(path, { method = 'GET', body, query, signal } = {})` | `src/api/client.js` | Tạo URL an toàn, Bearer token, parse JSON/message, lỗi mạng/status và hủy request. |
| `normalizePagedResponse(response)` | `src/api/client.js` | Lấy `data/total/page/pageSize/totalPages`, không coi `data.length` là `total`. |
| `login({ username, password })`, `logout()` | `src/auth/AuthProvider.jsx` | Gọi auth/login và xóa phiên/query cache khi thoát. |
| `canAccess(user, permission)` | `src/auth/permissions.js` | Kiểm tra role theo ma trận. |
| `resolveBranch(user, selectedBranchId)` | `src/auth/permissions.js` | STAFF khóa branch token, MANAGER lọc/chọn branch hợp lệ. |
| `canEditSameDay(record, now, spaTimeZone)` | `src/auth/permissions.js` | Hint UI cho hạn chế sửa/xóa invoice/import của STAFF; backend quyết định cuối cùng theo ngày tạo trên server, tránh tự cho phép dựa chỉ trên ngày hóa đơn/ngày nhập. |
| `listResource(resource, filters, pagination)`, `getResource(resource, id)` | `src/api/resources.js` | GET theo map endpoint và các query được hỗ trợ; không gọi GET detail cho imports. |
| `createResource(resource, body)`, `updateResource(resource, id, body)`, `deleteResource(resource, id)`, `restoreResource(resource, id)` | `src/api/resources.js` | Gửi đúng URL/HTTP verb; chỉ restore với resources có endpoint restore. |
| `getRemainingDebt(invoiceId)` | `src/api/resources.js` | Kiểm tra nợ còn lại ngay trước khi thu; không tự tính từ `customers.total_debt`. |
| `getRevenue(range)`, `getReportDetails(type, range, page, pageSize, staffId)`, `getStaffTotals(kind, range, page, pageSize, staffId)` | `src/api/resources.js` | Chỉ MANAGER; gửi khoảng ngày bắt buộc; lazy-load tab và tổng nhân viên. |
| `executeTreatment(payload)`, `assignTreatmentStaffs(historyId, staffs)`, `undoTreatmentExecution(historyId)` | `src/api/resources.js` | Các thao tác trừ/hoàn buổi, đồng bộ staff. |
| `formatCurrency(value)`, `formatSpaDate(value, timeZone)`, `parseMoneyInput(text)` | `src/utils/format.js` | Định dạng VND và ngày giờ đúng, báo invalid thay vì làm tròn âm thầm. |
| `validateInvoiceDraft(draft)`, `validateProductDraft(draft)`, `validateDateRange(range)` | `src/utils/validation.js` | Kiểm tra client sớm; chấp nhận backend quyết toán và lỗi 400 từ server. |
| `usePagedResource(resource, filters, page, pageSize)` | `src/api/resources.js` | Hook query phân trang; reset page khi đổi filter, abort request cũ, invalidate theo mutation. |

Không có hàm cũ cần sửa/xóa vì chưa có source frontend.

## Classes

Không cần class, inheritance hoặc singleton state tự viết; React function components + hooks, hàm thuần cho API, permission và validation. Không có class hiện hữu để sửa/xóa.

## Dependencies

- Runtime dự kiến: `react`, `react-dom`, `react-router-dom` (SPA/guards), `@tanstack/react-query` (server state, phân trang/cache), `lucide-react` (icon nhất quán). Form dùng React state và hàm validation thuần ở giai đoạn đầu, không thêm thư viện UI cỡ lớn; CSS variables + CSS modules/CSS có cấu trúc cho giao diện tùy biến.
- Dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` (manifest/service worker), `eslint`, `eslint-plugin-react-hooks`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `playwright` (E2E browser). Chọn phiên bản tương thích Node hiện có (`v22.19.0`) và kiểm chứng peer dependencies trước khi cài; pin bằng lockfile khi thực thi. Không có phiên bản/package sẵn trong repo cần nâng cấp.
- Base API từ biến môi trường; dev proxy tránh CORS khi local, production dùng HTTPS và CORS/backend phù hợp. Không đưa khóa thanh toán, JWT hay `.env` chứa secrets vào bundle/service-worker cache. PWA chỉ precache HTML/CSS/JS/icons và trang offline an toàn; `/api/*` network-only; dữ liệu khách/thu chi không lưu offline.
- Giới hạn bảo mật chưa giải quyết chỉ bằng frontend: JWT trong browser chịu rủi ro XSS, cần CSP, escape nội dung, tránh `dangerouslySetInnerHTML`; phương án cookie HttpOnly/BFF cần thay đổi backend ngoài phạm vi. Việc reset mật khẩu khách qua API public chưa có OTP không được đưa vào UI; cần backend xác minh mới mở tính năng.
- Quyền `/api/products` được chủ sản phẩm xác nhận: MANAGER xem và thao tác CRUD; STAFF xem danh sách/chi tiết qua GET nhưng không thêm/sửa/xóa/khôi phục. Tồn kho trong GET của STAFF chỉ thuộc branch token, MANAGER xem mọi branch. Tiêu đề chung mục products trong tài liệu ghi MANAGER nhưng chi tiết GET ghi cả STAFF: theo xác nhận này triển khai route `products.view` cho cả hai và `products.manage` chỉ MANAGER; kiểm tra GET bằng token STAFF trong thử nghiệm tích hợp để phát hiện sớm trường hợp backend thực tế trả 403. Nếu 403, cần chỉnh quyền GET ở backend, không lách kiểm tra bằng UI.

## Testing

- Unit: `src/auth/permissions.test.js`, `src/api/client.test.js`, `src/utils/format.test.js`, `src/utils/validation.test.js`; kiểm tra role matrix (STAFF được products.view, không được products.manage), STAFF bị khóa branch, bearer/401/403/400, phân trang/reset filter, decimal string/tiền Việt, ngày giờ và dữ liệu lỗi.
- Component: `src/components/DataList.test.jsx`, `src/pages/ProductsPage.test.jsx`, `src/pages/InvoicesPage.test.jsx`, `src/pages/ReportsPage.test.jsx`, `src/components/InstallPrompt.test.jsx`; mock API cho loading/empty/error, role, form và màn mobile; kiểm tra màn product STAFF chỉ đọc và chỉ hiển thị tồn branch token, không dùng dữ liệu thật.
- E2E tại `tests/e2e/`: login/logout/hết token; STAFF xem được danh sách/chi tiết sản phẩm nhưng không thể kích hoạt tạo/sửa/xóa/khôi phục và không phát sinh request ghi `/api/products`, STAFF không thấy/không vào các routes manager khác và không gọi reports; MANAGER tạo chi nhánh/role/product và xem reports; phân trang và đổi filter; invoice/thu nợ/hoàn tác với lỗi nghiệp vụ; kiểm tra responsive 320/390/768/1440px, touch target, keyboard; kiểm tra manifest/icons/service worker và hướng dẫn cài iOS. Mock network cho CI; kiểm thử tích hợp thật khi có backend, dữ liệu test/tenant test và base URL phù hợp.
- Kiểm thử PWA trên thiết bị thật: Chrome Android cài từ browser; Safari iOS dùng chia sẻ → Thêm vào Màn hình chính; vào app không mạng chỉ thấy shell/thông báo, không được tạo giao dịch offline; đăng xuất xóa cache query. Kiểm tra Lighthouse/a11y và thiết bị máy yếu, bật reduced-motion, voiceover/talkback ở luồng chính.
- Lệnh nghiệm thu sau triển khai: `npm ci`, `npm run lint`, `npm test -- --run`, `npm run build`, `npm run test:e2e` (cấu hình CI trình duyệt khi triển khai); thử `npm run dev` với API thật hoặc mock, `npm run preview` qua HTTPS để kiểm PWA. Chưa thể chạy build/test hiện tại do chưa có source/package.json.

## Implementation Order

1. Khởi tạo Vite/React JS, dependency/lockfile, cấu hình env/dev proxy, ESLint/Vitest/Playwright; tạo README mô tả ranh giới backend/PWA.
2. Tạo design tokens, global CSS, icon PWA, HTML metadata, Vite PWA manifest + service worker cache asset tĩnh; cấu hình HTTPS deploy/SPA fallback.
3. Tạo API client, contracts, query keys, helper normalize pagination/money/date, validation và unit tests; đối chiếu endpoint và HTTP verb theo `docs/API_FRONTEND.md`.
4. Xây auth provider, guarded routing, permission map, branch context và tests quyền; tách products.view (MANAGER/STAFF) và products.manage (chỉ MANAGER), xác minh GET `/api/products` với token STAFF trước khi làm flow bán hàng staff.
5. Xây AppShell responsive, DataList, FormDrawer, MoneyField, InstallPrompt, OfflineNotice và kiểm tra keyboard/mobile/safe area.
6. Xây login, dashboard phân quyền, appointments, bookings, customers và staffs; tích hợp paging/filter/empty/error/CRUD.
7. Xây màn products dùng chung: STAFF chỉ đọc, MANAGER CRUD; roles/branches/users chỉ MANAGER; tạo phiếu nhập, chi phí; đảm bảo các quy tắc tồn kho và che payment secrets.
8. Xây invoices, wallet, debt payments, treatments/commissions với xác nhận tác động dữ liệu, định dạng tiền, retry/invalidation; không hứa UI có quyền vượt backend.
9. Xây báo cáo MANAGER (khoảng ngày bắt buộc, thẻ tổng quan, chứng từ lazy tabs, commissions/consultants) và phân biệt rõ doanh thu, dòng tiền, phân bổ tư vấn.
10. Bổ sung E2E, kiểm tra build/lint/unit, kiểm tra backend thật ở tenant test, responsive và cài PWA Android/iOS; sửa lỗi tích hợp, tài liệu sử dụng và triển khai.