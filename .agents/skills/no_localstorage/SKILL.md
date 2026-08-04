---
name: no_localstorage
description: Quy tắc cấm tuyệt đối việc sử dụng localStorage để lưu trữ dữ liệu nghiệp vụ (lớp học, hồ sơ học sinh, người dùng, điểm số, điểm danh...). Mọi dữ liệu phải lưu và nạp trực tiếp qua MySQL Database API trên Host.
---

# 🚫 QUY TẮC CẤM TUYỆT ĐỐI LOCALSTORAGE DỰ ÁN THCS

## 1. Nguyên Tắc Cốt Lõi:
- **CẤM HOÀN TOÀN**: Không được phép sử dụng `localStorage.setItem` hoặc `localStorage.getItem` để lưu trữ hay nạp danh sách lớp học (`classes`), danh sách học sinh (`students`), danh sách tài khoản (`users`), điểm danh hay dữ liệu hệ thống.
- **TẤT CẢ DỮ LIỆU PHẢI TRUY VẤN TỪ HOST MYSQL DATABASE**:
  - Lấy danh sách lớp: Gọi `GET /thcs/api/classes`
  - Lấy danh sách học sinh: Gọi `GET /thcs/api/students?class_id=...`
  - Thêm/Sửa lớp: Gọi `POST /thcs/api/classes`
  - Thêm/Sửa học sinh: Gọi `POST /thcs/api/students`
  - Xóa lớp: Gọi `DELETE /thcs/api/classes?id=...`
  - Dữ liệu cấu hình chung: Gọi `POST /thcs/api/system-data`

## 2. Kiểm Tra & Đảm Bảo:
- Khi khởi tạo state trong React (`useState`), mặc định phải là mảng rỗng `[]` hoặc null và tải dữ liệu từ API thông qua `useEffect`.
- Khi người dùng tải lại trang (reload `F5`), toàn bộ dữ liệu mới nhất phải được fetch từ Cơ sở dữ liệu MySQL trên Host.
