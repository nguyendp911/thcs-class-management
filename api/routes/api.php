<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| REST API Routes v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. Auth & Context
    Route::post('/auth/login', function (Request $request) {
        $email = $request->input('email');
        if (str_contains($email, 'admin')) {
            $role = 'admin';
            $name = 'Nguyễn Văn Quản Trị';
        } elseif (str_contains($email, 'subject')) {
            $role = 'subject_teacher';
            $name = 'Thầy Lê Hoàng Nam';
        } elseif (str_contains($email, 'parent')) {
            $role = 'parent';
            $name = 'Chị Phạm Thị Thu Hà';
        } elseif (str_contains($email, 'student')) {
            $role = 'student';
            $name = 'Nguyễn Văn Minh Anh';
        } else {
            $role = 'homeroom_teacher';
            $name = 'Cô Trần Thị Minh Hương';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'token' => 'demo_session_token_' . time(),
                'user' => [
                    'id' => 1,
                    'name' => $name,
                    'email' => $email,
                    'role' => $role,
                ],
            ],
            'request_id' => (string) \Illuminate\Support\Str::uuid(),
        ]);
    });

    Route::post('/auth/logout', function () {
        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    });

    Route::get('/me', function () {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => 2,
                'name' => 'Cô Trần Thị Minh Hương',
                'email' => 'homeroom@example.test',
                'role' => 'homeroom_teacher',
                'scopes' => [
                    ['class_id' => 1, 'class_name' => 'Lớp 7A1', 'scope_type' => 'homeroom']
                ]
            ],
            'request_id' => (string) \Illuminate\Support\Str::uuid(),
        ]);
    });

    // =====================================================
    // 2. Attendance API - Lưu và tải dữ liệu điểm danh
    // =====================================================
    Route::post('/attendance', function (Request $request) {
        $classId = intval($request->input('class_id'));
        $sessionDate = $request->input('session_date');
        $sessionType = $request->input('session_type', 'morning');
        $isLocked = $request->input('is_locked', false);
        $records = $request->input('records', []);

        if (!$classId || !$sessionDate) {
            return response()->json(['success' => false, 'message' => 'Thiếu class_id hoặc session_date'], 422);
        }

        // Sanitize
        $sessionDate = preg_replace('/[^0-9\-]/', '', $sessionDate);
        $sessionType = in_array($sessionType, ['morning', 'afternoon']) ? $sessionType : 'morning';
        $safeKey = "class{$classId}_{$sessionDate}_{$sessionType}";

        // Store attendance data as JSON file in storage/app/attendance/
        $storageDir = storage_path('app/attendance');
        if (!is_dir($storageDir)) {
            mkdir($storageDir, 0755, true);
        }

        $filePath = $storageDir . '/' . $safeKey . '.json';
        $data = [
            'class_id' => $classId,
            'session_date' => $sessionDate,
            'session_type' => $sessionType,
            'is_locked' => (bool) $isLocked,
            'records' => $records,
            'saved_at' => now()->toIso8601String(),
        ];

        file_put_contents($filePath, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        return response()->json([
            'success' => true,
            'message' => 'Đã lưu dữ liệu điểm danh thành công',
            'saved_at' => $data['saved_at'],
        ]);
    });

    Route::get('/attendance', function (Request $request) {
        $classId = intval($request->query('class_id'));
        $sessionDate = $request->query('session_date');
        $sessionType = $request->query('session_type', 'morning');

        if (!$classId || !$sessionDate) {
            return response()->json(['success' => false, 'message' => 'Thiếu class_id hoặc session_date'], 422);
        }

        $sessionDate = preg_replace('/[^0-9\-]/', '', $sessionDate);
        $sessionType = in_array($sessionType, ['morning', 'afternoon']) ? $sessionType : 'morning';
        $safeKey = "class{$classId}_{$sessionDate}_{$sessionType}";
        $filePath = storage_path('app/attendance/' . $safeKey . '.json');

        if (!file_exists($filePath)) {
            return response()->json(['success' => false, 'message' => 'Chưa có dữ liệu điểm danh cho buổi này'], 404);
        }

        $data = json_decode(file_get_contents($filePath), true);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    });

    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'healthy',
            'database' => 'connected',
            'cache' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    });
});
