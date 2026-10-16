# XULY SPA
## Hướng dẫn sử dụng, danh mục tính năng và kịch bản video demo

Tài liệu bàn giao cho người vận hành và đội sản xuất video. Phiên bản ứng dụng: 0.1.0. Ngày biên soạn: 16/10/2026. Nội dung đối chiếu giao diện và luồng xử lý đang có trong mã nguồn; dữ liệu minh họa bên dưới là giả lập, không phải số liệu kinh doanh thật.

## 1. Giới thiệu sản phẩm

**Tên giới thiệu:** Xuly Spa — Phần mềm quản lý Spa.

**Thông điệp đề xuất:** Quản lý gọn gàng, chăm sóc khách hàng chỉn chu.

Xuly Spa tập trung các công việc hằng ngày: quản lý khách hàng, lịch hẹn, bán sản phẩm và dịch vụ, theo dõi thẻ liệu trình, ghi nhận nhân viên thực hiện, quản lý ví và công nợ, nhập kho, phiếu chi và báo cáo kinh doanh. Người quản lý có thể xem dữ liệu theo cơ sở; nhân viên thao tác trong phạm vi được phân quyền.

**Nhận diện:** logo hoa sen vàng trên nền xanh ngọc, giao diện tiếng Việt, hỗ trợ giao diện sáng và tối. Khi dựng video, giữ nguyên tỷ lệ logo, không kéo méo hoặc thay chữ trong biểu tượng. Logo vector gốc ở `public/icons/icon.svg`; bản PNG ở `public/icons/icon-512.png`.

**Đối tượng phù hợp để giới thiệu:** chủ spa, người quản lý cơ sở, lễ tân, nhân viên bán hàng và bộ phận theo dõi vận hành. Khả năng đáp ứng quy mô lớn cần đánh giá bằng triển khai và dữ liệu thực tế, không suy ra từ bản demo.

## 2. Cài đặt và mở ứng dụng

### 2.1. App Windows

1. Chuẩn bị máy Windows x64, backend của hệ thống và cơ sở dữ liệu đã cấu hình.
2. Mở file `Xuly-Spa-0.1.0-portable.exe`. Bản portable không yêu cầu chạy trình cài đặt; lần mở có thể mất thời gian giải nén.
3. App mở cửa sổ riêng với logo và tên Xuly Spa. Cửa sổ mặc định phóng lớn để dễ thao tác và quay màn hình.
4. Backend mặc định là `http://127.0.0.1:5000`. Nếu dùng backend trên máy khác, cấu hình `XULY_API_BASE_URL` trước khi mở app; xem tài liệu MỞ-APP trong bộ bàn giao.
5. Đăng nhập bằng tài khoản đã được cấp. Không có tài khoản/mật khẩu mặc định được nhúng trong app.

App Windows chỉ đóng gói giao diện và proxy kết nối API, không chứa sẵn MySQL hoặc backend. Không gọi đây là bản “offline hoàn toàn”. Bản đóng gói chưa có chữ ký số; Windows có thể cảnh báo. Chỉ sử dụng file từ nguồn tin cậy, không tắt bảo vệ hệ thống để chạy file không rõ nguồn.

### 2.2. Trình duyệt và điện thoại

Giao diện có thể triển khai thành website. Trên điện thoại, website cần cấu hình HTTPS phù hợp để cài dưới dạng PWA. Tùy trình duyệt và điều kiện cài đặt, dùng nút cài ứng dụng hoặc chức năng thêm vào màn hình chính. Đây không phải ứng dụng đã phát hành trên App Store/Google Play. Dữ liệu nghiệp vụ vẫn yêu cầu kết nối API; lưu giao diện tĩnh không đồng nghĩa làm giao dịch offline.

### 2.3. Đăng nhập, đăng xuất và giao diện

1. Nhập tên đăng nhập và mật khẩu rồi bấm **Đăng nhập**.
2. Dùng biểu tượng con mắt để hiện/ẩn mật khẩu nếu cần; không quay cảnh lộ mật khẩu.
3. Dùng menu bên trái trên máy tính; trên màn hình nhỏ mở menu hoặc thanh điều hướng nhanh.
4. Bấm **Giao diện sáng/Giao diện tối** để đổi chế độ.
5. Dùng **Đăng xuất** khi kết thúc, đặc biệt trên máy dùng chung. Phiên đăng nhập có thể được lưu trên thiết bị; không xem việc đóng cửa sổ là đăng xuất.

## 3. Vai trò và chi nhánh

### Quản lý — MANAGER

- Chọn tất cả hoặc một cơ sở ở thanh trên để xem các màn hình có hỗ trợ lọc theo chi nhánh.
- Truy cập báo cáo, công ca, doanh số tư vấn, chi nhánh, chức vụ và tài khoản.
- Cấu hình công ca theo vai trò cho sản phẩm/dịch vụ và tạo thẻ liệu trình thủ công.
- Khi tạo giao dịch hoặc ghi nhận buổi, chọn cơ sở cụ thể nếu giao diện yêu cầu. “Tất cả chi nhánh” là phạm vi xem, không phải một chi nhánh để ghi giao dịch.

### Nhân viên — STAFF

- Làm các thao tác được giao như khách hàng, lịch hẹn, hóa đơn, liệu trình, nhập kho, ví, thu nợ, phiếu chi và hồ sơ nhân sự theo phạm vi backend cho phép.
- Không có menu báo cáo quản lý, công ca tổng hợp, doanh số tư vấn tổng hợp, quản lý tài khoản/chi nhánh/chức vụ.
- Danh mục sản phẩm/dịch vụ hiện có giao diện thêm/sửa cho STAFF; cấu hình commission chỉ dành cho MANAGER. Không dùng tài liệu cũ để quảng cáo STAFF chỉ có quyền xem danh mục.
- Quyền sửa/xóa hóa đơn của STAFF có giới hạn theo ngày tạo và chi nhánh. Backend kiểm tra quyết định cuối cùng.

**Quan trọng:** việc ẩn menu không thay thế kiểm soát quyền trên máy chủ. Một số danh sách như thẻ liệu trình phục vụ tra cứu liên cơ sở; cơ sở thực hiện buổi là thông tin riêng, không nên diễn giải bộ lọc cơ sở là cô lập mọi dữ liệu trên mọi trang.

## 4. Bản đồ các màn hình

| Nhóm | Màn hình | Mục đích |
| --- | --- | --- |
| Làm việc | Tổng quan | Chỉ số trong tháng, thao tác nhanh, thẻ trong ngày và khách cần quan tâm |
| Làm việc | Khách hàng | Hồ sơ, ví, công nợ và tổng quan giao dịch khách |
| Làm việc | Lịch hẹn | Tạo và tra cứu lịch chăm sóc |
| Làm việc | Bán hàng | Lập hóa đơn sản phẩm/dịch vụ và thanh toán |
| Vận hành | Sản phẩm & dịch vụ | Danh mục, giá, combo, cấu hình công ca |
| Vận hành | Liệu trình | Số buổi, lịch sử, nhân viên thực hiện |
| Vận hành | Booking từ khách | Xem yêu cầu đặt lịch mà backend đã tiếp nhận |
| Vận hành | Nhập kho / Tồn kho | Phiếu nhập và số lượng theo cơ sở |
| Vận hành | Phiếu chi | Ghi nhận các khoản chi |
| Vận hành | Ví khách hàng | Nạp ví và tiền thưởng |
| Vận hành | Thu công nợ | Thu tiền còn thiếu của hóa đơn |
| Nhân sự | Hồ sơ nhân sự | Danh sách nhân viên và chức vụ |
| Nhân sự | Công ca | Tổng hợp tiền công và chi tiết ca |
| Nhân sự | Hoa hồng · tư vấn | Doanh số phân bổ cho người tư vấn |
| Quản lý | Báo cáo | Doanh thu, thực thu, tổng chi, dòng tiền và Excel |
| Quản lý | Chi nhánh / Chức vụ / Tài khoản | Thiết lập đơn vị, vai trò nghề nghiệp và tài khoản đăng nhập |

Các danh sách thường có ô tìm kiếm, phân trang, mở chi tiết bằng cách chọn dòng. Bộ lọc ngày chỉ xuất hiện tại các màn hình có hỗ trợ. Kết quả tìm kiếm phụ thuộc endpoint; không khẳng định mọi ô tìm kiếm đều tìm toàn bộ trường dữ liệu.

## 5. Thiết lập ban đầu

Thứ tự khuyến nghị: **Chi nhánh → Chức vụ → Hồ sơ nhân viên → Tài khoản → Sản phẩm/dịch vụ → Khách hàng → Giao dịch**.

### 5.1. Chi nhánh

Quản lý vào **Chi nhánh**, thêm tên, địa chỉ và thông tin ngân hàng nếu dùng. Giao diện có lựa chọn cổng thanh toán nhưng điều đó không có nghĩa mọi tích hợp đã được kích hoạt. Chỉ giới thiệu tính năng thanh toán tự động sau khi backend, khóa dịch vụ và luồng đối soát đã được cấu hình/kiểm tra thật.

### 5.2. Chức vụ và hồ sơ nhân sự

1. Vào **Chức vụ**, thêm các vai trò nghề nghiệp như Kỹ thuật viên, Tư vấn, Chăm sóc khách hàng theo cách tổ chức của spa.
2. Vào **Hồ sơ nhân sự**, bấm thêm, nhập họ tên, số điện thoại, địa chỉ, chức vụ; quản lý chọn chi nhánh khi cần.
3. Mở một hồ sơ để xem/sửa thông tin theo quyền.

Hồ sơ nhân viên dùng để phân công và tính công; tài khoản đăng nhập là đối tượng khác. Tạo hồ sơ không tự đồng nghĩa đã tạo tài khoản đăng nhập.

### 5.3. Tài khoản

Quản lý vào **Tài khoản**, tạo tên đăng nhập, họ tên, mật khẩu, chọn MANAGER hoặc STAFF. STAFF cần được gán chi nhánh. Không chia sẻ một tài khoản cho nhiều người khi cần truy vết thao tác. Không đưa thông tin tài khoản thật vào video hoặc file công khai.

### 5.4. Sản phẩm và dịch vụ

1. Vào **Sản phẩm & dịch vụ** → thêm mới.
2. Nhập tên, phân loại **Sản phẩm** hoặc **Dịch vụ**, giá, đơn vị; có thể bổ sung mô tả, công dụng.
3. Với combo dịch vụ, bật **Là liệu trình** và nhập số buổi tạo tự động mỗi đơn vị.
4. Với dịch vụ thường không phải combo, không cần ô số buổi mặc định; hệ thống gửi giá trị chuẩn là 1.
5. Khai báo số ngày tới lần hẹn kế tiếp nếu nghiệp vụ và backend sử dụng.
6. Quản lý cấu hình công ca theo phần dưới rồi lưu.

Dịch vụ không hiển thị phần tồn kho hàng hóa. Sản phẩm vật lý giữ phần tồn theo cơ sở. Khi chỉnh sửa, chờ dữ liệu chi tiết tải xong trước khi sửa để tránh ghi đè cấu hình chưa tải đủ.

### 5.5. Công ca theo vai trò và bậc giá

Quản lý mở phần cấu hình công ca trong sản phẩm/dịch vụ, chọn vai trò được hưởng công, thêm mức cố định hoặc phần trăm theo giao diện. Có thể dùng một bậc đơn giản hoặc nhiều bậc theo giá.

- Khoảng giá sử dụng quy tắc **[từ giá, đến giá)**: nhận cận dưới, không nhận cận trên.
- Mỗi vai trò cần bao phủ từ 0 tới bậc cuối không giới hạn; các bậc không hở hoặc chồng lấn.
- Ví dụ thiết lập khoảng 0–1.000.000 và từ 1.000.000 trở lên: giá đúng 1.000.000 thuộc bậc thứ hai.
- Kiểm tra mức cố định/phần trăm hợp lệ trước khi lưu. Tiền công thực tế được backend tính theo giá gốc tính công, loại dịch vụ, số lượng tính công và quy tắc API; không coi số nhập ở đây là tiền lương thực trả.
- Cấu hình commission không được gửi từ thao tác STAFF. Khi xóa hết bậc, thao tác quản lý có thể gửi danh sách bậc rỗng để bỏ cấu hình tier.

## 6. Quản lý khách hàng

1. Vào **Khách hàng**, tìm theo thông tin được API hỗ trợ.
2. Thêm họ tên, số điện thoại, địa chỉ, ghi chú rồi lưu.
3. Chọn dòng khách để xem hồ sơ, số dư ví, tổng công nợ và khu vực tổng quan khách.
4. Dùng các mục giao dịch/thẻ trong tổng quan để tra cứu dữ liệu liên quan khi có.
5. Chỉnh sửa thông tin khi cần. Chức năng xóa/khôi phục chỉ dùng khi giao diện và backend cho phép; không dùng xóa khách để thay thế xử lý chứng từ sai.

Khi lập hóa đơn có thể tạo khách ngay trong ô chọn khách rồi tiếp tục lập đơn. Nếu hệ thống báo đã tạo khách nhưng chưa tải được chi tiết, tìm lại khách trước khi bấm tạo lần nữa.

## 7. Lịch hẹn và booking

### 7.1. Tạo lịch hẹn

Vào **Lịch hẹn** → thêm mới → chọn khách → chọn ngày → chọn cơ sở nếu là quản lý → nhập ghi chú → lưu. Dùng tìm kiếm, bộ lọc ngày và mở chi tiết để xem/sửa/xóa theo quyền.

Form hiện nhập **ngày**, không phải bộ chọn giờ hẹn chi tiết; frontend gửi giờ quy ước 09:00:00. Không quay lời giới thiệu về quản lý từng khung giờ/phòng nếu chưa có giao diện đó. Khu tổng quan có danh sách lịch ngày mai và khách chưa đến để nhân viên chủ động liên hệ; không đồng nghĩa hệ thống tự gửi SMS/Zalo.

### 7.2. Booking từ khách

Màn **Booking từ khách** cho xem danh sách/chi tiết yêu cầu đã được backend tiếp nhận, với thông tin khách, dịch vụ, ngày đặt, trạng thái và cơ sở. Giao diện này là **chỉ đọc**; không quảng cáo đã có luồng duyệt/chuyển đổi booking tự động hay trang đặt lịch công khai trong chính app quản trị nếu chưa triển khai riêng.

## 8. Bán hàng và tạo hóa đơn

### 8.1. Quy trình thông thường

1. Vào **Bán hàng** → **Tạo hóa đơn**.
2. Chọn khách hàng; kiểm tra số dư ví và công nợ đang hiển thị.
3. Quản lý chọn cơ sở, chọn ngày hóa đơn nếu cần; để trống ngày khi muốn máy chủ lấy thời điểm hiện tại.
4. Bấm **Thêm sản phẩm / dịch vụ**, tìm và chọn mặt hàng.
5. Nhập số lượng, đơn giá. Giá danh mục là giá gợi ý và có thể được chỉnh theo quyền/kiểm tra backend.
6. Nhập chiết khấu theo phần trăm hoặc tiền cho từng dòng. Hai ô được đồng bộ, không phải hai lần giảm cộng dồn cùng một thao tác.
7. Có thể thêm nhiều dòng cùng một dịch vụ, kể cả cùng giá hoặc khác giá/số lượng. Mỗi dòng vẫn là dòng bán riêng.
8. Nếu có nhân viên tư vấn, mở **Tư vấn**, chọn người và phân bổ doanh số; bấm **Xong**.
9. Nhập giảm toàn hóa đơn nếu có; kiểm tra tổng sau giảm.
10. Chọn tiền dùng ví, nhập tiền khách trả ngoài ví, phương thức thanh toán và ghi chú.
11. Có thể chọn in sau lưu, chọn khổ giấy, rồi bấm **Lưu hóa đơn**.

### 8.2. Nhân viên tư vấn

Nếu chỉ một người tư vấn, doanh số phân bổ mặc định theo giá trị dòng sau giảm. Nếu nhiều người, chia tiền theo từng người; tổng không vượt giá trị sau giảm của dòng. Đây là doanh số được ghi nhận cho người tư vấn, không tự đồng nghĩa phần trăm hoa hồng hay tiền lương phải trả.

### 8.3. Làm ngay hoặc chưa làm

- Dịch vụ được chọn có tùy chọn **Chưa làm**. Khi chưa bật tùy chọn này, dòng có thể ghi nhận làm ngay; chọn nhân viên thực hiện theo vai trò.
- Nếu khách chỉ mua để dùng sau, bật **Chưa làm**. Backend vẫn tạo thẻ đủ điều kiện nhưng frontend không thực hiện buổi ngay.
- Khi POST hóa đơn thành công, backend trả mapping từng dòng bằng `request_index`, `invoice_item_id`, `treatment_id`; frontend dùng đúng thẻ của dòng được chọn. Hai dòng cùng dịch vụ không bị ghép chung chỉ vì trùng tên hoặc mã sản phẩm.
- Một dòng dịch vụ thường tạo một thẻ 1 buổi dù số lượng bán lớn hơn 1. Combo tạo số buổi bằng **số lượng × số buổi mặc định**. Hàng hóa thường không tạo thẻ.
- “Làm ngay” ghi nhận một buổi trên mỗi thẻ được chọn, không tự dùng hết số buổi combo.

### 8.4. Ví, tiền khách trả và công nợ

**Ví đã dùng + tiền trả ngoài ví + công nợ còn lại = tổng hóa đơn.** Không nhập tiền ví thêm một lần nữa vào ô khách trả ngoài ví.

Ví dụ đơn 1.000.000 đ, dùng ví 200.000 đ, khách trả ngoài ví 500.000 đ thì còn nợ 300.000 đ. Số tiền ví không được vượt số dư hoặc tổng đơn; tiền trả không âm và không vượt phần còn phải thanh toán. Khi dùng ví, luôn kiểm tra số tiền thực tế trước khi lưu, không chỉ kiểm tra ô bật/tắt ví.

### 8.5. Sau khi lưu

App **giữ nguyên form Tạo hóa đơn và dữ liệu**, chuyển sang trạng thái đã lưu, không tự chuyển vào chi tiết. Các ô khóa để tránh hiểu nhầm rằng đơn chưa được ghi nhận. Dùng **Chỉnh sửa** để tải lại đơn có đầy đủ ID dòng bán; dùng **Tạo hóa đơn mới** để bắt đầu đơn trống; dùng **Đóng** để về danh sách.

Nếu hóa đơn đã lưu nhưng bước ghi nhận buổi/gán nhân viên lỗi, **không tạo lại hóa đơn**. Ghi nhận mã hóa đơn, mở thẻ và lịch sử để kiểm tra buổi nào đã tồn tại trước khi làm tiếp. Không tự bấm thực hiện lại khi chưa rõ kết quả request trước.

### 8.6. Sửa, xóa và in

Mở hóa đơn trong danh sách → **Chỉnh sửa** → thay đổi dòng/giá/thanh toán → lưu. Dòng cũ được giữ ID để bảo toàn liên kết thẻ và lịch sử. Backend có thể từ chối thay đổi khi thẻ đã dùng, giảm số buổi xuống dưới số đã dùng, bỏ thẻ đã thực hiện, đổi khách không hợp lệ hoặc hóa đơn có phiếu thu nợ. Không hứa mọi hóa đơn đều có thể sửa/xóa tùy ý.

Chọn **In hóa đơn**, khổ A4/A5/K80/K57 theo lựa chọn hiện có, kiểm tra bản in rồi dùng hộp thoại in của hệ thống. Kích thước/máy in thực tế cần thử trước buổi quay. Không gọi bản in này là hóa đơn điện tử có mã cơ quan thuế.

## 9. Thẻ liệu trình và ghi nhận buổi

### 9.1. Tra cứu

Vào **Liệu trình**, tìm khách, lọc khoảng ngày tạo thẻ khi cần. Danh sách nhóm theo khách, có thẻ còn buổi và khu vực thẻ hoàn thành theo thiết kế giao diện. Mở đúng thẻ để xem dịch vụ, tổng buổi, buổi còn lại, công nợ khách và lịch sử thực hiện.

Không chỉ nhìn tên dịch vụ để phân biệt hai thẻ giống nhau; đối chiếu thẻ, hóa đơn gốc, số buổi và lịch sử. Bộ lọc ngày danh sách không phải báo cáo mọi buổi thực hiện trong kỳ.

### 9.2. Ghi nhận một buổi

1. Chọn đúng thẻ còn buổi và mở thao tác thực hiện.
2. Quản lý chọn cơ sở thực hiện, nhân viên thường theo cơ sở tài khoản.
3. Chọn nhân viên theo vai trò, kiểm tra rồi xác nhận.
4. Xem lịch sử mới, số buổi còn lại và thông tin nhân viên.
5. Nếu cần bổ sung người thực hiện sau, dùng thao tác gán nhân viên trên buổi đã có, không thực hiện thêm một buổi mới.

Giao diện có thao tác hoàn tác buổi với xác nhận và kiểm tra backend. Chỉ dùng khi thực sự ghi sai và có quyền; sau hoàn tác kiểm tra lại số buổi/công ca/lịch hẹn liên quan.

### 9.3. Tạo thẻ thủ công

MANAGER có nút **Tạo thẻ**. Chọn khách, dịch vụ, số buổi, giá gốc tính công, số lượng tính công nếu áp dụng, ghi chú rồi lưu. Giá tính công mặc định theo giá danh mục dịch vụ đã chọn và có thể chỉnh. Combo luôn có số lượng tính công bằng 1 theo giao diện hiện tại. Đây không thay thế thao tác tạo hóa đơn khi có giao dịch thu tiền cần ghi nhận.

## 10. Ví khách hàng

Vào **Ví khách hàng** → thêm mới → chọn khách/cơ sở → nhập tiền nạp, tiền thưởng nếu có, phương thức và ghi chú → lưu. Kiểm tra tổng nhận vào ví và số dư khách sau giao dịch. Có thể mở chi tiết và in phiếu theo giao diện; sửa/xóa tùy quyền và kiểm tra backend.

Ví dụ nạp 1.000.000 đ, tặng 100.000 đ: tiền thật nhận 1.000.000 đ, phần cộng ví có thể là 1.100.000 đ. Không trình bày 100.000 đ thưởng thành tiền mặt thực thu. Khi dùng ví trên hóa đơn, không cộng lại số ví đã dùng như một lần thu tiền mặt mới.

## 11. Thu công nợ

1. Vào **Thu công nợ**, hoặc mở liên kết **Thu nợ khách hàng** từ hóa đơn.
2. Chọn khách, chờ tải các hóa đơn còn nợ.
3. Chọn hóa đơn cần thu, phân bổ số tiền thu cho từng hóa đơn trong giới hạn còn nợ.
4. Chọn cơ sở thu nếu yêu cầu, phương thức, ghi chú; kiểm tra tổng rồi lưu.
5. Xem/in các phiếu thu, kiểm tra lại nợ khách và nợ từng hóa đơn.

Khi thu nhiều hóa đơn, frontend tạo từng phiếu theo thứ tự. Nếu một phiếu lỗi thì các phiếu đã thành công không tự hoàn tác; kiểm tra danh sách trước khi thu tiếp. Cơ sở hóa đơn và cơ sở thu có thể là hai thông tin khác nhau. Không tạo hóa đơn bán hàng mới để ghi nhận tiền thu nợ cũ.

## 12. Nhập kho và tồn kho

### Nhập kho

Vào **Nhập kho**, thêm thông tin nhà cung cấp, ngày nhập, cơ sở, ghi chú; thêm từng sản phẩm vật lý, số lượng, đơn giá nhập và giảm giá nếu có. Kiểm tra tổng rồi lưu. Mở chi tiết để xem/sửa; khi sửa app tải chi tiết đầy đủ trước để giữ đúng các dòng.

### Tồn kho

Vào **Tồn kho**, xem danh sách và số lượng theo cơ sở được phép. Kiểm tra tồn sau nhập/bán và đối chiếu thực tế. Dịch vụ không dùng UI tồn kho sản phẩm. Backend cho phép bán vượt tồn trong nghiệp vụ hiện tại, có thể tạo tồn âm; không quảng cáo hệ thống luôn tự chặn bán hết hàng. Nếu số âm, đối soát phiếu nhập và phiếu bán trước khi điều chỉnh nghiệp vụ.

## 13. Phiếu chi

Vào **Phiếu chi** → thêm mới → chọn cơ sở/ngày → nhập ghi chú → thêm từng khoản với nội dung và số tiền → kiểm tra tổng → lưu. Một phiếu có thể có nhiều khoản chi. Dùng lọc ngày và chi tiết để đối soát. Ví dụ nội dung quay: vật tư tiêu hao, điện nước hoặc chi phí vận hành giả lập. Không coi tổng phiếu chi là toàn bộ giá vốn/lợi nhuận kế toán.

## 14. Công ca và doanh số tư vấn

### Công ca

MANAGER vào **Công ca**, chọn kỳ và cơ sở. Xem tổng theo nhóm nhân viên/cơ sở, **Xem ngày làm** để mở lượt chi tiết, **Xem báo cáo công ca** để tổng hợp theo mức tiền công, số ca và tổng tiền. Xuất Excel theo các nút hiện có để đối soát.

Tiền công là kết quả backend tính trên buổi và nhân viên đã ghi nhận; thay đổi cấu hình hoặc chứng từ có thể ảnh hưởng tùy quy tắc backend. Chưa có luồng bảng lương đầy đủ, chấm công giờ vào/ra, bảo hiểm hoặc chuyển khoản trả lương trong phạm vi giao diện này.

### Hoa hồng · tư vấn

Trang này hiển thị **doanh số được phân bổ cho nhân viên tư vấn**, có tổng theo nhân viên/cơ sở, lượt phân công và chi tiết ngày. Tên menu có chữ hoa hồng nhưng nội dung hiện tại không phải hoa hồng thực trả. Trong video nên dùng lời: “Theo dõi doanh số tư vấn theo nhân viên”, không nói “tự động trả lương/hoa hồng”.

## 15. Tổng quan và báo cáo kinh doanh

### Tổng quan

Trang đầu có chỉ số tháng cho quản lý, thẻ thao tác nhanh, lịch ngày mai, khách chưa đến và khu vực thẻ trong ngày. Khu vực thẻ trong ngày dựa trên thẻ được tạo trong ngày, không phải danh sách đầy đủ mọi khách đã thực hiện hôm nay trên thẻ cũ.

### Báo cáo

1. MANAGER mở **Báo cáo**.
2. Chọn từ ngày/đến ngày và cơ sở hoặc tất cả.
3. Xem doanh thu bán hàng, doanh thu dịch vụ, doanh thu sản phẩm, thực thu, tổng chi, dòng tiền thuần.
4. Xem bảng doanh thu theo ngày, biểu đồ cơ cấu/top mặt hàng và bảng từng sản phẩm/dịch vụ.
5. Chọn mặt hàng để xem hóa đơn liên quan; chọn chứng từ để mở chi tiết.
6. Chuyển các nhóm hóa đơn, thu nợ, nạp ví, phiếu chi, nhập kho, công ca, tư vấn để đối soát.
7. Bấm **Xuất Excel toàn kỳ** hoặc nút xuất tại từng bảng/báo cáo hỗ trợ. Chờ hoàn tất, mở file để kiểm tra trước khi chia sẻ.

**Các khái niệm phải nói đúng:**

- Doanh thu: giá trị bán hàng sau giảm, không nhất thiết đã thu đủ tiền.
- Thực thu: tiền thu theo cách tổng hợp của backend, không cộng lại ví đã dùng như một lần thu mới.
- Tổng chi: gồm khoản chi và nhập kho theo báo cáo hiện tại.
- Dòng tiền thuần = thực thu − tổng chi; **không phải lợi nhuận kế toán**.
- Biểu đồ top 10 không phải mọi mặt hàng. Bảng chi tiết và Excel phục vụ đối soát đầy đủ hơn.

## 16. Quy trình một ngày vận hành

**Đầu ngày:** đăng nhập đúng tài khoản → chọn cơ sở → xem lịch và khách cần liên hệ → kiểm tra thẻ/nhân sự.

**Đón khách:** tìm hoặc tạo hồ sơ → xem nợ và ví → tạo hóa đơn → chọn làm ngay hoặc dùng sau → nhận tiền và in phiếu nếu cần.

**Trong ngày:** ghi nhận buổi trên thẻ cũ → gán nhân viên đúng vai trò → đặt lịch chăm sóc tiếp theo khi cần → ghi nạp ví/thu nợ/phiếu chi/nhập hàng.

**Cuối ngày:** quản lý chọn khoảng ngày → đối soát hóa đơn, thực thu, ví, công nợ, chi, tồn → kiểm tra công ca/doanh số tư vấn → xuất Excel → đăng xuất.

## 17. Tình huống lỗi và cách xử lý an toàn

| Tình huống | Cách xử lý |
| --- | --- |
| Không kết nối máy chủ | Kiểm tra backend, địa chỉ API, mạng/VPN và firewall; không nhập lại giao dịch liên tục |
| Hết phiên/không đủ quyền | Đăng nhập lại đúng tài khoản; nhờ quản lý kiểm tra cơ sở/quyền |
| Hóa đơn đã lưu nhưng execute/gán người lỗi | Giữ mã hóa đơn, kiểm tra thẻ/lịch sử, xử lý buổi thiếu; không tạo lại hóa đơn |
| Mapping thiếu hoặc không hợp lệ | Không tự chọn thẻ theo tên; kiểm tra phiên bản backend và xử lý từ thẻ |
| Không sửa/xóa được chứng từ | Đọc thông báo backend; đối soát thẻ đã dùng, phiếu thu nợ và quyền theo ngày |
| Số dư/tiền thu không hợp lệ | Kiểm tra ví đã dùng, tiền trả ngoài ví, tổng sau giảm và nợ còn lại |
| Tồn âm | Đối chiếu phiếu nhập/bán; hệ thống hiện cho bán vượt tồn |
| Xuất Excel hoặc in lỗi | Kiểm tra dữ liệu, tải lại báo cáo/in lại; không tạo lại giao dịch chỉ để in |

Không quay video bằng dữ liệu khách thật, không công khai thông tin đăng nhập/token, số tài khoản hoặc tên miền nội bộ nhạy cảm. Nên có cơ chế sao lưu/khôi phục backend trước triển khai thật; app frontend không cung cấp nút sao lưu cơ sở dữ liệu toàn hệ thống.

## 18. Chuẩn bị dữ liệu cho video

Dùng môi trường demo riêng; **không tự thêm dữ liệu vào hệ thống kinh doanh đang hoạt động**.

| Nhóm | Dữ liệu minh họa đề xuất |
| --- | --- |
| Cơ sở | Xuly Spa — Trung tâm; Xuly Spa — Cơ sở 2 |
| Nhân sự | Minh Anh — Tư vấn; Ngọc Linh — Kỹ thuật viên; Thu Hà — Chăm sóc |
| Khách | Khách Demo 01, Khách Demo 02; dùng thông tin liên hệ giả lập được kiểm soát |
| Dịch vụ thường | Chăm sóc da cơ bản — 350.000 đ; Điều trị chuyên sâu — 900.000 đ |
| Combo | Liệu trình chăm sóc da 5 buổi — 2.500.000 đ |
| Hàng hóa | Sản phẩm dưỡng da demo — 450.000 đ; tồn đầu qua nghiệp vụ nhập hàng |
| Ví | Một khách có số dư demo để minh họa dùng ví một phần |
| Công nợ | Một hóa đơn trả thiếu có chủ ý để quay thao tác thu nợ |
| Báo cáo | Giao dịch giả lập nhiều ngày, có dịch vụ, hàng hóa, nạp ví và chi |

Giá minh họa không phải bảng giá bán phần mềm hay cam kết hiệu quả điều trị. Khi nhập số tiền, kiểm tra dấu phân tách hàng nghìn. Chuẩn bị ít nhất hai thẻ cùng tên dịch vụ để thể hiện khả năng theo dõi riêng từng dòng.

## 19. Kịch bản video giới thiệu 90 giây

| Thời gian | Cảnh quay | Lời đọc gợi ý |
| --- | --- | --- |
| 0–7 giây | Logo, cửa sổ Xuly Spa | “Xuly Spa — quản lý gọn gàng, chăm sóc khách hàng chỉn chu.” |
| 7–17 giây | Tổng quan và chọn cơ sở | “Theo dõi vận hành và các chỉ số kinh doanh trên một giao diện tiếng Việt.” |
| 17–27 giây | Hồ sơ khách, ví và công nợ | “Thông tin khách hàng, số dư ví và công nợ được tra cứu ngay khi cần.” |
| 27–47 giây | Tạo hóa đơn: dịch vụ, giảm giá, dùng ví | “Lập hóa đơn sản phẩm, dịch vụ và combo; linh hoạt giảm giá, thanh toán bằng ví và ghi nhận tiền khách trả.” |
| 47–59 giây | Hai dòng dịch vụ trùng, chọn làm ngay | “Mỗi dòng bán được theo dõi riêng, kể cả cùng dịch vụ. Ghi nhận làm ngay và nhân viên thực hiện trên đúng thẻ.” |
| 59–69 giây | Thẻ và lịch sử | “Quản lý buổi còn lại, lịch sử chăm sóc và nhân sự theo từng lần thực hiện.” |
| 69–80 giây | Báo cáo, công ca, Excel | “Đối soát doanh thu, thực thu, dòng tiền và công ca; xuất Excel phục vụ quản lý.” |
| 80–90 giây | Lịch hẹn, đổi sáng/tối, logo kết | “Xuly Spa — kết nối các công việc hằng ngày trong một không gian quản lý. Liên hệ để trải nghiệm.” |

Không chèn số điện thoại/giá bán chưa được chủ sản phẩm cung cấp. Câu kêu gọi hành động không đồng nghĩa app có sẵn nút đăng ký dùng thử.

## 20. Kịch bản demo thao tác 5–7 phút

### Cảnh 1 — Nhận diện và tổng quan (30–45 giây)

Mở app với icon thật, quay cửa sổ phóng lớn. Đăng nhập trước hoặc cắt đoạn nhập mật khẩu. Dừng 2–3 giây trên tên/logo. Chỉ các nhóm menu, giao diện sáng/tối và bộ chọn cơ sở. Giải thích số liệu là môi trường minh họa.

### Cảnh 2 — Danh mục và khách hàng (45–60 giây)

Mở một dịch vụ thường và một combo để thấy giá/số buổi. Quay nhanh cấu hình bậc công theo vai trò bằng tài khoản quản lý. Mở khách, chỉ số dư ví, nợ và tổng quan. Không xóa dữ liệu trong cảnh quay chính.

### Cảnh 3 — Tạo hóa đơn có hai dòng cùng dịch vụ (90–120 giây)

Chọn khách và cơ sở. Thêm dịch vụ thường hai lần; dòng 1 số lượng 2 giá 900.000 đ, dòng 2 số lượng 1 giá 1.500.000 đ. Có thể giảm dòng 2 10% để minh họa. Chọn nhân viên tư vấn và thực hiện khác nhau ở hai dòng nếu phù hợp dữ liệu. Giải thích không gộp hai dòng. Chọn dùng ví một phần, kiểm tra tiền ngoài ví và phần nợ. Lưu một lần. Quay thông báo thành công và việc vẫn ở form. Không bấm “Tạo hóa đơn mới” để thử lại đơn vừa lưu.

### Cảnh 4 — Kiểm tra thẻ và lịch sử (45–60 giây)

Đóng form, vào Liệu trình, tìm khách, mở hai thẻ vừa sinh để đối chiếu từng lượt. Với dịch vụ thường đã làm ngay, có thể thẻ đã hết buổi; dùng khu thẻ hoàn thành/chi tiết phù hợp. Chọn thêm một combo còn buổi để quay thao tác ghi nhận buổi và số buổi còn lại. Không tạo thêm thẻ thủ công cho hóa đơn đã sinh thẻ.

### Cảnh 5 — Thu nợ, ví và vận hành (45–60 giây)

Mở Thu công nợ của khách để xử lý phần thiếu. Quay nhanh phiếu nạp ví có thưởng, danh sách nhập kho/tồn kho và phiếu chi. Nếu giới hạn thời lượng, dùng các đoạn cắt ngắn thay vì thực hiện đủ mọi giao dịch trong cùng phiên quay.

### Cảnh 6 — Báo cáo và kết thúc (45–60 giây)

Chọn khoảng ngày phù hợp, chỉ doanh thu/thực thu/tổng chi/dòng tiền. Mở công ca theo nhân viên và bảng theo mức tiền. Xuất Excel rồi mở file. Kết bằng logo Xuly Spa và lời mời liên hệ của đơn vị bán, không đưa cam kết lợi nhuận.

## 21. Checklist quay và dựng

- Quay màn hình 1920×1080 hoặc độ phân giải thống nhất; app phóng lớn, con trỏ rõ, không zoom làm chữ nhòe.
- Tắt thông báo hệ điều hành, email, ứng dụng nhắn tin; dọn desktop và taskbar nếu cần.
- Dùng cùng một chế độ sáng/tối trong mạch chính, chỉ đổi giao diện ở cảnh riêng.
- Kiểm tra backend mới có response `itemMappings`; thử toàn bộ kịch bản trên môi trường demo trước ngày quay.
- Có ít nhất một lần kiểm tra thật việc hai dòng cùng dịch vụ đi vào đúng hai thẻ; kiểm thử mock không thay thế buổi chạy thử này.
- Không quay trạng thái loading dài, mật khẩu/token, dữ liệu thật hoặc thông báo lỗi không chủ ý.
- Để mỗi màn hình đứng yên vài giây cho người xem đọc; phóng cận các ô ví, số buổi và báo cáo khi dựng.
- Lưu bản quay gốc, ảnh logo, tài liệu và file Excel minh họa trong thư mục riêng.
- Dùng lời “hỗ trợ quản lý/đối soát” thay cho “tự động hoàn toàn/không bao giờ sai”.

## 22. Những nội dung chưa được cam kết trong phiên bản này

Không quảng cáo đã có: hóa đơn điện tử thuế; SMS/Zalo/email tự gửi; trả lương/chuyển khoản tự động; chấm công bằng vân tay/khuôn mặt; quản lý phòng/giường/khung giờ chi tiết; ứng dụng native đã lên store; giao dịch offline; đồng bộ kế toán bên thứ ba; sao lưu database từ giao diện; booking công khai/duyệt tự động; thanh toán online tự động chỉ vì có ô chọn nhà cung cấp.

Không sử dụng số lượng khách hàng đang dùng, chứng nhận, đánh giá, cam kết bảo mật tuyệt đối, tăng doanh thu hoặc tiết kiệm chi phí nếu chưa có bằng chứng riêng được chủ sản phẩm duyệt.

Tính năng ghi trong tài liệu là phạm vi giao diện hiện có. Các nghiệp vụ ghi/sửa/xóa phụ thuộc dữ liệu, phân quyền và xác thực backend. Bộ kiểm thử tự động dùng mock không chứng nhận mọi luồng đã chạy với MySQL thật. Trước khi bàn giao thương mại cần kiểm thử tích hợp, sao lưu/khôi phục, bảo mật, tải hệ thống và ký số bản phát hành theo kế hoạch triển khai.