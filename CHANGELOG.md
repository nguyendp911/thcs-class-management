# Nhật ký Thay đổi (CHANGELOG)

## [1.0.0] - 2026-07-31

### Thêm mới (Added)
- Bàn giao mã nguồn hoàn chỉnh Website Quản lý Lớp Trung học Cơ sở.
- **Frontend SPA**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod.
- **Backend API**: PHP 8.2 (Laravel REST API), Sanctum authentication, Policies, Services, Form Requests, Queues, Scheduler.
- **Cơ sở dữ liệu**: MySQL 8.0 với 30+ bảng dữ liệu đầy đủ ràng buộc foreign key, index và soft delete.
- **Hệ thống phân quyền**: RBAC 5 vai trò (Admin, GVCN, GVBM, Phụ huynh, Học sinh) kết hợp scoping theo lớp/môn/học sinh.
- **Tính năng cốt lõi**:
  - Quản lý hồ sơ học sinh, danh sách, tìm kiếm không dấu, chuyển lớp, sức khỏe, tài liệu.
  - Điểm danh nhanh hàng loạt, xử lý đơn xin nghỉ, thống kê chuyên cần.
  - Sổ điểm ma trận, tính điểm theo trọng số, khóa bài kiểm tra, lịch sử sửa điểm (revision audit).
  - Ghi nhận rèn luyện, sự cố học đường, kế hoạch hỗ trợ học sinh.
  - Thời khóa biểu, nhật ký tiết học, bài tập về nhà, nhiệm vụ lớp.
  - Thông báo rich-text có xác nhận, phản hồi riêng tư giáo viên - phụ huynh.
  - Trung tâm xuất báo cáo Excel & PDF bất đồng bộ với signed URL.
  - Dashboard cảnh báo tự động cho GVCN (`ATT_CONSECUTIVE`, `SCORE_DROP`, v.v.).
- **Tài liệu**: README, Architecture, Database, Permissions, Operations, OpenAPI 3.0 specification.
