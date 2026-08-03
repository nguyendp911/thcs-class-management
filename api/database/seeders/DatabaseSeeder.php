<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed School
        $schoolId = DB::table('schools')->insertGetId([
            'code' => 'THCS-NDD',
            'name' => 'Trường THCS Nguyễn Đăng Đạo',
            'address' => 'Thành phố Bắc Ninh, Tỉnh Bắc Ninh',
            'phone' => '02223821000',
            'email' => 'thcsnguyendangdao@bacninh.edu.vn',
            'timezone' => 'Asia/Ho_Chi_Minh',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Seed ONLY SuperAdmin User Account (Password: 123123)
        DB::table('users')->insert([
            'public_id' => 'USR-SUPERADMIN-001',
            'name' => 'SuperAdmin',
            'username' => 'superadmin',
            'email' => 'superadmin@vie.info.vn',
            'phone' => '0999888777',
            'password' => Hash::make('123123'),
            'role' => 'superadmin',
            'status' => 'active',
            'must_change_password' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. System Roles
        $roles = [
            ['code' => 'superadmin', 'name' => 'SuperAdmin Cao cấp', 'description' => 'Toàn quyền quản trị hệ thống trường học'],
            ['code' => 'admin', 'name' => 'System Admin', 'description' => 'Quản trị viên hệ thống'],
            ['code' => 'homeroom_teacher', 'name' => 'Giáo viên Chủ nhiệm', 'description' => 'Quản lý lớp học, điểm danh, đơn nghỉ học, rèn luyện'],
            ['code' => 'subject_teacher', 'name' => 'Giáo viên Bộ môn', 'description' => 'Nhập điểm môn học, đánh giá tiết học'],
            ['code' => 'parent', 'name' => 'Phụ huynh Học sinh', 'description' => 'Theo dõi kết quả học tập & gửi đơn xin nghỉ'],
            ['code' => 'student', 'name' => 'Học sinh', 'description' => 'Tra cứu thời khóa biểu, điểm số, rèn luyện'],
            ['code' => 'standard_user', 'name' => 'Người dùng Tiêu chuẩn', 'description' => 'Tài khoản chờ phân quyền chính thức'],
        ];

        foreach ($roles as $r) {
            DB::table('roles')->insert(array_merge($r, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 4. Seed School Years & Semesters
        $yearId = DB::table('school_years')->insertGetId([
            'school_id' => $schoolId,
            'name' => '2025-2026',
            'starts_on' => '2025-09-05',
            'ends_on' => '2026-05-31',
            'status' => 'active',
            'is_current' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('semesters')->insert([
            ['school_year_id' => $yearId, 'code' => 'HK1', 'name' => 'Học kỳ I', 'starts_on' => '2025-09-05', 'ends_on' => '2026-01-15', 'status' => 'closed', 'created_at' => now(), 'updated_at' => now()],
            ['school_year_id' => $yearId, 'code' => 'HK2', 'name' => 'Học kỳ II', 'starts_on' => '2026-01-16', 'ends_on' => '2026-05-30', 'status' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 5. Grade Levels
        $grades = [
            ['code' => 'K6', 'name' => 'Khối 6', 'sort_order' => 1],
            ['code' => 'K7', 'name' => 'Khối 7', 'sort_order' => 2],
            ['code' => 'K8', 'name' => 'Khối 8', 'sort_order' => 3],
            ['code' => 'K9', 'name' => 'Khối 9', 'sort_order' => 4],
        ];

        foreach ($grades as $g) {
            DB::table('grade_levels')->insert(array_merge($g, ['school_id' => $schoolId, 'created_at' => now(), 'updated_at' => now()]));
        }

        // 6. Core Subjects
        $subjects = [
            ['code' => 'TOAN', 'name' => 'Toán học', 'weight' => 2],
            ['code' => 'VVAN', 'name' => 'Ngữ văn', 'weight' => 2],
            ['code' => 'TANG', 'name' => 'Tiếng Anh', 'weight' => 2],
            ['code' => 'VLY', 'name' => 'Vật lý', 'weight' => 1],
            ['code' => 'HHOA', 'name' => 'Hóa học', 'weight' => 1],
            ['code' => 'SHOC', 'name' => 'Sinh học', 'weight' => 1],
            ['code' => 'LS_DL', 'name' => 'Lịch sử & Địa lý', 'weight' => 1],
            ['code' => 'THOC', 'name' => 'Tin học', 'weight' => 1],
            ['code' => 'GDCD', 'name' => 'Giáo dục công dân', 'weight' => 1],
            ['code' => 'CNGHE', 'name' => 'Công nghệ', 'weight' => 1],
            ['code' => 'TDUC', 'name' => 'Thể dục', 'weight' => 1],
            ['code' => 'ANAC', 'name' => 'Âm nhạc', 'weight' => 1],
            ['code' => 'MTHUAT', 'name' => 'Mỹ thuật', 'weight' => 1],
        ];

        foreach ($subjects as $s) {
            DB::table('subjects')->insert(array_merge($s, ['school_id' => $schoolId, 'created_at' => now(), 'updated_at' => now()]));
        }

        // 7. System Settings
        DB::table('system_settings')->insert([
            ['setting_key' => 'school_name', 'setting_value' => 'Trường THCS Nguyễn Đăng Đạo'],
            ['setting_key' => 'system_version', 'setting_value' => 'v3.5.0_production'],
            ['setting_key' => 'clean_production_mode', 'setting_value' => 'true'],
            ['setting_key' => 'allow_self_registration', 'setting_value' => 'true'],
            ['setting_key' => 'timezone', 'setting_value' => 'Asia/Ho_Chi_Minh'],
        ]);
    }
}
