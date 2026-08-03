# Mô hình Dữ liệu MySQL và Quản lý Cơ sở Dữ liệu

## 1. Quy ước Thiết kế

- Engine: **InnoDB**, Charset: **utf8mb4_unicode_ci**.
- Khóa chính: `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`.
- Khóa phụ public: `public_id CHAR(26)` (ULID) cho các entity công khai.
- Timestamp chuẩn: `created_at`, `updated_at`, `deleted_at` (Soft delete cho dữ liệu nghiệp vụ quan trọng).
- Tiền & Điểm: Dùng kiểu `DECIMAL(4,2)` hoặc `DECIMAL(5,2)`.
- Ngày tháng: `DATE` cho ngày, `DATETIME/TIMESTAMP` cho mốc thời gian UTC.

## 2. Danh mục Bảng dữ liệu chính

### 2.1 Nhóm Tổ chức & Hệ thống
- `schools`: Thông tin trường học (`id`, `code`, `name`, `address`, `phone`, `email`, `timezone`, `status`).
- `users`: Tài khoản người dùng (`id`, `public_id`, `name`, `email`, `phone`, `password`, `status`, `last_login_at`).
- `roles`: Danh sách vai trò (`id`, `code`, `name`, `description`, `is_system`).
- `permissions`: Danh sách quyền nguyên tử (`id`, `code`, `name`, `module`).
- `user_roles`: Gán vai trò cho người dùng (`user_id`, `role_id`, `school_id`).
- `role_permissions`: Gán quyền cho vai trò (`role_id`, `permission_id`).
- `user_class_scopes`: Phân công phạm vi lớp (`user_id`, `class_id`, `subject_id`, `scope_type`, `effective_from`, `effective_to`).
- `audit_logs`: Nhật ký thay đổi (`id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before_data`, `after_data`, `ip_address`, `request_id`).
- `system_settings`: Cấu hình hệ thống (`school_id`, `key`, `value`, `is_sensitive`, `updated_by`).

### 2.2 Nhóm Năm học, Lớp & Môn
- `school_years`: Năm học (`id`, `school_id`, `name`, `starts_on`, `ends_on`, `status`, `is_current`).
- `semesters`: Học kỳ (`id`, `school_year_id`, `code`, `name`, `starts_on`, `ends_on`, `status`, `grading_config_snapshot`).
- `grade_levels`: Khối lớp 6-9 (`id`, `school_id`, `code`, `name`, `sort_order`).
- `classes`: Lớp học (`id`, `school_id`, `school_year_id`, `grade_level_id`, `code`, `name`, `room`, `capacity`, `status`).
- `subjects`: Môn học (`id`, `school_id`, `code`, `name`, `short_name`, `status`, `sort_order`).
- `teacher_assignments`: Phân công giảng dạy (`user_id`, `class_id`, `subject_id`, `assignment_type`, `starts_on`, `ends_on`).
- `class_groups`: Tổ/nhóm học sinh (`class_id`, `name`, `leader_student_id`, `sort_order`).
- `timetable_entries`: Tiết thời khóa biểu (`class_id`, `subject_id`, `teacher_id`, `weekday`, `period_no`, `starts_at`, `ends_at`, `room`).
- `lesson_logs`: Nhật ký tiết học (`timetable_entry_id`, `class_id`, `subject_id`, `teacher_id`, `lesson_date`, `period_no`, `content`, `homework`, `notes`).

### 2.3 Nhóm Học sinh & Phụ huynh
- `students`: Hồ sơ gốc học sinh (`id`, `school_id`, `public_id`, `student_code`, `first_name`, `last_name`, `full_name_normalized`, `date_of_birth`, `gender`, `address`, `status`).
- `student_enrollments`: Danh sách học sinh theo lớp/năm (`student_id`, `school_year_id`, `class_id`, `group_id`, `roll_number`, `status`).
- `guardians`: Hồ sơ phụ huynh (`id`, `school_id`, `full_name`, `phone`, `phone_normalized`, `email`, `address`, `user_id`).
- `student_guardians`: Quan hệ học sinh - phụ huynh (`student_id`, `guardian_id`, `relationship`, `is_primary`, `is_emergency`, `can_receive_notifications`).
- `student_health_profiles`: Thông tin sức khỏe (`student_id`, `blood_type`, `allergies`, `conditions`, `medications`, `emergency_notes`, `visibility_level`).
- `student_tags`: Nhãn học sinh (`school_id`, `name`, `color`, `is_sensitive`).
- `student_tag_assignments`: Gán nhãn (`student_id`, `tag_id`, `assigned_by`).
- `student_notes`: Ghi chú hồ sơ (`student_id`, `author_id`, `category`, `content`, `visibility`, `pinned_at`).
- `student_documents`: Tệp tài liệu hồ sơ (`student_id`, `file_id`, `document_type`, `title`, `visibility`).

### 2.4 Nhóm Chuyên cần & Học tập
- `attendance_sessions`: Buổi/tiết điểm danh (`id`, `class_id`, `session_date`, `session_type`, `period_no`, `status`, `locked_at`, `locked_by`).
- `attendance_records`: Trạng thái điểm danh học sinh (`session_id`, `student_id`, `status`, `minutes_late`, `note`, `recorded_by`).
- `leave_requests`: Đơn xin nghỉ học (`id`, `student_id`, `guardian_id`, `starts_at`, `ends_at`, `session_scope`, `reason`, `status`, `reviewed_by`, `review_note`).
- `grade_categories`: Nhóm cột điểm (`school_year_id`, `subject_id`, `code`, `name`, `weight`).
- `assessments`: Cột bài kiểm tra (`id`, `class_id`, `subject_id`, `semester_id`, `category_id`, `teacher_id`, `title`, `assessment_date`, `max_score`, `weight`, `status`, `released_at`, `locked_at`).
- `student_scores`: Điểm số học sinh (`assessment_id`, `student_id`, `score`, `score_status`, `comment`, `entered_by`, `revision_reason`).
- `score_revisions`: Lịch sử chỉnh sửa điểm (`student_score_id`, `old_score`, `new_score`, `reason`, `changed_by`, `changed_at`).
- `learning_support_plans`: Kế hoạch hỗ trợ học tập (`student_id`, `school_year_id`, `title`, `reason_type`, `goals`, `actions`, `owner_id`, `status`).

### 2.5 Nhóm Rèn luyện, Sự cố & Trao đổi
- `conduct_criteria`: Tiêu chí rèn luyện (`school_year_id`, `code`, `name`, `category`, `event_type`, `default_points`).
- `conduct_events`: Ghi nhận sự kiện rèn luyện (`student_id`, `class_id`, `criterion_id`, `occurred_at`, `points`, `description`, `recorded_by`).
- `incidents`: Sự cố học đường (`id`, `class_id`, `public_id`, `title`, `type`, `severity`, `occurred_at`, `location`, `description`, `status`, `resolved_at`).
- `incident_students`: Học sinh liên quan sự cố (`incident_id`, `student_id`, `involvement_type`, `note`).
- `incident_actions`: Hành động xử lý sự cố (`incident_id`, `action_type`, `description`, `assignee_id`, `due_at`, `status`).
- `rewards_disciplines`: Khen thưởng & Kỷ luật (`student_id`, `class_id`, `record_type`, `level`, `title`, `reason`, `decision_date`, `status`).
- `assignments`: Bài tập về nhà (`id`, `class_id`, `subject_id`, `teacher_id`, `title`, `description`, `assigned_at`, `due_at`, `status`).
- `assignment_submissions`: Bài nộp học sinh (`assignment_id`, `student_id`, `content`, `submitted_at`, `status`, `teacher_feedback`).
- `tasks`: Nhiệm vụ lớp (`id`, `class_id`, `title`, `description`, `task_type`, `priority`, `due_at`, `status`, `created_by`).
- `task_assignees`: Người phụ trách nhiệm vụ (`task_id`, `assignee_type`, `user_id`, `student_id`).
- `calendar_events`: Sự kiện lịch (`class_id`, `title`, `description`, `event_type`, `starts_at`, `ends_at`, `all_day`).
- `announcements`: Thông báo lớp/trường (`id`, `class_id`, `author_id`, `title`, `body_html`, `priority`, `status`, `published_at`, `acknowledgement_required`).
- `announcement_recipients`: Người nhận thông báo (`announcement_id`, `recipient_type`, `user_id`, `student_id`, `guardian_id`, `read_at`, `acknowledged_at`).
- `conversations`: Trao đổi riêng (`id`, `context_type`, `context_id`, `created_by`, `status`).
- `messages`: Tin nhắn phản hồi (`conversation_id`, `sender_id`, `body`, `sent_at`).
- `files`: Metadata tệp đính kèm (`owner_user_id`, `disk`, `path`, `original_name`, `mime_type`, `size_bytes`, `checksum`).
- `notifications`: Notification trong app (`user_id`, `type`, `title`, `body`, `data`, `read_at`).
- `report_exports`: Tác vụ xuất báo cáo (`user_id`, `report_type`, `filters`, `format`, `status`, `file_id`).
