Quy tắc lập trình hiệu quả (Efficient Coding Rules)
1. Truy xuất ngữ cảnh (Context Retrieval)
- Trước khi khám phá mã nguồn, hãy kiểm tra git status --short, phần liên quan đến tác vụ trong PROJECT_STATE.md và chỉ những file route/controller/service/schema có liên quan trực tiếp.
- Ưu tiên sử dụng Graphify (graphify-out/graph.json và Graphify MCP) để tìm kiếm symbol, truy vết dependency (phụ thuộc), phân tích phạm vi ảnh hưởng và tìm đường dẫn ngắn nhất giữa các thành phần trước khi thực hiện tìm kiếm regex trên diện rộng.
- Chạy graphify update . sau khi tái cấu trúc (refactor) liên quan đến nhiều service, thêm service dùng chung, thực hiện migration schema hoặc trước một tác vụ cần khám phá dependency. Không xây dựng lại Graphify đối với những chỉnh sửa nhỏ, cục bộ.
- Nếu Graphify không khả dụng, dữ liệu đã lỗi thời hoặc không thể trả lời câu hỏi, hãy sử dụng search_codebase với các mẫu tìm kiếm có phạm vi hẹp. Không mặc định quét toàn bộ repository.
- Loại trừ node_modules, dist, build, coverage, artifacts, backups, các file được tạo tự động, SQL dump và lockfile khỏi các tìm kiếm diện rộng, trừ khi tác vụ yêu cầu kiểm tra trực tiếp những thành phần này.
- Đọc các file đã xác định cùng một lượt và chỉ đọc những khoảng dòng cần thiết. Không đọc lại các file không thay đổi; thay vào đó, hãy kiểm tra phần diff hoặc đoạn mã vừa chỉnh sửa.
- Mặc định giả định rằng các thay đổi trong working tree chỉ do AI lập trình thực hiện trong phiên làm việc hiện tại, trừ khi người dùng thông báo rõ ràng có chỉnh sửa từ bên ngoài. Không liên tục đọc lại các file không liên quan, chạy lại quá trình khám phá mã nguồn trên diện rộng, so sánh với nhánh khác (git show <branch>:..., git diff <branch>...) hoặc kiểm tra cách triển khai ở các nhánh khác chỉ để lấy thêm ngữ cảnh. Chỉ thực hiện những thao tác này khi người dùng yêu cầu so sánh/gộp nhánh, thông báo có thay đổi bên ngoài hoặc tác vụ thực sự yêu cầu đảm bảo khả năng tương thích giữa các nhánh.
2. Nguyên tắc chỉnh sửa (Change Discipline)
- Ưu tiên tuân theo các pattern (mẫu thiết kế/cách triển khai) hiện có của dự án và thực hiện những thay đổi nhỏ, đúng trọng tâm thay vì tạo thêm các lớp trừu tượng (abstraction) mới.
- Đối với công việc liên quan đến schema, trước tiên cần xác định đầy đủ:
  - Schema/template.
  - Cơ chế đăng ký migration.
  - Quy trình backfill (bổ sung dữ liệu cho các bản ghi cũ).
  - Các thao tác đọc/ghi dữ liệu bị ảnh hưởng.
  - Hành vi rollback/xóa dữ liệu.
  - Các bài kiểm thử liên quan trực tiếp.
- Duy trì các cột dữ liệu cũ (legacy columns) và hành vi API hiện tại, trừ khi tác vụ cho phép rõ ràng những thay đổi phá vỡ khả năng tương thích (breaking changes). Khi vẫn giữ các trường tương thích với phiên bản cũ, hãy ghi rõ nguồn dữ liệu chuẩn (source of truth) mới trong code hoặc test.
- Sử dụng một helper/service tập trung để xử lý các quy tắc bất biến chung của transaction, thay vì lặp lại câu lệnh SQL trong các luồng tạo/cập nhật/xóa dữ liệu.
- Kiểm tra git diff --check và phần diff của các file đã thay đổi trước khi tuyên bố hoàn thành công việc.
3. Nguyên tắc kiểm thử và xác thực (Validation Discipline)
- Không chạy toàn bộ test sau mỗi lần chỉnh sửa. Hãy thực hiện theo thứ tự:
  1. Chạy kiểm tra cú pháp sau khi hoàn thành một nhóm chỉnh sửa có liên quan về mặt logic.
  2. Chạy các unit test/regression test nhỏ nhất có liên quan.
  3. Chỉ chạy các integration test thuộc phạm vi bị ảnh hưởng.
- Khi một lệnh thực thi thất bại, hãy phân tích nguyên nhân trước khi chạy lại. Đọc chính xác thông báo lỗi hoặc assertion thất bại và chỉ kiểm tra phần code xung quanh cần thiết để xác định nguyên nhân.
- Các bài test có monkey-patch (ghi đè tạm thời) lên biến global dùng chung, masterPool, port, database hoặc savepoint phải được chạy tuần tự, tuyệt đối không chạy song song.
- Sử dụng transaction/savepoint có thể hủy bỏ và cấu hình Rosa một cách tường minh khi chạy integration test với MySQL thực tế. Không kết luận migration thành công chỉ dựa trên kết quả từ mock.
- Sau khi thực hiện migration, cần xác minh cả cấu trúc schema, dữ liệu backfill và tính idempotency (khả năng chạy lặp lại mà không gây thêm thay đổi ngoài ý muốn) trên từng môi trường đích đã được phê duyệt.
4. Nguyên tắc giao tiếp (Communication)
- Giữ kế hoạch và báo cáo tiến độ ngắn gọn. Chỉ trình bày phạm vi công việc, các bước kiểm tra độc lập tiếp theo và những phát hiện quan trọng.
- Không tự động tạo tài liệu (documentation), trừ khi người dùng yêu cầu hoặc việc thay đổi hành vi của API/schema bắt buộc phải cập nhật tài liệu.
- Phải hỏi ý kiến người dùng trước khi:
  - Thực hiện những thay đổi lớn về kiến trúc hệ thống.
  - Cài đặt provider hoặc công cụ từ bên ngoài.
  - Sử dụng công cụ có khả năng tải mã nguồn lên dịch vụ bên ngoài.
  - Thực hiện những thay đổi ảnh hưởng đến quá trình triển khai (deployment) hoặc hành vi vận hành (runtime) của hệ thống.