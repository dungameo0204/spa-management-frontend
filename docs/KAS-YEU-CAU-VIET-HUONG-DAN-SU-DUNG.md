# Giao việc cho Codex: chụp màn hình và viết hướng dẫn sử dụng KAS

Ngày tạo: 29/10/2026. Đây là bản giao việc nội bộ, không phải tài liệu gửi khách đã hoàn tất.

## 1. Yêu cầu có thể giao nguyên văn cho Codex

Hãy mở ứng dụng KAS, thao tác trên môi trường demo được cho phép, chụp ảnh màn hình thực tế và viết hướng dẫn sử dụng tiếng Việt dành cho khách hàng không chuyên công nghệ. Đọc toàn bộ yêu cầu bên dưới trước khi thực hiện. Không chỉ đọc code rồi suy đoán giao diện; không tạo ảnh giả hoặc khẳng định đã kiểm chứng những thao tác chưa thực hiện.

## 2. Đầu vào và kiểm tra trước khi bắt đầu

- Thư mục dự án: `D:\Project\SpaManagement\spa-management-frontend`.
- Kiểm tra phiên bản thực tế trong `D:\Project\SpaManagement\spa-management-frontend\package.json`; lúc tạo yêu cầu là KAS 0.1.4.
- Kiểm tra app/website đang chạy và cấu hình API trước khi mở. Không tự ý đổi backend hay dùng nhầm worktree `spa-management-frontend-main`.
- Nếu chưa có địa chỉ app, tài khoản, quyền truy cập hoặc môi trường demo an toàn, hỏi người giao việc để lấy thông tin; không đoán mật khẩu và không đưa thông tin đăng nhập vào tài liệu.
- Có thể chạy giao diện bằng `npm run dev` tại thư mục dự án nếu phù hợp môi trường đã được xác nhận. Lệnh này không tự cung cấp backend hoặc dữ liệu demo; dùng địa chỉ mà tiến trình thực tế báo ra, không mặc định một cổng cố định.
- Dự án đã có Playwright; có thể tham khảo các test trong `D:\Project\SpaManagement\spa-management-frontend\tests\e2e` để hiểu luồng thao tác. Không cài thêm công cụ nếu công cụ hiện có đáp ứng được.
- Nếu công cụ không mở được trình duyệt hoặc không chụp được màn hình, báo rõ phần bị chặn. Không thay bằng ảnh dựng hoặc ảnh không liên quan.

## 3. An toàn dữ liệu — bắt buộc

- Ưu tiên môi trường demo độc lập và dữ liệu giả có nhãn “Minh họa”. Không mặc định API đã cấu hình là môi trường thử nghiệm.
- Với dữ liệu thật, chỉ xem các màn hình được cho phép. Không tạo/sửa/xóa khách hàng, hóa đơn, lịch hẹn, liệu trình, phiếu nhập, phiếu chi, nạp ví hoặc thu nợ để lấy ảnh.
- Chỉ thực hiện giao dịch trên môi trường demo khi được xác nhận cho phép. Không thanh toán thật, gửi tin nhắn thật hoặc kích hoạt dịch vụ bên ngoài.
- Không thay đổi tài khoản, phân quyền, cấu hình cơ sở hoặc cấu hình hệ thống thật.
- Không chụp mật khẩu, token, khóa API, thông tin ngân hàng thật hoặc thông tin cá nhân thật. Dùng dữ liệu giả hoặc che thông tin nhạy cảm trước khi lưu ảnh vào repository.
- Không ghi tài khoản/mật khẩu vào file hướng dẫn, script hoặc commit. Không lưu toàn bộ phiên trình duyệt/HAR/trace có chứa bí mật để bàn giao khách.
- Không chỉnh code ứng dụng để che lỗi nhằm chụp ảnh. Ghi nhận lỗi riêng và tiếp tục phần có thể kiểm chứng an toàn.

## 4. Sản phẩm bàn giao

1. Hướng dẫn khách hàng bằng Markdown:
   `D:\Project\SpaManagement\spa-management-frontend\docs\KAS-HUONG-DAN-SU-DUNG.md`
2. Ảnh PNG đã kiểm tra dữ liệu nhạy cảm:
   `D:\Project\SpaManagement\spa-management-frontend\docs\images\kas-huong-dan\`
3. Nhật ký kiểm chứng nội bộ:
   `D:\Project\SpaManagement\spa-management-frontend\docs\KAS-HUONG-DAN-KIEM-CHUNG.md`

Tài liệu khách phải dùng đường dẫn ảnh tương đối, ví dụ `![Màn hình đăng nhập KAS](images/kas-huong-dan/01-dang-nhap.png)`, để có thể mang cả thư mục sang máy khác. Không đưa đường dẫn ổ D: hoặc chi tiết kỹ thuật nội bộ vào phần hướng dẫn khách.

Nhật ký nội bộ phải ghi ngày chụp, phiên bản, môi trường không chứa bí mật, vai trò đã dùng, màn hình/luồng đã kiểm chứng, file ảnh tương ứng và các bước chưa thể kiểm chứng. Phân biệt rõ dùng backend demo thật hay dữ liệu mock. Không gọi luồng mock là giao dịch đã kiểm chứng đầu cuối.

## 5. Cấu trúc tài liệu khách hàng

Chỉ đưa chức năng thực sự có trong bản app đang mở. Danh sách dưới đây là checklist khảo sát, không phải lời khẳng định mọi tài khoản đều có tất cả chức năng.

### A. Bắt đầu sử dụng

- Giới thiệu KAS và các công việc chính.
- Mở ứng dụng Windows hoặc truy cập website đã được bàn giao; không tự điền địa chỉ triển khai chưa xác nhận.
- Đăng nhập, đăng xuất và bảo vệ tài khoản trên máy dùng chung.
- Nhận biết menu, tìm kiếm, phân trang, bộ lọc, chọn cơ sở, giao diện sáng/tối nếu thực tế có.
- Giải thích ngắn gọn quyền quản lý và nhân viên theo giao diện đã kiểm tra; không suy ra quyền chỉ từ tên vai trò.

### B. Quy trình làm việc hằng ngày

Khảo sát và hướng dẫn theo thứ tự dễ học:

1. Tổng quan: đọc các chỉ số và mở thao tác nhanh.
2. Khách hàng: tìm kiếm, xem hồ sơ, thêm/sửa trên demo, xem ví/công nợ và lịch sử nếu có.
3. Lịch hẹn và booking từ khách: xem, lọc, tạo/cập nhật theo quyền và trạng thái thực tế.
4. Sản phẩm và dịch vụ: tìm kiếm, xem chi tiết, thêm/sửa theo quyền; phân biệt dịch vụ và sản phẩm. Không mô tả giá niêm yết dịch vụ ở các màn hình đã ẩn; kiểm tra ảnh và file xuất thực tế.
5. Bán hàng: chọn khách, chọn cơ sở, thêm sản phẩm/dịch vụ, nhập số lượng, chọn nhân viên nếu có, kiểm tra tổng tiền và phương thức thanh toán, xem lại hóa đơn.
6. Liệu trình: tra cứu thẻ, xem số buổi/lịch sử, ghi nhận buổi và nhân viên trên demo nếu được phép.
7. Ví khách hàng: xem số dư, nạp ví/tiền thưởng và kiểm tra lịch sử theo tính năng thực tế.
8. Thu công nợ: tìm khách, chọn hóa đơn, nhập tiền thu và kiểm tra tổng trước khi xác nhận. Giải thích ví dụ `125.000` là cách hiển thị số tiền 125 nghìn đồng, không phải số thập phân.
9. Nhập kho/tồn kho và phiếu chi: thao tác theo quyền và đối chiếu kết quả sau khi lưu.
10. Báo cáo, công ca, hoa hồng/tư vấn và xuất Excel: chọn khoảng ngày/cơ sở, đọc chỉ số, xuất dữ liệu nếu thực tế có.
11. Thiết lập cho quản lý: chi nhánh, chức vụ, hồ sơ nhân viên, tài khoản theo quyền thực tế.

Nếu không có quyền hoặc dữ liệu để kiểm tra một mục, ghi vào nhật ký nội bộ; không viết các bước tưởng tượng vào tài liệu khách. Có thể tách phần quản lý khỏi phần thao tác nhân viên để khách không nhầm menu bị thiếu là lỗi.

### C. Xử lý tình huống thường gặp

- Không đăng nhập được, mất kết nối, phiên hết hạn hoặc không thấy menu theo quyền.
- Danh sách trống, sai phạm vi cơ sở/ngày lọc, không lưu được do thiếu trường bắt buộc.
- Tránh bấm lưu/thanh toán nhiều lần khi đang chờ; kiểm tra danh sách/lịch sử trước khi thử lại để hạn chế trùng giao dịch.
- Khi cần hỗ trợ: ghi màn hình, thời điểm, thao tác và thông báo lỗi; không gửi mật khẩu/token. Chỉ đưa thông tin liên hệ hỗ trợ nếu đã được cung cấp.
- Không hứa có giao dịch offline, thanh toán tự động, ứng dụng trên kho app hoặc tự động cập nhật nếu chưa kiểm chứng.

## 6. Cách viết từng quy trình

Mỗi quy trình cần có:

1. **Mục đích:** thao tác dùng khi nào.
2. **Điều kiện:** quyền, dữ liệu cần chuẩn bị và cơ sở đang chọn nếu có.
3. **Các bước đánh số:** dùng đúng tên nút/nhãn đang thấy trong app.
4. **Ảnh minh họa:** đặt ngay sau bước liên quan, có chú thích rõ đang xem màn hình nào.
5. **Kết quả cần thấy:** cách kiểm tra thao tác đã thành công; không chỉ ghi “bấm Lưu là xong”.
6. **Lưu ý:** những điểm dễ nhầm và tác động tới số dư/công nợ/tồn kho nếu đã xác minh.

Viết câu ngắn, dễ hiểu; tránh thuật ngữ API, endpoint, token, React, backend trong nội dung khách cần thao tác. Không chép nguyên tài liệu cũ hoặc kể cấu trúc code.

## 7. Quy chuẩn ảnh chụp

- Chụp giao diện thực tế với KAS và đúng phiên bản đã ghi; ưu tiên một chế độ màu nhất quán.
- Dùng khung nhìn máy tính dễ đọc, khoảng 1440 × 900 nếu công cụ hỗ trợ. Chụp thêm giao diện điện thoại chỉ khi có thể kiểm chứng và cần bàn giao cho khách dùng điện thoại.
- Đợi tải xong dữ liệu, đóng bảng phát triển trình duyệt, dọn thông báo không liên quan. Không che thông báo quan trọng về kết quả thao tác.
- Dữ liệu phải nhất quán giữa các bước: cùng khách demo/hóa đơn demo khi minh họa một quy trình.
- Đặt tên ảnh không dấu, có số thứ tự và mô tả: `01-dang-nhap.png`, `02-tong-quan.png`, `03-khach-hang-danh-sach.png`...
- Với màn hình dài, chụp phần liên quan đủ đọc rõ thay vì thu nhỏ toàn trang. Có thể có nhiều ảnh cho một quy trình.
- Không sửa nội dung nghiệp vụ trên ảnh. Nếu thêm đánh số/mũi tên hoặc che dữ liệu nhạy cảm, ghi rõ đó là chú thích/ẩn thông tin, không phải giao diện gốc.
- Không chèn ảnh chưa được tạo. Nếu thiếu ảnh, ghi phần còn thiếu trong nhật ký, không để liên kết hỏng trong bản gửi khách.

## 8. Tài liệu tham khảo và lỗi đã biết

- Tài liệu cũ: `D:\Project\SpaManagement\spa-management-frontend\docs\XULY-SPA-HUONG-DAN-SU-DUNG-VA-KICH-BAN-DEMO.md`. Chỉ tham khảo cấu trúc; tên thương hiệu, phiên bản, ảnh và mô tả thao tác có thể đã cũ.
- Ghi chú lỗi: `D:\Project\SpaManagement\spa-management-frontend\docs\TODO-2026-10-30.md`.
- Có 9 ca unit test thất bại trong log đã lưu, gồm 8 ca phiên đăng nhập và 1 ca dữ liệu test thu nợ thiếu `debt`. Chưa chứng minh đây là 9 lỗi thực tế độc lập; cũng chưa kết luận chỉ lỗi test. Không khẳng định các luồng này hoạt động hoàn toàn nếu chưa kiểm chứng.
- Nếu gặp lỗi thực tế, lưu mô tả và ảnh đã làm sạch thông tin vào nhật ký nội bộ. Không biến một luồng lỗi thành hướng dẫn chuẩn hoặc tự sửa ứng dụng trong nhiệm vụ viết tài liệu.

## 9. Kiểm tra trước khi bàn giao

- [ ] Đã mở app và chụp ảnh thật, ghi phiên bản/ngày kiểm chứng.
- [ ] Mọi bước trong tài liệu khớp nhãn nút và kết quả quan sát được.
- [ ] Phân biệt phần dành cho nhân viên và quản lý khi có khác biệt quyền.
- [ ] Các ảnh tồn tại, đường dẫn tương đối mở được và chữ đủ đọc.
- [ ] Không có dữ liệu cá nhân thật, thông tin đăng nhập hoặc bí mật hệ thống.
- [ ] Không còn tên XULY/O'HINA trong nội dung thương hiệu gửi khách, trừ trường hợp cần giải thích đã được người giao việc duyệt.
- [ ] Không có placeholder, ảnh giả, đường dẫn máy phát triển hoặc lời hứa về tính năng chưa xác minh trong bản gửi khách.
- [ ] Các phần bị chặn/chưa kiểm chứng được liệt kê rõ trong nhật ký nội bộ.
- [ ] Đọc lại toàn bộ hướng dẫn theo góc nhìn khách mới dùng; kiểm tra hiển thị Markdown và ảnh.

Khi hoàn tất, báo cáo ba đường dẫn bàn giao, các luồng đã chụp/kiểm chứng và những mục còn thiếu. Không đánh dấu tài liệu “hoàn tất” nếu các luồng chính vẫn chưa được kiểm tra.