# Ma trận Phân quyền và Phạm vi Dữ liệu (RBAC & Data Scoping)

## 1. Định nghĩa Vai trò (Roles)

| Role Code | Tên vai trò | Phạm vi mặc định |
| :--- | :--- | :--- |
| `admin` | System Admin | Toàn trường (`schools`) |
| `homeroom_teacher` | Giáo viên chủ nhiệm (GVCN) | Lớp chủ nhiệm được phân công (`user_class_scopes`) |
| `subject_teacher` | Giáo viên bộ môn (GVBM) | Môn học & lớp được phân công (`teacher_assignments`) |
| `parent` | Phụ huynh | Các con được liên kết đã xác minh (`student_guardians`) |
| `student` | Học sinh | Dữ liệu cá nhân (`students`) |

## 2. Ma trận Quyền hạn (Permissions Matrix)

| Nhóm quyền | Admin | GVCN | GVBM | Phụ huynh | Học sinh |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Hồ sơ học sinh** | CRUD | CRUD (Lớp mình) | Xem giới hạn | Xem con mình | Xem bản thân |
| **Chuyên cần & Điểm danh** | Cấu hình | CRUD (Lớp mình) | Ghi theo tiết phân công | Xem + Tạo đơn xin nghỉ | Xem |
| **Điểm & Đánh giá** | Cấu hình | Xem tổng hợp | CRUD (Môn phân công) | Xem con mình | Xem bản thân |
| **Rèn luyện** | Cấu hình | CRUD (Lớp mình) | Ghi nhận sự kiện | Xem con mình | Xem bản thân |
| **Thông báo** | CRUD toàn hệ | CRUD (Lớp mình) | Tạo theo thẩm quyền | Xem + Xác nhận | Xem + Xác nhận |
| **Sự cố & Hỗ trợ** | Xem | CRUD (Lớp mình) | Ghi nhận | Xem phần chia sẻ | Không |
| **Báo cáo & Xuất file** | Toàn hệ | Lớp mình | Môn mình | Bản cá nhân | Bản cá nhân |
| **Tài khoản & Phân quyền** | CRUD | Không | Không | Cập nhật cá nhân | Cập nhật cá nhân |
| **Audit Logs & Settings** | CRUD | Không | Không | Không | Không |

## 3. Quy tắc Scoping Chi tiết

1. **GVCN Scope**:
   - Truy vấn bắt buộc đính kèm `WHERE class_id IN (SELECT class_id FROM user_class_scopes WHERE user_id = :userId AND scope_type = 'homeroom')`.
2. **GVBM Scope**:
   - Khi sửa/nhập điểm: `WHERE class_id = :classId AND subject_id = :subjectId` nằm trong `teacher_assignments`.
3. **Phụ huynh Scope**:
   - Truy vấn bắt buộc `WHERE student_id IN (SELECT student_id FROM student_guardians WHERE guardian_id = (SELECT id FROM guardians WHERE user_id = :userId))`.
4. **Học sinh Scope**:
   - Chỉ xem dữ liệu gắn với `user_id` hoặc `student_id` của chính mình.
