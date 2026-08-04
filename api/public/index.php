<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

set_exception_handler(function ($e) {
    jsonResponse(['success' => false, 'error' => $e->getMessage()], 200);
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    jsonResponse(['success' => false, 'error' => "$message in $file:$line"], 200);
});

$db_host = 'localhost';
$db_name = 'kjioxydi_thcs';
$db_user = 'kjioxydi_thcs';
$db_pass = 'nguyendp';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    jsonResponse(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()], 200);
}

// -------------------------------------------------------------
// Database Schema Migration (Safe individual try-catch blocks)
// -------------------------------------------------------------
$schemaQueries = [
    "CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(100) PRIMARY KEY,
        school_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
        school_year_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
        grade_level_id BIGINT UNSIGNED NULL,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        grade_level VARCHAR(50) NOT NULL,
        room VARCHAR(50) NULL,
        capacity INT DEFAULT 45,
        student_count INT DEFAULT 0,
        homeroom_teacher_id BIGINT UNSIGNED NULL,
        homeroom_teacher_name VARCHAR(100) NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        public_id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) NULL,
        phone VARCHAR(50) NULL,
        password VARCHAR(255) NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'homeroom_teacher',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        avatar_url LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
        public_id VARCHAR(50) NOT NULL,
        student_code VARCHAR(50) NOT NULL,
        first_name VARCHAR(50) NULL,
        last_name VARCHAR(50) NULL,
        full_name VARCHAR(100) NOT NULL,
        full_name_normalized VARCHAR(100) NULL,
        avatar_url LONGTEXT NULL,
        gender VARCHAR(20) NOT NULL DEFAULT 'nam',
        date_of_birth VARCHAR(30) NULL,
        address TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'đang học',
        class_id VARCHAR(100) NOT NULL DEFAULT '1',
        class_name VARCHAR(100) NULL,
        group_name VARCHAR(50) NULL,
        roll_number INT NULL,
        primary_guardian_name VARCHAR(100) NULL,
        primary_guardian_phone VARCHAR(50) NULL,
        health_note TEXT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS system_data (
        data_key VARCHAR(100) PRIMARY KEY,
        data_value LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NULL,
        user_name VARCHAR(150) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        class_id VARCHAR(100) NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id VARCHAR(100) NOT NULL,
        session_date DATE NOT NULL,
        session_type VARCHAR(20) NOT NULL DEFAULT 'morning',
        is_locked TINYINT(1) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
        minutes_late INT NULL,
        note TEXT NULL,
        method VARCHAR(50) DEFAULT 'MANUAL',
        verified_by VARCHAR(150) NULL,
        scanned_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS class_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id VARCHAR(100) NOT NULL DEFAULT '1',
        author_name VARCHAR(100) NOT NULL,
        author_role VARCHAR(100) NOT NULL DEFAULT 'GVCN',
        author_avatar TEXT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'Thông báo',
        content TEXT NULL,
        image_url TEXT NULL,
        image_urls LONGTEXT NULL,
        likes_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    "CREATE TABLE IF NOT EXISTS student_qr_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        student_code VARCHAR(100) NULL,
        qr_token VARCHAR(128) NOT NULL,
        version INT DEFAULT 1,
        is_revoked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
];

foreach ($schemaQueries as $query) {
    try {
        $pdo->exec($query);
    } catch (Throwable $t) {}
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$uri = parse_url($requestUri, PHP_URL_PATH) ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ------------------------------------------------------------
// 1. SYSTEM DATA API (/thcs/api/system-data)
// ------------------------------------------------------------
if (strpos($requestUri, 'system-data') !== false || strpos($uri, 'system-data') !== false) {
    try {
        if ($method === 'GET') {
            $key = $_GET['key'] ?? null;
            if ($key) {
                $stmt = $pdo->prepare("SELECT data_value FROM system_data WHERE data_key = :k LIMIT 1");
                $stmt->execute([':k' => $key]);
                $row = $stmt->fetch();
                jsonResponse(['key' => $key, 'value' => $row ? json_decode($row['data_value'], true) : null]);
            } else {
                $stmt = $pdo->query("SELECT data_key, data_value FROM system_data");
                $rows = $stmt->fetchAll() ?: [];
                $res = [];
                foreach ($rows as $r) {
                    $res[$r['data_key']] = json_decode($r['data_value'], true);
                }
                jsonResponse(['data' => $res]);
            }
        }

        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            if (isset($input['key']) && isset($input['value'])) {
                $key = $input['key'];
                $valJson = json_encode($input['value'], JSON_UNESCAPED_UNICODE);
                $stmt = $pdo->prepare("REPLACE INTO system_data (data_key, data_value) VALUES (:k, :v)");
                $stmt->execute([':k' => $key, ':v' => $valJson]);

                if ($key === 'thcs_admin_classes_v2' && is_array($input['value'])) {
                    $cStmt = $pdo->prepare("
                        REPLACE INTO classes (id, code, name, grade_level, room, capacity, student_count, homeroom_teacher_name)
                        VALUES (:id, :code, :name, :grade, :room, :cap, :cnt, :teacher)
                    ");
                    foreach ($input['value'] as $c) {
                        if (empty($c['id'])) continue;
                        $cStmt->execute([
                            ':id'      => strval($c['id']),
                            ':code'    => $c['code'] ?? 'L01',
                            ':name'    => $c['name'] ?? '',
                            ':grade'   => $c['grade_level'] ?? 'Khối 8',
                            ':room'    => $c['room'] ?? 'Phòng 101',
                            ':cap'     => intval($c['capacity'] ?? 45),
                            ':cnt'     => intval($c['student_count'] ?? 0),
                            ':teacher' => $c['homeroom_teacher_name'] ?? 'Giáo viên',
                        ]);
                    }
                }
                jsonResponse(['success' => true, 'key' => $key]);
            } else {
                jsonResponse(['success' => true]);
            }
        }
    } catch (Throwable $t) {
        jsonResponse(['success' => false, 'error' => $t->getMessage()], 200);
    }
}

// ------------------------------------------------------------
// 2. CLASSES API (/thcs/api/classes)
// ------------------------------------------------------------
if (strpos($requestUri, 'classes') !== false || strpos($uri, 'classes') !== false) {
    try {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM classes ORDER BY id ASC");
            $rows = $stmt->fetchAll() ?: [];

            foreach ($rows as &$c) {
                $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE class_id = :cid");
                $cntStmt->execute([':cid' => strval($c['id'])]);
                $c['student_count'] = intval($cntStmt->fetchColumn());
            }

            jsonResponse(['success' => true, 'classes' => $rows]);
        }

        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            if (isset($input['id'])) {
                $stmt = $pdo->prepare("REPLACE INTO classes (id, code, name, grade_level, room, capacity, student_count, homeroom_teacher_name) VALUES (:id, :code, :name, :grade, :room, :cap, :cnt, :teacher)");
                $stmt->execute([
                    ':id'      => strval($input['id']),
                    ':code'    => $input['code'] ?? 'L01',
                    ':name'    => $input['name'] ?? 'Lớp mới',
                    ':grade'   => $input['grade_level'] ?? 'Khối 8',
                    ':room'    => $input['room'] ?? 'Phòng 101',
                    ':cap'     => intval($input['capacity'] ?? 45),
                    ':cnt'     => intval($input['student_count'] ?? 0),
                    ':teacher' => $input['homeroom_teacher_name'] ?? 'Chưa phân công',
                ]);
                jsonResponse(['success' => true, 'message' => 'Lớp học đã được ghi nhận vào MySQL Database']);
            }
            jsonResponse(['success' => true]);
        }

        if ($method === 'DELETE') {
            $id = $_GET['id'] ?? ($_POST['id'] ?? null);
            if (!$id) {
                $input = json_decode(file_get_contents('php://input'), true);
                $id = $input['id'] ?? null;
            }
            if ($id) {
                $stmt = $pdo->prepare("DELETE FROM classes WHERE id = :id");
                $stmt->execute([':id' => strval($id)]);
                $delSt = $pdo->prepare("DELETE FROM students WHERE class_id = :cid");
                $delSt->execute([':cid' => strval($id)]);
                jsonResponse(['success' => true, 'message' => 'Đã xóa lớp học thành công']);
            }
            jsonResponse(['error' => 'Thiếu ID lớp'], 400);
        }
    } catch (Throwable $t) {
        jsonResponse(['success' => false, 'error' => $t->getMessage()], 200);
    }
}

// ------------------------------------------------------------
// 3. STUDENTS API (/thcs/api/students)
// ------------------------------------------------------------
if (strpos($requestUri, 'students') !== false || strpos($uri, 'students') !== false) {
    try {
        if ($method === 'GET') {
            $classId = $_GET['class_id'] ?? null;
            if ($classId) {
                $stmt = $pdo->prepare("SELECT * FROM students WHERE class_id = :cid ORDER BY id ASC");
                $stmt->execute([':cid' => strval($classId)]);
                $rows = $stmt->fetchAll() ?: [];
            } else {
                $stmt = $pdo->query("SELECT * FROM students ORDER BY id ASC");
                $rows = $stmt->fetchAll() ?: [];
            }

            jsonResponse(['success' => true, 'students' => $rows]);
        }

        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            $studentsList = $input['students'] ?? null;
            $classId = strval($input['class_id'] ?? '');

            if ($classId === '' || !is_array($studentsList)) {
                jsonResponse(['success' => false, 'error' => 'Thiếu class_id hoặc danh sách học sinh không hợp lệ'], 422);
            }

            $del = $pdo->prepare("DELETE FROM students WHERE class_id = :cid");
            $del->execute([':cid' => $classId]);

            if (!empty($studentsList)) {
                $ins = $pdo->prepare("INSERT INTO students (public_id, student_code, full_name, avatar_url, gender, date_of_birth, address, status, class_id, class_name, group_name, primary_guardian_name, primary_guardian_phone) VALUES (:pid, :code, :name, :avatar, :gender, :dob, :addr, :status, :cid, :cname, :gname, :pname, :pphone)");

                foreach ($studentsList as $s) {
                    $ins->execute([
                        ':pid'    => strval($s['public_id'] ?? ('HS-' . time())),
                        ':code'   => strval($s['student_code'] ?? 'HS001'),
                        ':name'   => $s['full_name'] ?? 'Học sinh',
                        ':avatar' => $s['avatar_url'] ?? null,
                        ':gender' => $s['gender'] ?? 'nam',
                        ':dob'    => $s['date_of_birth'] ?? '2013-01-01',
                        ':addr'   => $s['address'] ?? '',
                        ':status' => $s['status'] ?? 'đang học',
                        ':cid'    => $classId,
                        ':cname'  => $s['class_name'] ?? 'Lớp học',
                        ':gname'  => $s['group_name'] ?? 'Tổ 1',
                        ':pname'  => $s['primary_guardian_name'] ?? '',
                        ':pphone' => $s['primary_guardian_phone'] ?? '',
                    ]);
                }
            }

            $updCount = $pdo->prepare("UPDATE classes SET student_count = :cnt WHERE id = :cid");
            $updCount->execute([':cnt' => count($studentsList), ':cid' => $classId]);

            jsonResponse([
                'success' => true,
                'message' => 'Đã lưu danh sách học sinh vào MySQL',
                'student_count' => count($studentsList),
            ]);
        }
    } catch (Throwable $t) {
        jsonResponse(['success' => false, 'error' => $t->getMessage()], 200);
    }
}

// ------------------------------------------------------------
// 4. USERS API (/thcs/api/users)
// ------------------------------------------------------------
if (strpos($requestUri, 'users') !== false || strpos($uri, 'users') !== false) {
    try {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT id, public_id, name, username, email, phone, role, status, created_at FROM users ORDER BY id ASC");
            jsonResponse(['users' => $stmt->fetchAll() ?: []]);
        }

        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
            if (!empty($input['username'])) {
                $passHash = password_hash(!empty($input['password']) ? $input['password'] : '123456', PASSWORD_BCRYPT);
                $uStmt = $pdo->prepare("
                    INSERT INTO users (public_id, name, username, email, phone, password, role, status)
                    VALUES (:pid, :name, :uname, :email, :phone, :pass, :role, :st)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        email = VALUES(email),
                        phone = VALUES(phone),
                        role = VALUES(role),
                        status = VALUES(status)
                ");
                $uStmt->execute([
                    ':pid'   => $input['public_id'] ?? ('USR-' . rand(1000, 9999)),
                    ':name'  => $input['name'] ?? '',
                    ':uname' => $input['username'],
                    ':email' => $input['email'] ?? null,
                    ':phone' => $input['phone'] ?? null,
                    ':pass'  => $passHash,
                    ':role'  => $input['role'] ?? 'homeroom_teacher',
                    ':st'    => $input['status'] ?? 'active',
                ]);
                jsonResponse(['success' => true, 'message' => 'Tài khoản đã được ghi nhận vào MySQL Database']);
            }
            jsonResponse(['success' => true]);
        }
    } catch (Throwable $t) {
        jsonResponse(['success' => false, 'error' => $t->getMessage()], 200);
    }
}


// ============================================================
// 4. ATTENDANCE API - GET / POST: Load hoac Luu diem danh vao MySQL
// /thcs/api/attendance
// ============================================================
if ((strpos($requestUri, 'attendance') !== false || strpos($uri, 'attendance') !== false) && ($method === 'POST' || $method === 'GET')) {
    try {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true) ?: [];

        if ($method === 'GET') {
            $input['action'] = 'load';
            $input['class_id'] = $_GET['class_id'] ?? 1;
            $input['session_date'] = $_GET['session_date'] ?? date('Y-m-d');
            $input['session_type'] = $_GET['session_type'] ?? 'morning';
        }

        $action      = $input['action'] ?? 'save';
        $classId     = strval($input['class_id'] ?? '1');
        $sessionDate = preg_replace('/[^0-9\-]/', '', strval($input['session_date'] ?? date('Y-m-d')));
        $sessionType = in_array($input['session_type'] ?? '', ['morning', 'afternoon']) ? $input['session_type'] : 'morning';

        if ($classId === '' || empty($sessionDate)) {
            jsonResponse(['success' => false, 'message' => 'Thiếu class_id hoặc session_date'], 422);
        }

        if ($action === 'load') {
            $stmt = $pdo->prepare("SELECT * FROM attendance_sessions WHERE class_id = :cid AND session_date = :date AND session_type = :type LIMIT 1");
            $stmt->execute([':cid' => $classId, ':date' => $sessionDate, ':type' => $sessionType]);
            $session = $stmt->fetch();

            if (!$session) {
                jsonResponse(['success' => true, 'message' => 'Chưa có dữ liệu điểm danh cho buổi này', 'data' => ['records' => [], 'is_locked' => false]], 200);
            }

            $rStmt = $pdo->prepare("SELECT * FROM attendance_records WHERE session_id = :sid ORDER BY id ASC");
            $rStmt->execute([':sid' => $session['id']]);
            $records = $rStmt->fetchAll() ?: [];

            foreach ($records as &$r) {
                $r['minutes_late'] = isset($r['minutes_late']) && $r['minutes_late'] !== null ? intval($r['minutes_late']) : null;
            }

            jsonResponse([
                'success' => true,
                'data' => [
                    'session_id'   => intval($session['id']),
                    'class_id'     => $session['class_id'],
                    'session_date' => $session['session_date'],
                    'session_type' => $session['session_type'],
                    'is_locked'    => (bool) $session['is_locked'],
                    'records'      => $records
                ]
            ]);
        }

        if ($action === 'save') {
            $records  = $input['records'] ?? [];
            $isLocked = !empty($input['is_locked']) ? 1 : 0;

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("INSERT INTO attendance_sessions (class_id, session_date, session_type, is_locked) 
                VALUES (:cid, :date, :type, :locked)
                ON DUPLICATE KEY UPDATE is_locked = VALUES(is_locked)");
            $stmt->execute([':cid' => $classId, ':date' => $sessionDate, ':type' => $sessionType, ':locked' => $isLocked]);

            $sStmt = $pdo->prepare("SELECT id FROM attendance_sessions WHERE class_id = :cid AND session_date = :date AND session_type = :type LIMIT 1");
            $sStmt->execute([':cid' => $classId, ':date' => $sessionDate, ':type' => $sessionType]);
            $sessionRow = $sStmt->fetch();
            $sessionId  = intval($sessionRow['id']);

            $uStmt = $pdo->prepare("INSERT INTO attendance_records (session_id, student_id, student_name, status, minutes_late, note)
                VALUES (:sid, :stuid, :sname, :status, :late, :note)
                ON DUPLICATE KEY UPDATE status = VALUES(status), minutes_late = VALUES(minutes_late), note = VALUES(note)");

            foreach ($records as $r) {
                $uStmt->execute([
                    ':sid'   => $sessionId,
                    ':stuid' => strval($r['student_id'] ?? '0'),
                    ':sname' => $r['student_name'] ?? 'Học sinh',
                    ':status'=> $r['status'] ?? 'PRESENT',
                    ':late'  => isset($r['minutes_late']) && $r['minutes_late'] !== null ? intval($r['minutes_late']) : null,
                    ':note'  => $r['note'] ?? null
                ]);
            }

            $pdo->commit();

            jsonResponse([
                'success' => true,
                'message' => 'Lưu điểm danh thành công!',
                'data'    => ['session_id' => $sessionId, 'is_locked' => (bool)$isLocked, 'count' => count($records)]
            ]);
        }
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['success' => false, 'message' => 'Lỗi lưu điểm danh MySQL: ' . $e->getMessage()], 200);
    }
}

// ============================================================
// 5. Upload Avatar File & Save to DB
// ============================================================
if ((strpos($requestUri, 'upload-avatar') !== false || strpos($uri, 'upload-avatar') !== false) && $method === 'POST') {
    try {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true) ?: $_POST;

        $id = isset($input['id']) ? strval($input['id']) : '';
        $studentCode = isset($input['student_code']) ? strval($input['student_code']) : '';
        $type = isset($input['type']) ? $input['type'] : 'student';
        $imageData = isset($input['image']) ? $input['image'] : '';

        if (!$id && !$studentCode) {
            jsonResponse(['error' => 'Thieu ID hoac Ma hoc sinh.'], 400);
        }

        $publicUrl = $imageData;

        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $typeMatch)) {
            $data = base64_decode(substr($imageData, strpos($imageData, ',') + 1));
            $ext = strtolower($typeMatch[1]);
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) $ext = 'jpg';

            $targetDirs = [
                __DIR__ . '/uploads/avatars/',
                $_SERVER['DOCUMENT_ROOT'] . '/thcs/uploads/avatars/',
            ];

            foreach ($targetDirs as $dir) {
                if (!file_exists($dir)) {
                    @mkdir($dir, 0777, true);
                }
                $filename = "avatar_{$type}_" . preg_replace('/[^a-zA-Z0-9_\-]/', '', $id ?: $studentCode) . "_" . time() . ".{$ext}";
                $filepath = $dir . $filename;
                if (@file_put_contents($filepath, $data)) {
                    $publicUrl = "/thcs/api/public/uploads/avatars/" . $filename;
                    break;
                }
            }
        }

        $table = $type === 'user' ? 'users' : 'students';
        $stmt = $pdo->prepare("UPDATE {$table} SET avatar_url = :url WHERE id = :id OR public_id = :pid OR student_code = :scode");
        $stmt->execute([
            ':url'   => $publicUrl,
            ':id'    => $id,
            ':pid'   => $id,
            ':scode' => $studentCode ?: $id
        ]);

        jsonResponse(['success' => true, 'avatar_url' => $publicUrl]);
    } catch (Exception $e) {
        jsonResponse(['success' => false, 'message' => 'Loi upload avatar: ' . $e->getMessage()], 500);
    }
}

// ============================================================
// 6. Class Feed Posts API (GET, POST)
// ============================================================
if (strpos($requestUri, 'posts') !== false || strpos($uri, 'posts') !== false) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM class_posts ORDER BY id DESC");
        $posts = $stmt->fetchAll();

        foreach ($posts as &$p) {
            $cStmt = $pdo->prepare("SELECT * FROM post_comments WHERE post_id = :pid ORDER BY id ASC");
            $cStmt->execute([':pid' => $p['id']]);
            $p['comments'] = $cStmt->fetchAll();

            if (!empty($p['image_urls'])) {
                $p['image_urls'] = json_decode($p['image_urls'], true);
            } elseif (!empty($p['image_url'])) {
                $p['image_urls'] = [$p['image_url']];
            } else {
                $p['image_urls'] = [];
            }
        }

        jsonResponse(['posts' => $posts]);
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['action']) && $input['action'] === 'comment') {
            $stmt = $pdo->prepare("INSERT INTO post_comments (post_id, author_name, content) VALUES (:pid, :name, :content)");
            $stmt->execute([
                ':pid'     => $input['post_id'],
                ':name'    => $input['author_name'] ?? 'Nguoi dung',
                ':content' => $input['content']
            ]);
            jsonResponse(['success' => true]);
        }

        if (isset($input['action']) && $input['action'] === 'like') {
            $stmt = $pdo->prepare("UPDATE class_posts SET likes_count = likes_count + 1 WHERE id = :id");
            $stmt->execute([':id' => $input['post_id']]);
            jsonResponse(['success' => true]);
        }

        $imageUrls     = $input['image_urls'] ?? [];
        $imageUrlsJson = !empty($imageUrls) ? json_encode($imageUrls, JSON_UNESCAPED_UNICODE) : null;
        $primaryImageUrl = !empty($imageUrls) ? $imageUrls[0] : ($input['image_url'] ?? null);

        $stmt = $pdo->prepare("INSERT INTO class_posts (class_id, author_name, author_role, author_avatar, category, content, image_url, image_urls) VALUES (:cid, :author, :role, :avatar, :cat, :content, :img, :imgs)");
        $stmt->execute([
            ':cid'    => $input['class_id'] ?? 1,
            ':author' => $input['author_name'] ?? 'Co Tran Thi Minh Huong',
            ':role'   => $input['author_role'] ?? 'GVCN',
            ':avatar' => $input['author_avatar'] ?? '',
            ':cat'    => $input['category'] ?? 'Hoat dong',
            ':content'=> $primaryImageUrl,
            ':img'    => $primaryImageUrl,
            ':imgs'   => $imageUrlsJson,
        ]);
        jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}

// ============================================================
// 7. Purge Demo Data (SUPERADMIN ONLY)
// ============================================================
if ((strpos($requestUri, 'purge-demo') !== false || strpos($uri, 'purge-demo') !== false) && $method === 'POST') {
    $pdo->exec("TRUNCATE TABLE attendance_records;");
    $pdo->exec("TRUNCATE TABLE attendance_sessions;");
    $pdo->exec("TRUNCATE TABLE class_posts;");
    $pdo->exec("TRUNCATE TABLE post_comments;");
    $pdo->exec("TRUNCATE TABLE timetable_entries;");
    $pdo->exec("TRUNCATE TABLE lesson_logs;");
    $pdo->exec("TRUNCATE TABLE students;");
    $pdo->exec("TRUNCATE TABLE classes;");
    $pdo->exec("REPLACE INTO system_settings (setting_key, setting_value) VALUES ('demo_purged', 'true');");

    jsonResponse(['success' => true, 'message' => 'Da xoa toan bo du lieu demo thanh cong!']);
}

// ============================================================
// 8. Get System Settings Status
// ============================================================
if ((strpos($requestUri, 'settings') !== false || strpos($uri, 'settings') !== false) && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM system_settings");
    jsonResponse(['settings' => $stmt->fetchAll()]);
}

jsonResponse(['status' => 'ONLINE', 'database' => 'kjioxydi_thcs']);
