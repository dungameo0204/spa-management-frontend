# AI context — branch `rosa`

> Đọc file này trước; chỉ mở tài liệu/link bên dưới khi nhiệm vụ chạm tới phần đó. Cập nhật file này trong **cùng commit** với thay đổi lớn của branch. Mục tiêu: handoff nhanh, không thay README/API docs.

## 30 giây
- React 19 + Vite 6 + JS (không TypeScript); React Query; React Router; Vitest; Playwright; PWA + Electron Windows.
- Frontend-only: gọi backend qua `/api`; không chạm MySQL, không gửi `tenant_id`, không lưu secret/token.
- Roles: `MANAGER`, `STAFF`; backend là authority. Quyền/UI: `src/auth/permissions.js`; routes/menu: `src/app/routes.js`, `src/app/App.jsx`.
- API wrapper duy nhất: `src/api/resources.js` → `src/api/client.js`. Không tự `fetch` trong component.
- Dữ liệu server: React Query, invalidate đúng query keys sau write. UI text là tiếng Việt UTF-8.

## Bản đồ tối thiểu
- App/providers: `src/main.jsx`; routes: `src/app/App.jsx`; shell: `src/components/AppShell.jsx`.
- Pages: `src/pages/`; reusable UI: `src/components/`; business helpers: `src/utils/`.
- API contract tổng quát: `docs/API_FRONTEND.md`; Rosa treatment groups: `docs/ROSA_TREATMENT_GROUPS_API.md`; schema/history: `docs/ROSA_SCHEMA.md`, `docs/ROSA_TREATMENT_HISTORY_FOLLOWUP_UI.md`.
- Tests gần mã: `*.test.{js,jsx}`; browser tests: `tests/e2e/`.

## Quy ước không được phá
- Không thêm library nếu chưa có trong `package.json`; theo style JSX/CSS hiện hữu.
- STAFF bị giới hạn theo branch; MANAGER chọn branch qua `resolveBranch`. Không chỉ khóa UI—giữ payload đúng backend contract.
- Ngày dùng helpers `src/utils/format.js`; tiền/validation dùng helpers hiện có.
- SVG chữ ký render bằng `<img data:image/svg+xml...>`, không `dangerouslySetInnerHTML`.
- `treatments.note`, `treatment_history.note`, `closure_note` là ba khái niệm khác nhau. Không dùng note của treatment làm note của buổi.

## Treatment groups — trạng thái Rosa hiện tại
- Root có `children`; root không execute. Execute từng child bằng `POST /api/treatments/execute`.
- Note/chữ ký buổi thuộc `treatment_history`: payload creation nhận `note`, `customer_signature_svg`; follow-up dùng `PUT /api/treatments/execute/:historyId/note` và `POST .../:historyId/sign`.
- Khi thực hiện nhiều child cùng một lần trong `TreatmentExecution`, note chỉ gắn history của child đầu tiên đã chọn (không copy note); chữ ký gắn mỗi history. Lịch sử nhóm chỉ **gom hiển thị**, không có parent history riêng.
- `TreatmentGroupedHistory` hiển thị date/branch + note/signature ở hàng cha; child rows chỉ `dịch vụ — nhân viên`. Dialog nhóm chọn history đang có note, hoặc history đầu tiên, làm representative để sửa note.
- Kết thúc cả liệu trình là flow riêng: `closeTreatment`, `closure_note`, `closure_signature_svg`.

## Working state (2026-10-30)
- Nhánh hiện tại: `rosa`; có thay đổi **chưa commit** về compact treatment card/history và tests. Đọc `git status --short` trước khi sửa hoặc revert.
- Vừa hoàn tất chuyển ghi chú nhóm từ `treatments.note` sang `treatment_history.note`; helper `updateTreatmentGroupNote` đã bị xóa. Không khôi phục endpoint đó nếu chưa có thay đổi backend rõ ràng.
- Các file trọng tâm thay đổi: `TreatmentExecution`, `TreatmentCardPanel`, `TreatmentGroupedHistory`, `TreatmentGroupSessionDialog`, `todayTreatments`, CSS và test/E2E tương ứng.

## Lệnh kiểm tra
```powershell
npm run lint
npm run check:vietnamese
npm test
npm run build
npm run test:e2e
```
Chạy test focus trước khi chạy full suite. Các test đã chạy xanh cho thay đổi note nhóm: `TreatmentCardPanel.test.jsx`, `TreatmentGroupSessionDialog.test.jsx`, `todayTreatments.test.js`, `today-group-signature.spec.js`, `rosa-compact-treatments.spec.js`.

## Khi bắt đầu / bàn giao
1. `git branch --show-current; git status --short`.
2. Đọc file này, rồi chỉ mở mã/tài liệu liên quan task.
3. Không xóa/sửa file uncommitted không thuộc task.
4. Trước handoff: cập nhật 2 mục **Working state** và **Treatment groups** (nếu đổi); ghi lệnh/test thực tế đã chạy.
