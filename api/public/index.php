<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_name = 'kjioxydi_thcs';
$db_user = 'kjioxydi_thcs';
$db_pass = 'nguyendp';

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

// -------------------------------------------------------------
// Database Schema Migration (Safe try-catch block)
// -------------------------------------------------------------
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(100) PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        grade_level VARCHAR(50) NOT NULL,
        room VARCHAR(50) NOT NULL,
        capacity INT NOT NULL DEFAULT 45,
        student_count INT NOT NULL DEFAULT 0,
        homeroom_teacher_name VARCHAR(100) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        public_id VARCHAR(50) NOT NULL,
        student_code VARCHAR(50) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        gender VARCHAR(20) NOT NULL DEFAULT 'nam',
        date_of_birth VARCHAR(30) NULL,
        address TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'đang học',
        class_id VARCHAR(100) NOT NULL DEFAULT '1',
        class_name VARCHAR(100) NULL,
        group_name VARCHAR(50) NULL,
        primary_guardian_name VARCHAR(100) NULL,
        primary_guardian_phone VARCHAR(50) NULL,
        avatar_url LONGTEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS system_data (
        data_key VARCHAR(100) PRIMARY KEY,
        data_value LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id VARCHAR(100) NOT NULL,
        session_date DATE NOT NULL,
        session_type VARCHAR(20) NOT NULL DEFAULT 'morning',
        is_locked TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_session (class_id, session_date, session_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS attendance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        student_id INT NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
        minutes_late INT NULL,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_record (session_id, student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS class_posts (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS post_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS timetable_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id VARCHAR(100) NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        period INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        teacher_name VARCHAR(100) NULL,
        room VARCHAR(50) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS lesson_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id VARCHAR(100) NOT NULL,
        session_date DATE NOT NULL,
        subject VARCHAR(100) NOT NULL,
        teacher_name VARCHAR(100) NULL,
        lesson_content TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NULL,
        user_name VARCHAR(150) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        class_id VARCHAR(100) NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS student_qr_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL UNIQUE,
        qr_token VARCHAR(128) NOT NULL UNIQUE,
        version INT DEFAULT 1,
        is_revoked TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    try { $pdo->exec("ALTER TABLE classes MODIFY id VARCHAR(100) NOT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE students MODIFY class_id VARCHAR(100) NOT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_sessions MODIFY class_id VARCHAR(100) NOT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_sessions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_records MODIFY student_id VARCHAR(100) NOT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_records ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_records ADD COLUMN method VARCHAR(50) DEFAULT 'MANUAL';"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_records ADD COLUMN verified_by VARCHAR(150) NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE attendance_records ADD COLUMN scanned_at DATETIME NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE students ADD COLUMN avatar_url LONGTEXT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE students MODIFY COLUMN avatar_url LONGTEXT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE users ADD COLUMN avatar_url LONGTEXT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE class_posts ADD COLUMN image_urls LONGTEXT NULL;"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE class_posts ADD COLUMN likes_count INT NOT NULL DEFAULT 0;"); } catch (Exception $e) {}
} catch (Exception $e) {}

$uploadDir = __DIR__ . '/uploads/avatars/';
if (!file_exists($uploadDir)) {
    @mkdir($uploadDir, 0777, true);
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$uri = parse_url($requestUri, PHP_URL_PATH) ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ============================================================
// 0. SYSTEM ACTIVITY LOGS API (/thcs/api/logs)
// ============================================================
if (strpos($requestUri, 'api/logs') !== false || strpos($uri, 'api/logs') !== false) {
    if ($method === 'GET') {
        $type   = $_GET['type'] ?? null;
        $role   = $_GET['role'] ?? null;
        $limit  = intval($_GET['limit'] ?? 500);
        $search = $_GET['search'] ?? null;

        $sql = "SELECT * FROM activity_logs WHERE 1=1";
        $params = [];
        if ($type && $type !== 'all') {
            $sql .= " AND action_type = :type";
            $params[':type'] = $type;
        }
        if ($role && $role !== 'all') {
            $sql .= " AND user_role = :role";
            $params[':role'] = $role;
        }
        if ($search) {
            $sql .= " AND (user_name LIKE :s OR description LIKE :s OR action_type LIKE :s)";
            $params[':s'] = "%$search%";
        }
        $sql .= " ORDER BY id DESC LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll() ?: [];
        jsonResponse(['success' => true, 'logs' => $logs]);
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        if (!empty($input['user_name']) && !empty($input['action_type'])) {
            $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, user_name, user_role, action_type, description, class_id, ip_address) 
                VALUES (:uid, :uname, :urole, :atype, :desc, :cid, :ip)");
            $stmt->execute([
                ':uid'   => strval($input['user_id'] ?? ''),
                ':uname' => strval($input['user_name'] ?? 'Hệ thống'),
                ':urole' => strval($input['user_role'] ?? 'system'),
                ':atype' => strval($input['action_type'] ?? 'HỆ THỐNG'),
                ':desc'  => strval($input['description'] ?? ''),
                ':cid'   => strval($input['class_id'] ?? ''),
                ':ip'    => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            ]);
            jsonResponse(['success' => true, 'message' => 'Logged successfully']);
        }
        jsonResponse(['error' => 'Invalid payload'], 400);
    }

    if ($method === 'DELETE') {
        $pdo->exec("TRUNCATE TABLE activity_logs");
        jsonResponse(['success' => true, 'message' => 'Cleared all logs']);
    }
}

// ============================================================
// STUDENT QR TOKENS & CAMERA VERIFICATION API (/thcs/api/qr)
// ============================================================
if (strpos($requestUri, 'api/qr') !== false || strpos($uri, 'api/qr') !== false) {
    // 1. GET /thcs/api/qr/token?student_id=xxx OR class_id=xxx
    if (strpos($uri, 'token') !== false || (isset($_GET['action']) && $_GET['action'] === 'token')) {
        $student_id = $_GET['student_id'] ?? null;
        $class_id   = $_GET['class_id'] ?? null;

        if ($student_id) {
            $stmt = $pdo->prepare("SELECT * FROM student_qr_tokens WHERE student_id = :sid AND is_revoked = 0 LIMIT 1");
            $stmt->execute([':sid' => $student_id]);
            $row = $stmt->fetch();
            if (!$row) {
                $token = 'THCS-QR-v1-' . bin2hex(random_bytes(16));
                $iStmt = $pdo->prepare("INSERT INTO student_qr_tokens (student_id, qr_token, version, is_revoked) VALUES (:sid, :tk, 1, 0)");
                $iStmt->execute([':sid' => $student_id, ':tk' => $token]);
                jsonResponse(['success' => true, 'qr_token' => $token, 'version' => 1]);
            } else {
                jsonResponse(['success' => true, 'qr_token' => $row['qr_token'], 'version' => intval($row['version'])]);
            }
        } elseif ($class_id) {
            $stmt = $pdo->prepare("SELECT s.id as student_id, s.full_name, s.student_code, s.class_id, q.qr_token, q.version 
                                  FROM students s 
                                  LEFT JOIN student_qr_tokens q ON s.id = q.student_id AND q.is_revoked = 0 
                                  WHERE s.class_id = :cid");
            $stmt->execute([':cid' => $class_id]);
            $rows = $stmt->fetchAll() ?: [];
            $results = [];
            $uStmt = $pdo->prepare("INSERT INTO student_qr_tokens (student_id, qr_token, version, is_revoked) VALUES (:sid, :tk, 1, 0)");
            foreach ($rows as $r) {
                $tok = $r['qr_token'];
                if (!$tok) {
                    $tok = 'THCS-QR-v1-' . bin2hex(random_bytes(16));
                    try {
                        $uStmt->execute([':sid' => $r['student_id'], ':tk' => $tok]);
                    } catch (Exception $e) {}
                }
                $results[] = [
                    'student_id'   => $r['student_id'],
                    'full_name'    => $r['full_name'],
                    'student_code' => $r['student_code'],
                    'qr_token'     => $tok,
                    'version'      => intval($r['version'] ?? 1),
                ];
            }
            jsonResponse(['success' => true, 'tokens' => $results]);
        }
    }

    // 2. POST /thcs/api/qr/revoke (Revoke and issue new token for lost card)
    if (strpos($uri, 'revoke') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $student_id = $input['student_id'] ?? null;
        $teacher_name = $input['teacher_name'] ?? 'Giáo viên';
        if ($student_id) {
            $pdo->prepare("UPDATE student_qr_tokens SET is_revoked = 1 WHERE student_id = :sid")->execute([':sid' => $student_id]);
            $newToken = 'THCS-QR-v2-' . bin2hex(random_bytes(16));
            $pdo->prepare("INSERT INTO student_qr_tokens (student_id, qr_token, version, is_revoked) VALUES (:sid, :tk, 2, 0)")
                ->execute([':sid' => $student_id, ':tk' => $newToken]);
            
            $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description) VALUES (:uname, 'homeroom_teacher', 'CẤU HÌNH', :desc)")
                ->execute([':uname' => $teacher_name, ':desc' => "Thu hồi thẻ QR cũ và cấp mã QR mới (v2) cho học sinh ID: $student_id"]);
            
            jsonResponse(['success' => true, 'qr_token' => $newToken, 'version' => 2, 'message' => 'Đã thu hồi thẻ cũ và cấp QR mới thành công']);
        }
        jsonResponse(['error' => 'Thiếu student_id'], 400);
    }

    // 3. POST /thcs/api/qr/scan-lookup (Scan QR code WITHOUT saving attendance)
    if (strpos($uri, 'scan-lookup') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $qr_token   = trim($input['qr_token'] ?? '');
        $class_id   = strval($input['class_id'] ?? '');
        $session_id = intval($input['session_id'] ?? 0);
        $teacher_name = strval($input['teacher_name'] ?? 'Giáo viên');

        if (empty($qr_token) || $class_id === '') {
            jsonResponse(['success' => false, 'error_code' => 'INVALID_PAYLOAD', 'message' => 'Mã QR hoặc thông tin lớp không hợp lệ.'], 400);
        }

        $stmt = $pdo->prepare("
            SELECT q.qr_token, q.version, q.is_revoked, s.id as student_id, s.student_code, s.full_name, s.gender, s.class_id, s.avatar_url, c.name as class_name
            FROM students s
            LEFT JOIN student_qr_tokens q ON s.id = q.student_id AND q.is_revoked = 0
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE q.qr_token = :tk 
               OR s.student_code = :tk 
               OR s.id = :tk 
               OR s.public_id = :tk
               OR CONCAT('THCS-QR-v1-', s.student_code) = :tk
               OR CONCAT('THCS-QR-v1-', s.id) = :tk
            LIMIT 1
        ");
        $stmt->execute([':tk' => $qr_token]);
        $student = $stmt->fetch();

        if (!$student) {
            $revStmt = $pdo->prepare("SELECT * FROM student_qr_tokens WHERE qr_token = :tk AND is_revoked = 1 LIMIT 1");
            $revStmt->execute([':tk' => $qr_token]);
            if ($revStmt->fetch()) {
                $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description, class_id) VALUES (:un, 'teacher', 'ĐIỂM DANH', :d, :cid)")
                    ->execute([':un' => $teacher_name, ':d' => "CẢNH BÁO: Thẻ QR đã bị thu hồi/khóa được quét vào hệ thống (Token: $qr_token)", ':cid' => $class_id]);
                jsonResponse(['success' => false, 'error_code' => 'QR_REVOKED', 'message' => '⛔ Thẻ QR này đã bị thu hồi hoặc báo mất! Vui lòng cấp thẻ mới cho học sinh.'], 400);
            }

            $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description, class_id) VALUES (:un, 'teacher', 'ĐIỂM DANH', :d, :cid)")
                ->execute([':un' => $teacher_name, ':d' => "CẢNH BÁO: Mã QR không tồn tại trong hệ thống (Token: $qr_token)", ':cid' => $class_id]);
            jsonResponse(['success' => false, 'error_code' => 'QR_NOT_FOUND', 'message' => '❌ Mã QR không tồn tại hoặc không hợp lệ!'], 404);
        }

        if (strval($student['class_id']) !== strval($class_id)) {
            $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description, class_id) VALUES (:un, 'teacher', 'ĐIỂM DANH', :d, :cid)")
                ->execute([':un' => $teacher_name, ':d' => "CẢNH BÁO TRÁI LỚP: Học sinh {$student['full_name']} ({$student['class_name']}) quét vào Lớp $class_id", ':cid' => $class_id]);
            jsonResponse([
                'success' => false,
                'error_code' => 'WRONG_CLASS',
                'message' => "⚠️ Học sinh {$student['full_name']} thuộc lớp {$student['class_name']}, không thuộc lớp này!",
                'student' => $student
            ], 400);
        }

        $already_scanned = false;
        $existing_status = null;
        $scanned_time = null;

        if ($session_id > 0) {
            $rStmt = $pdo->prepare("SELECT * FROM attendance_records WHERE session_id = :sid AND student_id = :st_id LIMIT 1");
            $rStmt->execute([':sid' => $session_id, ':st_id' => $student['student_id']]);
            $rec = $rStmt->fetch();
            if ($rec && in_array($rec['status'], ['PRESENT', 'LATE', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE'])) {
                $already_scanned = true;
                $existing_status = $rec['status'];
                $scanned_time = $rec['updated_at'] ?? $rec['scanned_at'];
            }
        }

        jsonResponse([
            'success' => true,
            'student' => [
                'student_id'   => $student['student_id'],
                'student_code' => $student['student_code'],
                'full_name'    => $student['full_name'],
                'gender'       => $student['gender'] ?? 'Nam',
                'class_name'   => $student['class_name'] ?? "Lớp $class_id",
                'avatar_url'   => $student['avatar_url'],
                'has_photo'    => !empty($student['avatar_url']),
            ],
            'scan_time' => date('H:i:s d/m/Y'),
            'already_scanned' => $already_scanned,
            'existing_status' => $existing_status,
            'scanned_time'    => $scanned_time,
        ]);
    }

    // 4. POST /thcs/api/qr/confirm-attendance (Teacher confirms attendance after photo check)
    if (strpos($uri, 'confirm-attendance') !== false) {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $session_id   = intval($input['session_id'] ?? 0);
        $student_id   = strval($input['student_id'] ?? '');
        $class_id     = strval($input['class_id'] ?? '');
        $status       = strval($input['status'] ?? 'PRESENT');
        $teacher_name = strval($input['teacher_name'] ?? 'Giáo viên');
        $method_type  = strval($input['method'] ?? 'QR_CAMERA');

        if ($student_id === '' || $class_id === '') {
            jsonResponse(['success' => false, 'message' => 'Thông tin xác nhận không hợp lệ.'], 400);
        }

        if ($session_id > 0) {
            $sessStmt = $pdo->prepare("SELECT is_locked FROM attendance_sessions WHERE id = :sid LIMIT 1");
            $sessStmt->execute([':sid' => $session_id]);
            $sess = $sessStmt->fetch();
            if ($sess && intval($sess['is_locked']) === 1) {
                jsonResponse(['success' => false, 'message' => '🔒 Phiên điểm danh đã bị khóa. Không thể ghi nhận thêm kết quả!'], 400);
            }
        }

        if ($status === 'REJECTED') {
            $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description, class_id) VALUES (:un, 'teacher', 'ĐIỂM DANH', :d, :cid)")
                ->execute([':un' => $teacher_name, ':d' => "Giáo viên ĐÃ TỪ CHỐI xác nhận điểm danh cho học sinh ID: $student_id", ':cid' => $class_id]);
            jsonResponse(['success' => true, 'status' => 'REJECTED', 'message' => 'Đã từ chối ghi nhận điểm danh']);
        }

        $stmt = $pdo->prepare("
            INSERT INTO attendance_records (session_id, student_id, status, method, verified_by, scanned_at)
            VALUES (:sid, :st_id, :st, :m, :vby, NOW())
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                method = VALUES(method),
                verified_by = VALUES(verified_by),
                scanned_at = NOW()
        ");
        $stmt->execute([
            ':sid'   => $session_id,
            ':st_id' => $student_id,
            ':st'    => $status,
            ':m'     => $method_type,
            ':vby'   => $teacher_name,
        ]);

        $statusText = $status === 'PRESENT' ? 'CÓ MẶT' : ($status === 'LATE' ? 'ĐỊ MUỘN' : $status);
        $pdo->prepare("INSERT INTO activity_logs (user_name, user_role, action_type, description, class_id) VALUES (:un, 'teacher', 'ĐIỂM DANH', :d, :cid)")
            ->execute([':un' => $teacher_name, ':d' => "Xác nhận điểm danh [$statusText] cho học sinh ID: $student_id (Phương thức: $method_type)", ':cid' => $class_id]);

        jsonResponse([
            'success' => true,
            'student_id' => $student_id,
            'status' => $status,
            'verified_by' => $teacher_name,
            'message' => "Ghi nhận $statusText thành công!",
        ]);
    }
}

// ============================================================
// 0. SYSTEM DATA MYSQL PERSISTENCE API (/thcs/api/system-data)
// ============================================================
if (strpos($requestUri, 'system-data') !== false || strpos($uri, 'system-data') !== false) {
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
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        if (isset($input['key']) && isset($input['value'])) {
            $key = $input['key'];
            $valJson = json_encode($input['value'], JSON_UNESCAPED_UNICODE);
            $stmt = $pdo->prepare("REPLACE INTO system_data (data_key, data_value) VALUES (:k, :v)");
            $stmt->execute([':k' => $key, ':v' => $valJson]);

            // Sync user accounts directly into relational MySQL users table
            if ($key === 'thcs_admin_users' && is_array($input['value'])) {
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
                foreach ($input['value'] as $u) {
                    if (empty($u['username'])) continue;
                    $passHash = password_hash('123456', PASSWORD_BCRYPT);
                    $uStmt->execute([
                        ':pid'   => $u['public_id'] ?? ('USR-' . rand(1000, 9999)),
                        ':name'  => $u['name'] ?? '',
                        ':uname' => $u['username'],
                        ':email' => $u['email'] ?? null,
                        ':phone' => $u['phone'] ?? null,
                        ':pass'  => $passHash,
                        ':role'  => $u['role'] ?? 'homeroom_teacher',
                        ':st'    => $u['status'] ?? 'active',
                    ]);
                }
            }

            // Sync class list directly into relational MySQL classes table
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
        } else if (isset($input['data']) && is_array($input['data'])) {
            $stmt = $pdo->prepare("REPLACE INTO system_data (data_key, data_value) VALUES (:k, :v)");
            foreach ($input['data'] as $k => $v) {
                $valJson = json_encode($v, JSON_UNESCAPED_UNICODE);
                $stmt->execute([':k' => $k, ':v' => $valJson]);
            }
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Invalid parameters'], 400);
        }
    }
}

// ============================================================
// 0.5 USERS DIRECT MYSQL API (/thcs/api/users)
// ============================================================
if (strpos($requestUri, 'users') !== false || strpos($uri, 'users') !== false) {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, public_id, name, username, email, phone, role, status, created_at FROM users ORDER BY id ASC");
        jsonResponse(['users' => $stmt->fetchAll()]);
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
            jsonResponse(['success' => true, 'message' => 'Tài khoản đã được ghi nhận vào MySQL Database!']);
        }
    }
}

// ============================================================
// 1. DASHBOARD LIVE METRICS API (GET /thcs/api/dashboard)
// ============================================================
if (strpos($requestUri, 'dashboard') !== false || strpos($uri, 'dashboard') !== false) {
    $classId = strval($_GET['class_id'] ?? $_POST['class_id'] ?? '1');
    $today = date('Y-m-d');

    // Get Class details
    $cStmt = $pdo->prepare("SELECT * FROM classes WHERE id = :cid LIMIT 1");
    $cStmt->execute([':cid' => $classId]);
    $classItem = $cStmt->fetch();

    // Get Student Count for Class (match class_id OR class_name)
    $sCountStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM students WHERE class_id = :cid");
    $sCountStmt->execute([':cid' => $classId]);
    $stCountRes = $sCountStmt->fetch();
    $totalStudents = intval($stCountRes['cnt'] ?? 0);

    // Get Today's Attendance Records
    $records = [];
    $aStmt = $pdo->prepare("SELECT id FROM attendance_sessions WHERE class_id = :cid AND session_date = :date LIMIT 1");
    $aStmt->execute([':cid' => $classId, ':date' => $today]);
    $session = $aStmt->fetch();

    if ($session) {
        $rStmt = $pdo->prepare("SELECT * FROM attendance_records WHERE session_id = :sid");
        $rStmt->execute([':sid' => $session['id']]);
        $records = $rStmt->fetchAll() ?: [];
    }

    $present = 0; $excused = 0; $unexcused = 0; $late = 0; $earlyLeave = 0; $truancy = 0;
    foreach ($records as $r) {
        $st = $r['status'] ?? '';
        if ($st === 'PRESENT') $present++;
        elseif ($st === 'EXCUSED_ABSENCE') $excused++;
        elseif ($st === 'UNEXCUSED_ABSENCE') $unexcused++;
        elseif ($st === 'LATE') $late++;
        elseif ($st === 'EARLY_LEAVE') $earlyLeave++;
        elseif ($st === 'TRUANCY') $truancy++;
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'class_id' => $classId,
            'class_info' => $classItem,
            'total_students' => $totalStudents,
            'present' => $present,
            'excused' => $excused,
            'unexcused' => $unexcused,
            'late' => $late,
            'early_leave' => $earlyLeave,
            'truancy' => $truancy,
            'attendance_records' => $records
        ]
    ]);
}

// ============================================================
// 2. STUDENTS SYNC API (GET, POST /thcs/api/students)
// ============================================================
if (strpos($requestUri, 'students') !== false || strpos($uri, 'students') !== false) {
    if ($method === 'GET') {
        $classId = strval($_GET['class_id'] ?? '1');
        $stmt = $pdo->prepare("SELECT * FROM students WHERE class_id = :cid ORDER BY id ASC");
        $stmt->execute([':cid' => $classId]);
        jsonResponse(['success' => true, 'students' => $stmt->fetchAll()]);
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $studentsList = $input['students'] ?? [];
        $classId = strval($input['class_id'] ?? '1');

        if (!empty($studentsList) && is_array($studentsList)) {
            // First fetch existing student avatars from DB so we never lose previously saved photo URLs
            $existStmt = $pdo->prepare("SELECT id, student_code, public_id, avatar_url FROM students WHERE class_id = :cid");
            $existStmt->execute([':cid' => $classId]);
            $existingAvatars = [];
            foreach ($existStmt->fetchAll() as $ex) {
                if (!empty($ex['avatar_url'])) {
                    $existingAvatars[strval($ex['id'])] = $ex['avatar_url'];
                    $existingAvatars[strval($ex['student_code'])] = $ex['avatar_url'];
                    $existingAvatars[strval($ex['public_id'])] = $ex['avatar_url'];
                }
            }

            // Delete existing students for this class before bulk insert
            $del = $pdo->prepare("DELETE FROM students WHERE class_id = :cid");
            $del->execute([':cid' => $classId]);

            $ins = $pdo->prepare("INSERT INTO students (public_id, student_code, full_name, avatar_url, gender, date_of_birth, address, status, class_id, class_name, group_name, primary_guardian_name, primary_guardian_phone) VALUES (:pid, :code, :name, :avatar, :gender, :dob, :addr, :status, :cid, :cname, :gname, :pname, :pphone)");

            foreach ($studentsList as $s) {
                $code = strval($s['student_code'] ?? 'HS001');
                $pid  = strval($s['public_id'] ?? ('HS-' . time()));
                $id   = strval($s['id'] ?? '');

                $avatarUrl = !empty($s['avatar_url']) ? $s['avatar_url'] : ($existingAvatars[$id] ?? $existingAvatars[$code] ?? $existingAvatars[$pid] ?? null);

                $ins->execute([
                    ':pid'    => $pid,
                    ':code'   => $code,
                    ':name'   => $s['full_name'] ?? 'Hoc sinh',
                    ':avatar' => $avatarUrl,
                    ':gender' => $s['gender'] ?? 'nam',
                    ':dob'    => $s['date_of_birth'] ?? '2013-01-01',
                    ':addr'   => $s['address'] ?? '',
                    ':status' => $s['status'] ?? 'đang học',
                    ':cid'    => $classId,
                    ':cname'  => $s['class_name'] ?? 'Lop 8A1',
                    ':gname'  => $s['group_name'] ?? 'To 1',
                    ':pname'  => $s['primary_guardian_name'] ?? '',
                    ':pphone' => $s['primary_guardian_phone'] ?? '',
                ]);
            }

            // Update student_count in classes table
            $updCount = $pdo->prepare("UPDATE classes SET student_count = :cnt WHERE id = :cid");
            $updCount->execute([':cnt' => count($studentsList), ':cid' => $classId]);

            // Save to system_data fallback key as well
            $sysKey = "thcs_students_class_" . $classId;
            $valJson = json_encode($studentsList, JSON_UNESCAPED_UNICODE);
            $sysIns = $pdo->prepare("REPLACE INTO system_data (data_key, data_value) VALUES (:k, :v)");
            $sysIns->execute([':k' => $sysKey, ':v' => $valJson]);
        }

        jsonResponse(['success' => true, 'message' => 'Dong bo danh sach hoc sinh vao MySQL thanh cong']);
    }
}

// ============================================================
// 3. CLASSES SYNC API (GET, POST, DELETE /thcs/api/classes)
// ============================================================
if (strpos($requestUri, 'classes') !== false || strpos($uri, 'classes') !== false) {
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
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
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
            jsonResponse(['success' => true, 'message' => 'Cap nhat cau hinh lop thanh cong']);
        }
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

            $delSys = $pdo->prepare("DELETE FROM system_data WHERE data_key = :k");
            $delSys->execute([':k' => "thcs_students_class_" . strval($id)]);

            jsonResponse(['success' => true, 'message' => 'Da xoa lop hoc thanh cong']);
        } else {
            jsonResponse(['error' => 'Thieu ID lop hoc'], 400);
        }
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
