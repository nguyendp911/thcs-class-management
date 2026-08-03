# Hướng dẫn Vận hành, Quản lý Queue & Backup (Operations Guide)

## 1. Vận hành Development / Staging / Production

### Local Environment
- Khởi chạy frontend: `cd apps/web && npm run dev` (Port 5173).
- Khởi chạy backend API: `cd apps/api && php artisan serve --port=8000`.
- Chạy MySQL server & Database migrations: `php artisan migrate:fresh --seed`.

### Background Workers & Scheduler
- Queue Worker (chạy xử lý export Excel/PDF, gửi notification):
  `php artisan queue:work --tries=3 --timeout=120`
- Scheduler (chạy tự động quét cảnh báo chuyên cần, bài tập quá hạn, dọn dẹp file tạm):
  `php artisan schedule:run`

## 2. Kiểm tra Sức khỏe Hệ thống (Health Checks)

- Endpoint kiểm tra process: `GET /api/v1/up` (Response HTTP 200).
- Endpoint kiểm tra chi tiết database, cache và queue: `GET /api/v1/health` (Yêu cầu quyền admin).

## 3. Quy trình Backup & Khôi phục (Backup & Restore)

### Database Backup
1. Tự động chạy hàng ngày qua cron schedule.
2. Lệnh backup thủ công: `php artisan db:backup`
3. Mã hóa file SQL dump trước khi lưu trữ offsite.

### File Storage Backup
1. Đồng bộ định kỳ thư mục `storage/app/private` và `storage/app/public`.
2. Kiểm tra checksum SHA-256 các file xuất báo cáo và minh chứng tài liệu.

### Quy trình Khôi phục (Restore Procedure)
1. Bật chế độ bảo trì: `php artisan down --secret="maintenance-pass"`
2. Khôi phục cơ sở dữ liệu: `mysql -u root -p class_management < backup.sql`
3. Chạy migration kiểm tra tính khớp nối: `php artisan migrate --force`
4. Xóa cache ứng dụng: `php artisan config:clear && php artisan cache:clear`
5. Tắt chế độ bảo trì: `php artisan up`
