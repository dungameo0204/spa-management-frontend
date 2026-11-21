# BÁO CÁO KIỂM THỬ TOÀN DIỆN GIAO DIỆN & CHỨC NĂNG (UI/UX & FUNCTIONAL TEST REPORT)

- **Môi trường:** `http://localhost:5173/`
- **Thời gian thực hiện:** 21/11/2026
- **Mục tiêu:** Chỉ kiểm thử và báo cáo lỗi (UI/UX, Responsive, Console/Network, Logic hiển thị, Phân quyền), **hoàn toàn không chỉnh sửa bất kỳ file mã nguồn nào của dự án**.
- **Tài khoản kiểm thử đã sử dụng:**
  - Quản trị (`MANAGER`): `3thang10` (`chị Hiển`)
  - Nhân viên (`STAFF`): `nvcs1` (`Lê Thị Xuân`)
- **Phạm vi kiểm thử:** 
  - Trang `/login`
  - Toàn bộ 18 route chức năng (`/`, `/customers`, `/customer-bookings`, `/invoices`, `/products`, `/appointments`, `/treatments`, `/imports`, `/inventory`, `/expenses`, `/debts`, `/staffs`, `/commissions`, `/consultants`, `/reports`, `/branches`, `/roles`, `/users`)
  - Route không tồn tại (`/nonexistent-test`)
  - Chế độ Sáng / Tối (Light / Dark mode)
  - Responsive đa thiết bị: Desktop (`1440×900`, `1280×800`), Tablet (`768×1024`), Mobile (`375×812`)
  - Modal, form validation và phân quyền RBAC giữa Manager và Staff.

---

## I. TỔNG QUAN KẾT QUẢ

- **Điểm tích cực:**
  - Ứng dụng tải nhanh trên Vite dev server (`HTTP 200`), SPA router mượt mà.
  - Chế độ Sáng / Tối (Dark mode) chuyển đổi đồng bộ giữa các trang.
  - Phân quyền (RBAC) cho tài khoản `STAFF` đã ẩn được 6 mục menu nhạy cảm và chặn truy cập trực tiếp qua URL.
- **Vấn đề phát hiện:**
  - Ghi nhận lỗi `HTTP 500` ở API xác thực `/api/auth/me` khiến văng ra màn hình lỗi vỡ layout.
  - Sai lệch số liệu trên Dashboard giữa text mô tả và số dòng thực tế hiển thị.
  - Route không tồn tại bị màn hình trắng (Blank screen) khi đã đăng nhập.
  - Nhiều lỗi UI đè chồng trên Mobile, thanh Bottom Nav thừa trên Desktop, viền đôi khi focus và lỗi copy-paste văn bản/validation.

---

## II. CÁC LỖI NGHIÊM TRỌNG & LOGIC CHỨC NĂNG (HIGH / CRITICAL)

### 1. API `/api/auth/me` trả về `HTTP 500` & Màn hình lỗi vỡ layout
- **Hiện tượng:** Khi người dùng điều hướng qua lại giữa nhiều trang liên tiếp (đặc biệt ghi nhận ở phiên `STAFF` khi chuyển giữa `/imports`, `/inventory`, `/products`), API `GET http://localhost:5173/api/auth/me` trả về lỗi `HTTP 500 Internal Server Error`.
- **Hệ quả:** Bấm nút **"Thử lại"** vẫn tiếp tục nhận mã 500, người dùng bị kẹt tại màn hình báo lỗi: `Chưa thể xác minh phiên đăng nhập — Yêu cầu không thành công (500).`
- **Lỗi UI đi kèm:** Màn hình lỗi này chưa có layout container, padding hay căn giữa — toàn bộ tiêu đề và 2 nút `"Thử lại"`, `"Đăng xuất"` dính sát mép trên cùng bên trái `(0, 0)`, font chữ rất to và bị gãy dòng thô kệch.

### 2. Sai lệch số liệu phân trang trên Dashboard (`Khách chưa đến`)
- **Hiện tượng:** Tại bảng **"Khách chưa đến"** trên Dashboard `/` (gặp ở cả tài khoản Quản trị và Nhân viên):
  - Dòng mô tả hiển thị: `Hiển thị 1 - 10 trong 67 lịch hẹn` (hoặc `1 - 10 trong 56 lịch hẹn` ở tài khoản Staff).
  - Nhưng thực tế bảng render hiển thị **20 dòng** (`pageSize = 20`, chia thành 4 trang cho 67 mục).

### 3. Trang trắng hoàn toàn (Blank screen) khi vào route không tồn tại lúc đã đăng nhập
- **Hiện tượng:** Khi đã đăng nhập và truy cập URL không tồn tại (ví dụ: `http://localhost:5173/nonexistent-test`):
  - Ứng dụng render màn hình trắng trơn, `body` hoàn toàn rỗng, không có trang 404, không có thông báo lỗi hay nút "Quay lại trang chủ".
  - *(Khi chưa đăng nhập thì ứng dụng chuyển hướng về `/login` bình thường).*

### 4. Hàng loạt request bị hủy (`net::ERR_ABORTED`) khi mount trang
- **Hiện tượng:** Khi chuyển giữa các route (`/`, `/customers`, `/invoices`, `/reports`, `/staffs`, ...), tab Network liên tục ghi nhận request `GET /api/branches?page=1&pageSize=100` (và một số API danh sách trang như `/api/staffs`) bị hủy (`net::ERR_ABORTED`) ngay khi khởi tạo do bị trigger trùng lặp hoặc re-render unmount/remount component.


---

## III. LỖI GIAO DIỆN & RESPONSIVE (UI / LAYOUT)

### 1. Mobile (`375×812`) — Header bị đè chồng chéo
- Ở các màn hình có dropdown lọc chi nhánh (`Tất cả chi nhánh`), dropdown bị đè chạm trực tiếp lên vòng tròn Avatar (`C`) ở góc phải (thấy rõ tại `/`, `/treatments`, `/consultants`, ...).
- Dòng chữ eyebrow `KHÔNG GIAN QUẢN LÝ` quá dài nên bị gãy đôi thành `KHÔNG GIAN QUẢN` / `LÝ`.
- Các tiêu đề trang dài như `Hoa hồng · tư vấn` bị ngắt dòng chật chội.

### 2. Thanh Bottom Navigation (`Điều hướng nhanh`) thừa trên Desktop
- Thanh điều hướng dưới đáy (`Tổng quan`, `Khách hàng`, `Khách đặt lịch`, `Bán hàng`, `Thêm`) xuất hiện cố định ở đáy màn hình ngay cả ở màn hình Desktop `1440×900` và `1280×800`.
- Trên Desktop đã có sẵn Sidebar bên trái, thanh đáy này vừa chiếm diện tích hiển thị của bảng dữ liệu, vừa bị lặp tính năng. Đặc biệt nút `Thêm` (`...`) chỉ mở lại đúng thanh Sidebar Drawer bên trái giống hệt nút menu hamburger ở góc trên.

### 3. Màn hình Đăng nhập (`/login`)
- **Viền đôi khi focus (Double Border):** Khi click vào ô `Tên đăng nhập` hoặc `Mật khẩu`, thẻ `<input>` bên trong tự hiển thị thêm viền bo tròn đè lên khung viền xanh của thẻ bọc bên ngoài. Viền này cắt ngang icon người dùng / ổ khóa và tạo khe hở mất cân đối trước icon con mắt Hiện/Ẩn mật khẩu.
- **Tràn chiều dọc (Vertical Overflow):** Tại màn hình `1280×800` và Mobile `375×812`, khối card đăng nhập cao hơn viewport làm xuất hiện thanh cuộn dọc không đáng có.
- **Lỗi ngắt dòng Tablet (`768×1024`):** Bố cục 50/50 làm cột hẹp: dòng tagline rớt chữ `"TRIỂN"` trơ trọi xuống dòng 2; tiêu đề `"Một ngày mới thật"` bị ngắt thành `"Một ngày mới"` / `"thật"`.
- **Accessibility & HTML:** Thẻ `<input>` thiếu thuộc tính `name` và `id`; thẻ `<label>` của ô Mật khẩu bọc luôn cả nút button `Hiện mật khẩu`.

### 4. Avatar và Lời chào không đồng bộ
- Tài khoản `3thang10` có họ tên là `chị Hiển`: Lời chào Dashboard ghi `Chào Hiển, một ngày thật đẹp!`, nhưng icon Avatar tròn ở góc phải lại hiển thị chữ cái **`C`** (lấy chữ cái đầu của từ `"chị"`). Ngoài ra Avatar này không có menu thả xuống để xem thông tin hay đăng xuất nhanh.
- Ở tài khoản Staff (`nvcs1`), header vẫn hiển thị chữ `KHÔNG GIAN QUẢN LÝ` (trong khi sidebar ghi `KHÔNG GIAN CỦA BẠN`) và góc phải chỉ hiện chữ tĩnh `Cơ sở của bạn` thay vì hiển thị tên chi nhánh thực tế (`ROSA CLINIC`).

### 5. Phím `Escape` không đóng được Sidebar Drawer
- Các dialog/modal (`Tạo hóa đơn`) đóng được bằng phím `Escape`, nhưng thanh Sidebar Drawer mở ra từ nút hamburger lại không phản hồi với phím `Escape`.

---

## IV. LỖI NỘI DUNG, FORM VALIDATION & TÍNH NHẤT QUÁN UX

### 1. Form Validation hiển thị tiếng Anh mặc định của trình duyệt
- Khi submit form trống trong các modal (`Tạo hóa đơn`, `Thêm lịch hẹn`, `Thêm khách hàng`, `Thêm tài khoản`), ứng dụng kích hoạt tooltip native của HTML5 bằng tiếng Anh: **`Please fill out this field.`** thay vì thông báo lỗi tiếng Việt đồng bộ với giao diện.
- Modal `Thêm tài khoản` (`/users`) thiếu dấu sao đỏ `*` ở các trường bắt buộc (`Tên đăng nhập`, `Họ tên`, `Mật khẩu`, `Chi nhánh`).

### 2. Nhãn nút và bố cục modal chưa hợp lý
- Các modal **Thêm mới** (`/customers`, `/appointments`, `/roles`, `/users`) lại đặt nhãn nút lưu là **`"Lưu thay đổi"`** (nhãn của form cập nhật/chỉnh sửa) thay vì `"Thêm mới"` hoặc `"Tạo mới"`.
- Trong modal `Thêm khách hàng`, cụm nút `Hủy` / `Lưu thay đổi` bị đặt ở lưng chừng form (nằm phía trên trường `Nguồn biết đến`).
- Trong modal `Thêm sản phẩm & dịch vụ` (`/products`), trường `Giá niêm yết` và `Giá bán` đang mặc định điền sẵn số `0` (người dùng phải xóa số 0 trước khi nhập giá).

### 3. Định dạng ngày tháng thiếu nhất quán
- Các bộ lọc bên ngoài bảng (`/invoices`, `/treatments`, ...) dùng định dạng `dd/mm/yyyy`.
- Nhưng trường chọn ngày trong modal `Thêm lịch hẹn` (`/appointments`) lại hiển thị định dạng `mm/dd/yyyy`.

cái này sửa hết thành `dd/mm/yyyy`. dùng cái component pick ngày mà mình tự tạo ra chứ ko dùng cửa trình duyệt

### 4. Lỗi lặp văn bản copy-paste ở nhiều trang
- Nhãn eyebrow `KHÔNG GIAN VẬN HÀNH` và phụ đề `Thông tin được đồng bộ trực tiếp từ spa của bạn.` bị dùng rập khuôn trên 9 trang khác nhau (`/staffs`, `/branches`, `/roles`, `/users`, `/commissions`, `/customers`, `/products`, `/appointments`, `/expenses`).
- Trang **Nhập kho** (`/imports`) và **Thu công nợ** (`/debts`) cùng hiển thị subtitle: `"Theo dõi giao dịch và chăm sóc khách hàng thật chỉn chu."` (hoàn toàn không ăn nhập với nghiệp vụ Nhập kho).
- Trang chỉ xem `/consultants` và tab `Giao dịch trong kỳ` ở `/reports` khi chưa có dữ liệu lại hiển thị: `"Thử từ khóa khác hoặc thêm bản ghi mới."` (trong khi trang không hề có nút thêm bản ghi).
- Nút `Xuất Excel` không thống nhất vị trí (nằm bên trái nút `Thêm mới` ở trang này, nhưng lại nằm bên phải bộ lọc ngày ở trang khác).

---

## V. KIỂM TRA PHÂN QUYỀN TÀI KHOẢN STAFF (`nvcs1`)

- **Sidebar & Chặn truy cập:** 
  - Tài khoản `STAFF` được ẩn đúng 6 mục menu nhạy cảm: `Công ca`, `Hoa hồng · tư vấn`, `Báo cáo`, `Chi nhánh`, `Chức vụ`, `Tài khoản`.
  - Nếu cố tình gõ trực tiếp URL các trang trên, hệ thống điều hướng bảo vệ về trang chủ `/` chính xác.
- **Vấn đề phân quyền cần rà soát nghiệp vụ:**
  - Trên các trang `/staffs`, `/products`, `/expenses`, `/debts`, tài khoản nhân viên `nvcs1` **vẫn nhìn thấy và bấm được các nút `"Thêm mới"` và `"Xuất Excel"`** (ví dụ: nhân viên có thể mở modal thêm nhân sự, thêm sản phẩm, tạo phiếu chi). Cần xác nhận lại xem role `STAFF` có được phép tạo mới các đối tượng này hay không để ẩn nút hoặc chặn ở backend.


  -cái nút xóa bộ lọc đang đè lên trên nút chọn khoảng ngày ở header trang liệu trình trên điện thoại, khi người dùng nhập ngafyvafo bộ lọc
