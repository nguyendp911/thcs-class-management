-- ============================================================================
-- TRƯỜNG THCS NGUYỄN ĐĂNG ĐẠO - HỆ THỐNG QUẢN LÝ LỚP HỌC & ĐÀO TẠO SỐ THCS
-- PRODUCTION DATABASE SCHEMA & INITIAL SETUP (KHÔNG DÙNG MOCKDATA/DEMO)
-- Database: kjioxydi_thcs
-- Created At: 2026-08-01
-- SuperAdmin Username: superadmin | Password: 123123
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET TIME_ZONE = "+07:00";

-- --------------------------------------------------------
-- 1. Table: schools
-- --------------------------------------------------------
DROP TABLE IF EXISTS `schools`;
CREATE TABLE `schools` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  `timezone` VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table: school_years
-- --------------------------------------------------------
DROP TABLE IF EXISTS `school_years`;
CREATE TABLE `school_years` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `name` VARCHAR(50) NOT NULL,
  `starts_on` DATE NOT NULL,
  `ends_on` DATE NOT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `is_current` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table: semesters
-- --------------------------------------------------------
DROP TABLE IF EXISTS `semesters`;
CREATE TABLE `semesters` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_year_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `starts_on` DATE NULL,
  `ends_on` DATE NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table: grade_levels
-- --------------------------------------------------------
DROP TABLE IF EXISTS `grade_levels`;
CREATE TABLE `grade_levels` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `sort_order` INT DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Table: roles
-- --------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Table: permissions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) UNIQUE NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Table: role_permissions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_code` VARCHAR(50) NOT NULL,
  `permission_code` VARCHAR(100) NOT NULL,
  UNIQUE KEY `role_permission_unique` (`role_code`, `permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Table: users
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `public_id` CHAR(36) UNIQUE NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NULL,
  `phone` VARCHAR(50) NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'superadmin',
  `avatar` VARCHAR(255) NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `must_change_password` TINYINT(1) DEFAULT 0,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Table: classes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` VARCHAR(100) PRIMARY KEY,
  `school_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `school_year_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `grade_level_id` BIGINT UNSIGNED NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `grade_level` VARCHAR(50) NOT NULL,
  `room` VARCHAR(50) NULL,
  `capacity` INT DEFAULT 45,
  `student_count` INT DEFAULT 0,
  `homeroom_teacher_id` BIGINT UNSIGNED NULL,
  `homeroom_teacher_name` VARCHAR(100) NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Table: user_class_scopes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_class_scopes`;
CREATE TABLE `user_class_scopes` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `class_id` VARCHAR(100) NOT NULL,
  `scope_type` VARCHAR(50) NOT NULL DEFAULT 'homeroom',
  `effective_from` DATE NULL,
  `effective_to` DATE NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Table: students
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `public_id` VARCHAR(50) NOT NULL,
  `student_code` VARCHAR(50) NOT NULL UNIQUE,
  `first_name` VARCHAR(50) NULL,
  `last_name` VARCHAR(50) NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `full_name_normalized` VARCHAR(100) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `gender` VARCHAR(20) NOT NULL DEFAULT 'nam',
  `date_of_birth` VARCHAR(30) NULL,
  `address` TEXT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'đang học',
  `class_id` VARCHAR(100) NOT NULL DEFAULT '1',
  `class_name` VARCHAR(100) NULL,
  `group_name` VARCHAR(50) NULL,
  `roll_number` INT NULL,
  `primary_guardian_name` VARCHAR(100) NULL,
  `primary_guardian_phone` VARCHAR(50) NULL,
  `health_note` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Table: guardians
-- --------------------------------------------------------
DROP TABLE IF EXISTS `guardians`;
CREATE TABLE `guardians` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `relationship` VARCHAR(50) NOT NULL DEFAULT 'Bố',
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `is_primary` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Table: student_enrollments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `student_enrollments`;
CREATE TABLE `student_enrollments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `school_year_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `class_id` VARCHAR(100) NOT NULL,
  `roll_number` INT NULL,
  `starts_on` DATE NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Table: student_tags
-- --------------------------------------------------------
DROP TABLE IF EXISTS `student_tags`;
CREATE TABLE `student_tags` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `color` VARCHAR(20) DEFAULT '#3B82F6',
  `is_sensitive` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. Table: student_tag_assignments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `student_tag_assignments`;
CREATE TABLE `student_tag_assignments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY `student_tag_unique` (`student_id`, `tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 16. Table: subjects
-- --------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `school_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `code` VARCHAR(30) UNIQUE NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `weight` INT DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 17. Table: scores (Gradebook)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `scores`;
CREATE TABLE `scores` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `semester_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `school_year_id` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `tx1` DECIMAL(4,2) NULL,
  `tx2` DECIMAL(4,2) NULL,
  `tx3` DECIMAL(4,2) NULL,
  `gk` DECIMAL(4,2) NULL,
  `ck` DECIMAL(4,2) NULL,
  `dtb` DECIMAL(4,2) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 18. Table: attendance_sessions
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendance_sessions`;
CREATE TABLE `attendance_sessions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(100) NOT NULL,
  `session_date` DATE NOT NULL,
  `session_type` VARCHAR(20) NOT NULL DEFAULT 'morning',
  `is_locked` TINYINT(1) DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'open',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 19. Table: attendance_records
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `roll_number` INT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  `minutes_late` INT DEFAULT 0,
  `note` TEXT NULL,
  `matched_leave_request_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 20. Table: leave_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `class_name` VARCHAR(100) NULL,
  `guardian_name` VARCHAR(100) NULL,
  `guardian_phone` VARCHAR(50) NULL,
  `starts_at` DATE NOT NULL,
  `ends_at` DATE NOT NULL,
  `session_scope` VARCHAR(50) DEFAULT 'cả ngày',
  `reason` TEXT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `review_note` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 21. Table: timetables
-- --------------------------------------------------------
DROP TABLE IF EXISTS `timetables`;
CREATE TABLE `timetables` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(100) NOT NULL,
  `day_of_week` INT NOT NULL,
  `period` INT NOT NULL,
  `subject_id` BIGINT UNSIGNED NULL,
  `subject_name` VARCHAR(100) NOT NULL,
  `teacher_name` VARCHAR(100) NULL,
  `room` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 22. Table: lesson_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `lesson_logs`;
CREATE TABLE `lesson_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(100) NOT NULL,
  `log_date` DATE NOT NULL,
  `period` INT NOT NULL,
  `subject_name` VARCHAR(100) NOT NULL,
  `lesson_title` VARCHAR(255) NOT NULL,
  `teacher_name` VARCHAR(100) NOT NULL,
  `student_absent_notes` TEXT NULL,
  `conduct_notes` TEXT NULL,
  `homework_assigned` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 23. Table: teacher_lesson_evaluations
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teacher_lesson_evaluations`;
CREATE TABLE `teacher_lesson_evaluations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(100) NOT NULL,
  `eval_date` DATE NOT NULL,
  `period` INT NOT NULL,
  `subject_name` VARCHAR(100) NOT NULL,
  `teacher_name` VARCHAR(100) NOT NULL,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `evaluation_type` VARCHAR(20) NOT NULL,
  `category_title` VARCHAR(100) NOT NULL,
  `points_impact` INT DEFAULT 0,
  `comment` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 24. Table: conduct_events
-- --------------------------------------------------------
DROP TABLE IF EXISTS `conduct_events`;
CREATE TABLE `conduct_events` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `student_name` VARCHAR(100) NOT NULL,
  `event_type` VARCHAR(20) NOT NULL DEFAULT 'positive',
  `points` INT DEFAULT 0,
  `criterion_name` VARCHAR(150) NULL,
  `description` TEXT NOT NULL,
  `recorded_by` VARCHAR(100) NULL,
  `logged_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `occurred_at` DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 25. Table: incidents
-- --------------------------------------------------------
DROP TABLE IF EXISTS `incidents`;
CREATE TABLE `incidents` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `incident_date` DATE NULL,
  `occurred_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `location` VARCHAR(100) NULL,
  `severity` VARCHAR(20) DEFAULT 'medium',
  `status` VARCHAR(20) DEFAULT 'OPEN',
  `student_names` TEXT NULL,
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 26. Table: assignment_tasks
-- --------------------------------------------------------
DROP TABLE IF EXISTS `assignment_tasks`;
CREATE TABLE `assignment_tasks` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `task_type` VARCHAR(50) NOT NULL DEFAULT 'bài tập',
  `priority` VARCHAR(20) DEFAULT 'trung bình',
  `assignee_name` VARCHAR(100) NOT NULL,
  `due_at` DATE NULL,
  `description` TEXT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 27. Table: announcements
-- --------------------------------------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NOT NULL,
  `priority` VARCHAR(30) DEFAULT 'bình thường',
  `author_name` VARCHAR(100) NOT NULL DEFAULT 'SuperAdmin',
  `published_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `read_count` INT DEFAULT 0,
  `ack_count` INT DEFAULT 0,
  `total_recipients` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'published',
  `acknowledgement_required` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 28. Table: class_feed_posts
-- --------------------------------------------------------
DROP TABLE IF EXISTS `class_feed_posts`;
CREATE TABLE `class_feed_posts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `class_id` VARCHAR(100) NOT NULL,
  `author_id` BIGINT UNSIGNED NOT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `author_role` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `pinned` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 29. Table: class_feed_comments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `class_feed_comments`;
CREATE TABLE `class_feed_comments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `author_id` BIGINT UNSIGNED NOT NULL,
  `author_name` VARCHAR(100) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 30. Table: role_activation_requests
-- --------------------------------------------------------
DROP TABLE IF EXISTS `role_activation_requests`;
CREATE TABLE `role_activation_requests` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `account_type` VARCHAR(20) NOT NULL DEFAULT 'HS',
  `requested_role` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `requested_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 31. Table: system_data (Cross-Device Data Persistence)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `system_data`;
CREATE TABLE `system_data` (
  `data_key` VARCHAR(100) PRIMARY KEY,
  `data_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 32. Table: system_settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 33. Table: audit_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `actor_user_id` BIGINT UNSIGNED NULL,
  `actor_name` VARCHAR(100) NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INITIAL SYSTEM LOOKUP & SUPERADMIN ACCOUNT DATA (KHÔNG DÙNG MOCKDATA/DEMO)
-- ============================================================================

-- 1. School Information
INSERT INTO `schools` (`id`, `code`, `name`, `address`, `phone`, `email`, `timezone`, `status`) VALUES
(1, 'THCS-NDD', 'Trường THCS Nguyễn Đăng Đạo', 'Thành phố Bắc Ninh, Tỉnh Bắc Ninh', '02223821000', 'thcsnguyendangdao@bacninh.edu.vn', 'Asia/Ho_Chi_Minh', 'active');

-- 2. Current School Year
INSERT INTO `school_years` (`id`, `school_id`, `name`, `starts_on`, `ends_on`, `status`, `is_current`) VALUES
(1, 1, '2025-2026', '2025-09-05', '2026-05-31', 'active', 1);

-- 3. Semesters
INSERT INTO `semesters` (`id`, `school_year_id`, `code`, `name`, `starts_on`, `ends_on`, `status`) VALUES
(1, 1, 'HK1', 'Học kỳ I', '2025-09-05', '2026-01-15', 'closed'),
(2, 1, 'HK2', 'Học kỳ II', '2026-01-16', '2026-05-30', 'active');

-- 4. Grade Levels
INSERT INTO `grade_levels` (`id`, `school_id`, `code`, `name`, `sort_order`) VALUES
(1, 1, 'K6', 'Khối 6', 1),
(2, 1, 'K7', 'Khối 7', 2),
(3, 1, 'K8', 'Khối 8', 3),
(4, 1, 'K9', 'Khối 9', 4);

-- 5. System Roles
INSERT INTO `roles` (`id`, `code`, `name`, `description`) VALUES
(1, 'superadmin', 'SuperAdmin Cao cấp', 'Toàn quyền quản trị hệ thống trường học'),
(2, 'admin', 'System Admin', 'Quản trị viên hệ thống'),
(3, 'homeroom_teacher', 'Giáo viên Chủ nhiệm', 'Quản lý lớp học, điểm danh, đơn nghỉ học, rèn luyện'),
(4, 'subject_teacher', 'Giáo viên Bộ môn', 'Nhập điểm môn học, đánh giá tiết học'),
(5, 'parent', 'Phụ huynh Học sinh', 'Theo dõi kết quả học tập & gửi đơn xin nghỉ'),
(6, 'student', 'Học sinh', 'Tra cứu thời khóa biểu, điểm số, rèn luyện'),
(7, 'standard_user', 'Người dùng Tiêu chuẩn', 'Tài khoản chờ phân quyền chính thức');

-- 6. Core Subjects
INSERT INTO `subjects` (`id`, `school_id`, `code`, `name`, `weight`) VALUES
(1, 1, 'TOAN', 'Toán học', 2),
(2, 1, 'VVAN', 'Ngữ văn', 2),
(3, 1, 'TANG', 'Tiếng Anh', 2),
(4, 1, 'VLY', 'Vật lý', 1),
(5, 1, 'HHOA', 'Hóa học', 1),
(6, 1, 'SHOC', 'Sinh học', 1),
(7, 1, 'LS_DL', 'Lịch sử & Địa lý', 1),
(8, 1, 'THOC', 'Tin học', 1),
(9, 1, 'GDCD', 'Giáo dục công dân', 1),
(10, 1, 'CNGHE', 'Công nghệ', 1),
(11, 1, 'TDUC', 'Thể dục', 1),
(12, 1, 'ANAC', 'Âm nhạc', 1),
(13, 1, 'MTHUAT', 'Mỹ thuật', 1);

-- 7. ONLY SUPERADMIN USER ACCOUNT (Username: superadmin | Password: 123123)
-- Password hash generated via PHP bcrypt: $2y$10$CsHBoYK/rT/aY.PgIM4j2.YIMi1bMBHW8O.tnrQX4CIKbQiD9v/0a
INSERT INTO `users` (`id`, `public_id`, `name`, `username`, `email`, `phone`, `password`, `role`, `status`, `must_change_password`) VALUES
(1, 'USR-SUPERADMIN-001', 'SuperAdmin', 'superadmin', 'superadmin@vie.info.vn', '0999888777', '$2y$10$CsHBoYK/rT/aY.PgIM4j2.YIMi1bMBHW8O.tnrQX4CIKbQiD9v/0a', 'superadmin', 'active', 0);

-- 8. System Configuration Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('school_name', 'Trường THCS Nguyễn Đăng Đạo'),
('system_version', 'v3.5.0_production'),
('clean_production_mode', 'true'),
('allow_self_registration', 'true'),
('timezone', 'Asia/Ho_Chi_Minh');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
