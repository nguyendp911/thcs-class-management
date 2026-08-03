# Kiến trúc Kỹ thuật Hệ thống Quản lý Lớp THCS

## 1. Tổng quan Kiến trúc

Hệ thống được thiết kế theo mô hình Monorepo gồm 2 khối chính:
- **Frontend SPA**: React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query.
- **Backend REST API**: PHP 8.2 + Laravel 11 API (Sanctum SPA authentication, Service Layer, Custom Form Requests, Eloquent Models, API Resources, Queue workers).

```
                      +-----------------------------+
                      |   Browser (React SPA Web)   |
                      +--------------+--------------+
                                     |
                         HTTP REST API (Cookie Auth + CSRF)
                                     |
                      +--------------v--------------+
                      |    Laravel PHP 8.2 REST     |
                      +----+-----------+-------+----+
                           |           |       |
            +--------------+           |       +---------------+
            |                          |                       |
   +--------v-------+         +--------v-------+      +--------v-------+
   |   MySQL 8.0    |         | File Storage   |      | Queue / Mail   |
   | Database       |         | (Local/S3)     |      | (Database)     |
   +----------------+         +----------------+      +----------------+
```

## 2. Phân tầng Backend Architecture

1. **Controllers (`app/Http/Controllers/Api`)**: Controller mỏng, chịu trách nhiệm nhận HTTP Request, gọi FormRequest validation, chuyển giao tác vụ cho Service và chuyển kết quả thành API Resource.
2. **Form Requests (`app/Http/Requests`)**: Đảm nhiệm validate dữ liệu đầu vào, ép kiểu dữ liệu và ngăn chặn injection.
3. **Policies (`app/Policies`)**: Kiểm tra cả quyền chức năng (`permission`) và phạm vi dữ liệu (`user_class_scopes`, `teacher_assignments`, `student_guardians`).
4. **Services (`app/Services`)**: Chứa toàn bộ logic nghiệp vụ (Attendance marking, Score calculation, Student transfer transaction, Conduct calculation, Incident workflow).
5. **Models (`app/Models`)**: Định nghĩa quan hệ Eloquent, scope query, fillable attributes và casting.
6. **API Resources (`app/Http/Resources`)**: Chuyển đổi dữ liệu từ Model/DTO sang định dạng JSON thống nhất, loại bỏ thông tin nhạy cảm.

## 3. Luồng Xử lý Yêu cầu (Request Flow)

1. Client gửi request đính kèm HttpOnly Cookie và CSRF Token.
2. Middleware kiểm tra Authenticated Session, Rate Limiting, CORS và Context Scope.
3. Form Request validate dữ liệu.
4. Policy kiểm tra thẩm quyền.
5. Service chạy nghiệp vụ trong Database Transaction và phát Domain Event nếu cần.
6. Controller trả response qua API Resource.

## 4. Nguyên tắc Bảo mật

- **Không bóc tách IDOR**: Policy trực tiếp query quan hệ giữa User và Resource, không chỉ tin tưởng `class_id` từ client.
- **Bảo vệ dữ liệu trẻ vị thành niên**: Trường dữ liệu sức khỏe, sự cố và ghi chú nhạy cảm có field-level authorization.
- **Audit Logging**: Mọi thao tác sửa điểm sau khi phát hành, duyệt đơn xin nghỉ, đổi vai trò và xuất báo cáo được lưu lại vết audit không thể sửa đổi.
