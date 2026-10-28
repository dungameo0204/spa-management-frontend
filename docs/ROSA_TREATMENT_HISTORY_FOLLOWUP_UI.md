# Rosa — ghi chú và chữ ký buổi thực hiện

## Quy tắc đã thống nhất ngày 28/10/2026

- Ghi chú được sửa/xóa cả trước và sau ký. Đây là yêu cầu mới được xác nhận trực tiếp; thay thế quy tắc khóa note sau ký trong tài liệu cũ. Backend cần triển khai cùng quy tắc trước khi kiểm tra tích hợp.
- `PUT /api/treatments/execute/:historyId/note`, body `{ note }`; note trắng được gửi thành `null`, tối đa 65535 byte UTF-8.
- `POST /api/treatments/execute/:historyId/sign`, body `{ customer_signature_svg }`. Không gửi thời điểm ký, không ghi đè/xóa chữ ký đã lưu.
- STAFF thao tác buổi tại cơ sở trong token; MANAGER trong tenant. Không áp dụng giới hạn ngày của hoàn tác.

## Giao diện

- Bảng Khách hàng hôm nay hiển thị mỗi buổi một dòng, nhân viên/hoàn tác/chữ ký gắn đúng history ID. Cột chữ ký đặt nút cạnh ảnh và thời điểm ký để giảm chiều cao dòng. Phân trang theo buổi, không theo thẻ; thẻ mới chưa thực hiện vẫn có dòng để ghi nhận.
- Lịch sử trong hồ sơ khách hàng mở cùng hộp thoại, cho phép thao tác cả buổi cũ.
- Buổi đã ký vẫn có nút lưu ghi chú, không có vùng ký lại. Chỉ có thời điểm ký nhưng thiếu SVG cũng được coi là đã ký.
- Ghi chú và chữ ký thay đổi cùng lúc: lưu note trước, ký sau. Nếu ký thất bại, note đã lưu được giữ riêng và thông báo rõ; nét ký còn nguyên để thử lại.
- Lưu thành công làm mới treatment/dashboard queries; trong hồ sơ khách hàng tải lại overview. Không gọi execute, không thay đổi bộ đếm, hoa hồng hay trạng thái đóng thẻ.
- Ghi chú hiển thị dưới dạng text; SVG hiển thị qua ảnh data URL, không chèn HTML/SVG tùy ý.

## Kiểm thử

- Unit: `src/components/TreatmentSessionDialog.test.jsx`.
- Browser desktop/mobile: `tests/e2e/rosa-session-followup.spec.js` (API mock, không xác minh backend thật).