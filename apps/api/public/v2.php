<?php

declare(strict_types=1);
date_default_timezone_set('Asia/Ho_Chi_Minh');

function jsonResponseV2(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBodyV2(): array
{
    static $body = null;
    if ($body !== null) return $body;
    $raw = file_get_contents('php://input');
    $decoded = $raw !== false && $raw !== '' ? json_decode($raw, true) : [];
    $body = is_array($decoded) ? $decoded : [];
    return $body;
}

function apiRouteV2(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $position = strpos($uri, '/api');
    $route = $position === false ? '/' : substr($uri, $position + 4);
    $route = '/' . trim((string) $route, '/');
    if (strpos($route, '/public/index.php') === 0) {
        $route = substr($route, strlen('/public/index.php')) ?: '/';
    }
    return $route === '' ? '/' : $route;
}

function transactionV2(PDO $pdo, callable $callback)
{
    $pdo->beginTransaction();
    try {
        $result = $callback();
        $pdo->commit();
        return $result;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

function schemaV2(PDO $pdo): void
{
    $queries = [
        "CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            public_id VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) NULL,
            phone VARCHAR(50) NULL,
            password VARCHAR(255) NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'homeroom_teacher',
            status VARCHAR(30) NOT NULL DEFAULT 'active',
            avatar_asset_id CHAR(32) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS classes (
            id VARCHAR(100) PRIMARY KEY,
            school_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
            school_year_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
            grade_level_id BIGINT UNSIGNED NULL,
            code VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            grade_level VARCHAR(50) NOT NULL,
            room VARCHAR(50) NULL,
            capacity INT NOT NULL DEFAULT 45,
            student_count INT NOT NULL DEFAULT 0,
            homeroom_teacher_id BIGINT UNSIGNED NULL,
            homeroom_teacher_name VARCHAR(100) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS students (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            school_id BIGINT UNSIGNED NOT NULL DEFAULT 1,
            public_id VARCHAR(50) NOT NULL,
            student_code VARCHAR(50) NOT NULL,
            first_name VARCHAR(50) NULL,
            last_name VARCHAR(50) NULL,
            full_name VARCHAR(100) NOT NULL,
            gender VARCHAR(20) NULL,
            date_of_birth VARCHAR(30) NULL,
            address TEXT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'đang học',
            class_id VARCHAR(100) NOT NULL,
            class_name VARCHAR(100) NULL,
            group_name VARCHAR(50) NULL,
            roll_number INT NULL,
            primary_guardian_name VARCHAR(100) NULL,
            primary_guardian_phone VARCHAR(50) NULL,
            health_note TEXT NULL,
            avatar_asset_id CHAR(32) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_student_class (class_id),
            INDEX idx_student_code (student_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100) NULL,
            user_name VARCHAR(150) NOT NULL,
            user_role VARCHAR(50) NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            class_id VARCHAR(100) NULL,
            ip_address VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_activity_class (class_id),
            INDEX idx_activity_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS attendance_sessions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            class_id VARCHAR(100) NOT NULL,
            session_date DATE NOT NULL,
            session_type VARCHAR(20) NOT NULL DEFAULT 'morning',
            is_locked TINYINT(1) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            created_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_attendance_session (class_id, session_date, session_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS attendance_records (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT UNSIGNED NOT NULL,
            student_id VARCHAR(100) NOT NULL,
            student_name VARCHAR(100) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
            minutes_late INT NULL,
            note TEXT NULL,
            method VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
            verified_by VARCHAR(150) NULL,
            scanned_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_attendance_record (session_id, student_id),
            INDEX idx_attendance_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS server_sessions (
            session_hash CHAR(64) PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            csrf_token CHAR(64) NOT NULL,
            ip_address VARCHAR(64) NULL,
            user_agent VARCHAR(255) NULL,
            expires_at DATETIME NOT NULL,
            last_seen_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_user (user_id),
            INDEX idx_session_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS school_years (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            starts_on DATE NULL,
            ends_on DATE NULL,
            is_current TINYINT(1) NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS semesters (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            school_year_id BIGINT UNSIGNED NOT NULL,
            code VARCHAR(30) NOT NULL,
            name VARCHAR(80) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'active'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS module_records (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            module_key VARCHAR(64) NOT NULL,
            class_id VARCHAR(100) NOT NULL,
            record_key VARCHAR(64) NOT NULL,
            payload_json LONGTEXT NOT NULL,
            occurred_at DATETIME NULL,
            created_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_module_record (module_key, class_id, record_key),
            INDEX idx_module_class (module_key, class_id),
            INDEX idx_module_occurred (occurred_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS binary_assets (
            id CHAR(32) PRIMARY KEY,
            entity_type VARCHAR(64) NOT NULL,
            entity_id VARCHAR(100) NOT NULL,
            filename VARCHAR(255) NOT NULL,
            mime_type VARCHAR(120) NOT NULL,
            content_blob LONGBLOB NOT NULL,
            byte_size BIGINT UNSIGNED NOT NULL,
            sha256 CHAR(64) NOT NULL,
            created_by BIGINT UNSIGNED NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_asset_entity (entity_type, entity_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        "CREATE TABLE IF NOT EXISTS student_qr_tokens (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(100) NOT NULL,
            student_code VARCHAR(100) NULL,
            qr_token VARCHAR(255) NOT NULL,
            qr_asset_id CHAR(32) NULL,
            version INT NOT NULL DEFAULT 1,
            is_revoked TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_qr_student (student_id),
            INDEX idx_qr_token (qr_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];
    foreach ($queries as $query) {
        try { $pdo->exec($query); } catch (Throwable $ignored) {}
    }
    $alters = [
        "ALTER TABLE users ADD COLUMN avatar_asset_id CHAR(32) NULL",
        "ALTER TABLE students ADD COLUMN avatar_asset_id CHAR(32) NULL",
        "ALTER TABLE student_qr_tokens ADD COLUMN student_code VARCHAR(100) NULL",
        "ALTER TABLE student_qr_tokens ADD COLUMN qr_asset_id CHAR(32) NULL",
        "ALTER TABLE attendance_sessions ADD COLUMN created_by BIGINT UNSIGNED NULL",
        "ALTER TABLE attendance_records ADD COLUMN method VARCHAR(50) NOT NULL DEFAULT 'MANUAL'",
        "ALTER TABLE attendance_records ADD COLUMN verified_by VARCHAR(150) NULL",
        "ALTER TABLE attendance_records ADD COLUMN scanned_at DATETIME NULL",
        "ALTER TABLE attendance_sessions ADD UNIQUE KEY uniq_attendance_session (class_id, session_date, session_type)",
        "ALTER TABLE attendance_records ADD UNIQUE KEY uniq_attendance_record (session_id, student_id)",
    ];
    foreach ($alters as $query) {
        try { $pdo->exec($query); } catch (Throwable $ignored) {}
    }
}

function setSessionCookieV2(string $token, int $expires): void
{
    setcookie('thcs_session', $token, [
        'expires' => $expires, 'path' => '/thcs/', 'secure' => true,
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}

function clearSessionCookieV2(): void
{
    setcookie('thcs_session', '', [
        'expires' => time() - 3600, 'path' => '/thcs/', 'secure' => true,
        'httponly' => true, 'samesite' => 'Lax',
    ]);
}

function currentSessionV2(PDO $pdo, bool $csrfRequired = false): array
{
    $token = $_COOKIE['thcs_session'] ?? '';
    if (!is_string($token) || strlen($token) < 32) {
        jsonResponseV2(['success' => false, 'error' => 'AUTH_REQUIRED'], 401);
    }
    $hash = hash('sha256', $token);
    $statement = $pdo->prepare(
        "SELECT s.csrf_token, u.id, u.public_id, u.name, u.username, u.email, u.phone, u.role, u.status,
                CASE WHEN u.avatar_asset_id IS NULL THEN NULL ELSE CONCAT('/thcs/api/binary?id=', u.avatar_asset_id) END AS avatar_url
         FROM server_sessions s INNER JOIN users u ON u.id = s.user_id
         WHERE s.session_hash = :hash AND s.expires_at > NOW() AND u.status = 'active' LIMIT 1"
    );
    $statement->execute([':hash' => $hash]);
    $session = $statement->fetch();
    if (!$session) {
        clearSessionCookieV2();
        jsonResponseV2(['success' => false, 'error' => 'SESSION_EXPIRED'], 401);
    }
    if ($csrfRequired) {
        $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!is_string($provided) || !hash_equals((string) $session['csrf_token'], $provided)) {
            jsonResponseV2(['success' => false, 'error' => 'CSRF_INVALID'], 419);
        }
    }
    $pdo->prepare("UPDATE server_sessions SET last_seen_at = NOW() WHERE session_hash = :hash")
        ->execute([':hash' => $hash]);
    return $session;
}

function logActivityV2(PDO $pdo, array $session, string $action, string $description, ?string $classId = null): void
{
    $statement = $pdo->prepare(
        "INSERT INTO activity_logs (user_id, user_name, user_role, action_type, description, class_id, ip_address)
         VALUES (:uid, :name, :role, :action, :description, :class_id, :ip)"
    );
    $statement->execute([
        ':uid' => (string) $session['id'], ':name' => (string) $session['name'],
        ':role' => (string) $session['role'], ':action' => $action,
        ':description' => $description, ':class_id' => $classId,
        ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
}

function studentRowsV2(PDO $pdo, string $classId): array
{
    $statement = $pdo->prepare(
        "SELECT s.*,
                CASE WHEN s.avatar_asset_id IS NULL THEN NULL ELSE CONCAT('/thcs/api/binary?id=', s.avatar_asset_id) END AS avatar_url
         FROM students s WHERE s.class_id = :class_id
         ORDER BY COALESCE(s.roll_number, 999999), s.full_name"
    );
    $statement->execute([':class_id' => $classId]);
    return $statement->fetchAll() ?: [];
}

function moduleRowsV2(PDO $pdo, string $module, string $classId, int $limit = 500): array
{
    $limit = max(1, min(1000, $limit));
    $statement = $pdo->prepare(
        "SELECT id, record_key, payload_json, occurred_at, created_at, updated_at
         FROM module_records WHERE module_key = :module AND class_id = :class_id
         ORDER BY COALESCE(occurred_at, created_at) DESC, id DESC LIMIT {$limit}"
    );
    $statement->execute([':module' => $module, ':class_id' => $classId]);
    $rows = [];
    foreach ($statement->fetchAll() ?: [] as $row) {
        $payload = json_decode((string) $row['payload_json'], true);
        $rows[] = array_merge(is_array($payload) ? $payload : [], [
            'id' => (int) $row['id'], 'record_key' => $row['record_key'],
            'occurred_at' => $row['occurred_at'], 'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ]);
    }
    return $rows;
}

function validModuleV2(string $module): bool
{
    return (bool) preg_match('/^[a-z][a-z0-9_-]{1,63}$/', $module);
}

$originV2 = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($originV2 !== '') {
    $allowedOriginsV2 = ['https://vie.info.vn', 'http://localhost:5173', 'http://127.0.0.1:5173'];
    if (in_array($originV2, $allowedOriginsV2, true)) {
        header('Access-Control-Allow-Origin: ' . $originV2);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
header('Cache-Control: no-store, private');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
set_exception_handler(function (Throwable $error): void {
    error_log($error->getMessage());
    jsonResponseV2(['success' => false, 'error' => 'SERVER_ERROR'], 500);
});

if (!isset($pdo) || !($pdo instanceof PDO)) {
    jsonResponseV2(['success' => false, 'error' => 'DATABASE_UNAVAILABLE'], 503);
}
$pdoV2 = $pdo;
schemaV2($pdoV2);
$routeV2 = apiRouteV2();
$methodV2 = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($routeV2 === '/' && $methodV2 === 'GET') {
    jsonResponseV2(['status' => 'ONLINE', 'session' => 'mysql-http-only']);
}

if ($routeV2 === '/auth/login' && $methodV2 === 'POST') {
    $input = requestBodyV2();
    $username = trim((string) ($input['username'] ?? ''));
    $password = (string) ($input['password'] ?? '');
    if ($username === '' || $password === '') {
        jsonResponseV2(['success' => false, 'error' => 'Nhập đầy đủ tài khoản và mật khẩu'], 422);
    }
    $statement = $pdoV2->prepare("SELECT * FROM users WHERE username = :username AND status = 'active' LIMIT 1");
    $statement->execute([':username' => $username]);
    $user = $statement->fetch();
    if (!$user || !password_verify($password, (string) $user['password'])) {
        jsonResponseV2(['success' => false, 'error' => 'Tài khoản hoặc mật khẩu không đúng'], 401);
    }
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $csrf = bin2hex(random_bytes(32));
    $expires = time() + 28800;
    transactionV2($pdoV2, function () use ($pdoV2, $hash, $csrf, $expires, $user): void {
        $pdoV2->prepare("DELETE FROM server_sessions WHERE expires_at <= NOW()")->execute();
        $statement = $pdoV2->prepare(
            "INSERT INTO server_sessions
             (session_hash, user_id, csrf_token, ip_address, user_agent, expires_at, last_seen_at)
             VALUES (:hash, :user_id, :csrf, :ip, :agent, :expires_at, NOW())"
        );
        $statement->execute([
            ':hash' => $hash, ':user_id' => $user['id'], ':csrf' => $csrf,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            ':expires_at' => date('Y-m-d H:i:s', $expires),
        ]);
        logActivityV2($pdoV2, [
            'id' => $user['id'], 'name' => $user['name'], 'role' => $user['role'],
        ], 'ĐĂNG NHẬP', 'Đăng nhập bằng session MySQL');
    });
    setSessionCookieV2($token, $expires);
    jsonResponseV2([
        'success' => true, 'committed' => true, 'csrf_token' => $csrf,
        'user' => [
            'id' => (int) $user['id'], 'public_id' => $user['public_id'],
            'name' => $user['name'], 'username' => $user['username'],
            'email' => $user['email'], 'phone' => $user['phone'],
            'role' => $user['role'], 'status' => $user['status'],
            'avatar_url' => !empty($user['avatar_asset_id']) ? '/thcs/api/binary?id=' . $user['avatar_asset_id'] : null,
        ],
    ]);
}

if ($routeV2 === '/auth/session' && $methodV2 === 'GET') {
    $authSession = currentSessionV2($pdoV2);
    jsonResponseV2([
        'success' => true, 'csrf_token' => $authSession['csrf_token'],
        'user' => [
            'id' => (int) $authSession['id'], 'public_id' => $authSession['public_id'],
            'name' => $authSession['name'], 'username' => $authSession['username'],
            'email' => $authSession['email'], 'phone' => $authSession['phone'],
            'role' => $authSession['role'], 'status' => $authSession['status'],
            'avatar_url' => $authSession['avatar_url'],
        ],
    ]);
}

$sessionV2 = currentSessionV2($pdoV2, in_array($methodV2, ['POST', 'PUT', 'PATCH', 'DELETE'], true));

if ($routeV2 === '/auth/logout' && $methodV2 === 'POST') {
    $token = (string) ($_COOKIE['thcs_session'] ?? '');
    transactionV2($pdoV2, function () use ($pdoV2, $token, $sessionV2): void {
        logActivityV2($pdoV2, $sessionV2, 'ĐĂNG XUẤT', 'Kết thúc session MySQL');
        $pdoV2->prepare("DELETE FROM server_sessions WHERE session_hash = :hash")
            ->execute([':hash' => hash('sha256', $token)]);
    });
    clearSessionCookieV2();
    jsonResponseV2(['success' => true, 'committed' => true]);
}

if ($routeV2 === '/bootstrap' && $methodV2 === 'GET') {
    $classes = $pdoV2->query(
        "SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
         FROM classes c ORDER BY c.name"
    )->fetchAll() ?: [];
    $schoolYears = $pdoV2->query("SELECT * FROM school_years ORDER BY is_current DESC, starts_on DESC")->fetchAll() ?: [];
    $semesters = $pdoV2->query("SELECT * FROM semesters ORDER BY school_year_id DESC, id")->fetchAll() ?: [];
    jsonResponseV2([
        'success' => true, 'classes' => $classes,
        'school_years' => $schoolYears, 'semesters' => $semesters,
    ]);
}

if ($routeV2 === '/classes') {
    if ($methodV2 === 'GET') {
        $classes = $pdoV2->query(
            "SELECT c.*, (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
             FROM classes c ORDER BY c.name"
        )->fetchAll() ?: [];
        jsonResponseV2(['success' => true, 'classes' => $classes]);
    }
    if ($methodV2 === 'POST') {
        $input = requestBodyV2();
        $id = trim((string) ($input['id'] ?? ''));
        $name = trim((string) ($input['name'] ?? ''));
        if ($id === '' || $name === '') {
            jsonResponseV2(['success' => false, 'error' => 'Thiếu mã hoặc tên lớp'], 422);
        }
        transactionV2($pdoV2, function () use ($pdoV2, $input, $id, $name, $sessionV2): void {
            $statement = $pdoV2->prepare(
                "INSERT INTO classes
                 (id, code, name, grade_level, room, capacity, homeroom_teacher_id, homeroom_teacher_name, status)
                 VALUES (:id, :code, :name, :grade, :room, :capacity, :teacher_id, :teacher_name, :status)
                 ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), grade_level = VALUES(grade_level),
                 room = VALUES(room), capacity = VALUES(capacity), homeroom_teacher_id = VALUES(homeroom_teacher_id),
                 homeroom_teacher_name = VALUES(homeroom_teacher_name), status = VALUES(status)"
            );
            $statement->execute([
                ':id' => $id, ':code' => (string) ($input['code'] ?? ''),
                ':name' => $name, ':grade' => (string) ($input['grade_level'] ?? ''),
                ':room' => $input['room'] ?? null, ':capacity' => (int) ($input['capacity'] ?? 0),
                ':teacher_id' => $input['homeroom_teacher_id'] ?? null,
                ':teacher_name' => $input['homeroom_teacher_name'] ?? null,
                ':status' => (string) ($input['status'] ?? 'active'),
            ]);
            logActivityV2($pdoV2, $sessionV2, 'LỚP HỌC', 'Đã commit thông tin lớp ' . $name, $id);
        });
        jsonResponseV2(['success' => true, 'committed' => true]);
    }
}

if ($routeV2 === '/students') {
    $studentInput = requestBodyV2();
    $classId = trim((string) ($_GET['class_id'] ?? ($studentInput['class_id'] ?? '')));
    if ($classId === '') jsonResponseV2(['success' => false, 'error' => 'Thiếu class_id'], 422);
    if ($methodV2 === 'GET') {
        jsonResponseV2(['success' => true, 'students' => studentRowsV2($pdoV2, $classId)]);
    }
    if ($methodV2 === 'POST') {
        $students = $studentInput['students'] ?? null;
        if (!is_array($students)) {
            jsonResponseV2(['success' => false, 'error' => 'Danh sách học sinh không hợp lệ'], 422);
        }
        transactionV2($pdoV2, function () use ($pdoV2, $classId, $students, $sessionV2): void {
            $keptIds = [];
            foreach ($students as $student) {
                if (!is_array($student) || trim((string) ($student['full_name'] ?? '')) === '') {
                    throw new RuntimeException('Hồ sơ học sinh thiếu họ tên');
                }
                $publicId = trim((string) ($student['public_id'] ?? ''));
                if ($publicId === '') $publicId = 'HS-' . bin2hex(random_bytes(5));
                $studentCode = trim((string) ($student['student_code'] ?? ''));
                if ($studentCode === '') throw new RuntimeException('STUDENT_CODE_REQUIRED');
                $params = [
                    ':public_id' => $publicId,
                    ':student_code' => $studentCode,
                    ':first_name' => $student['first_name'] ?? null,
                    ':last_name' => $student['last_name'] ?? null,
                    ':full_name' => trim((string) $student['full_name']),
                    ':gender' => $student['gender'] ?? null,
                    ':date_of_birth' => $student['date_of_birth'] ?: null,
                    ':address' => $student['address'] ?? null,
                    ':status' => (string) ($student['status'] ?? 'đang học'),
                    ':class_id' => $classId, ':class_name' => $student['class_name'] ?? null,
                    ':group_name' => $student['group_name'] ?? null,
                    ':roll_number' => $student['roll_number'] ?? null,
                    ':guardian_name' => $student['primary_guardian_name'] ?? null,
                    ':guardian_phone' => $student['primary_guardian_phone'] ?? null,
                    ':health_note' => $student['health_note'] ?? null,
                ];
                $studentId = (int) ($student['id'] ?? 0);
                if ($studentId > 0) {
                    $params[':id'] = $studentId;
                    $statement = $pdoV2->prepare(
                        "UPDATE students SET public_id = :public_id, student_code = :student_code,
                         first_name = :first_name, last_name = :last_name, full_name = :full_name,
                         gender = :gender, date_of_birth = :date_of_birth, address = :address, status = :status,
                         class_id = :class_id, class_name = :class_name, group_name = :group_name,
                         roll_number = :roll_number, primary_guardian_name = :guardian_name,
                         primary_guardian_phone = :guardian_phone, health_note = :health_note WHERE id = :id"
                    );
                    $statement->execute($params);
                    $keptIds[] = $studentId;
                } else {
                    $statement = $pdoV2->prepare(
                        "INSERT INTO students
                         (public_id, student_code, first_name, last_name, full_name, gender, date_of_birth,
                          address, status, class_id, class_name, group_name, roll_number,
                          primary_guardian_name, primary_guardian_phone, health_note)
                         VALUES (:public_id, :student_code, :first_name, :last_name, :full_name, :gender,
                          :date_of_birth, :address, :status, :class_id, :class_name, :group_name, :roll_number,
                          :guardian_name, :guardian_phone, :health_note)"
                    );
                    $statement->execute($params);
                    $keptIds[] = (int) $pdoV2->lastInsertId();
                }
            }
            if ($keptIds) {
                $marks = implode(',', array_fill(0, count($keptIds), '?'));
                $delete = $pdoV2->prepare("DELETE FROM students WHERE class_id = ? AND id NOT IN ({$marks})");
                $delete->execute(array_merge([$classId], $keptIds));
            } else {
                $pdoV2->prepare("DELETE FROM students WHERE class_id = :class_id")
                    ->execute([':class_id' => $classId]);
            }
            $pdoV2->prepare("UPDATE classes SET student_count = :count WHERE id = :class_id")
                ->execute([':count' => count($students), ':class_id' => $classId]);
            logActivityV2($pdoV2, $sessionV2, 'HỌC SINH', 'Đã commit ' . count($students) . ' hồ sơ', $classId);
        });
        jsonResponseV2([
            'success' => true, 'committed' => true,
            'students' => studentRowsV2($pdoV2, $classId),
        ]);
    }
}

if (strpos($routeV2, '/modules/') === 0) {
    $module = substr($routeV2, strlen('/modules/'));
    if (!validModuleV2($module)) {
        jsonResponseV2(['success' => false, 'error' => 'Module không hợp lệ'], 422);
    }
    $moduleInput = requestBodyV2();
    $classId = trim((string) ($_GET['class_id'] ?? ($moduleInput['class_id'] ?? '')));
    if ($classId === '') jsonResponseV2(['success' => false, 'error' => 'Thiếu class_id'], 422);
    if ($methodV2 === 'GET') {
        jsonResponseV2(['success' => true, 'records' => moduleRowsV2($pdoV2, $module, $classId)]);
    }
    if ($methodV2 === 'POST') {
        $records = $moduleInput['records'] ?? (isset($moduleInput['record']) ? [$moduleInput['record']] : null);
        if (!is_array($records)) {
            jsonResponseV2(['success' => false, 'error' => 'Dữ liệu module không hợp lệ'], 422);
        }
        $mode = ($moduleInput['mode'] ?? 'merge') === 'replace' ? 'replace' : 'merge';
        transactionV2($pdoV2, function () use ($pdoV2, $module, $classId, $records, $mode, $sessionV2): void {
            if ($mode === 'replace') {
                $pdoV2->prepare("DELETE FROM module_records WHERE module_key = :module AND class_id = :class_id")
                    ->execute([':module' => $module, ':class_id' => $classId]);
            }
            $statement = $pdoV2->prepare(
                "INSERT INTO module_records
                 (module_key, class_id, record_key, payload_json, occurred_at, created_by)
                 VALUES (:module, :class_id, :record_key, :payload, :occurred_at, :created_by)
                 ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), occurred_at = VALUES(occurred_at),
                 created_by = VALUES(created_by)"
            );
            foreach ($records as $record) {
                if (!is_array($record)) throw new RuntimeException('Bản ghi module không hợp lệ');
                $key = trim((string) ($record['record_key'] ?? ''));
                if ($key === '') $key = bin2hex(random_bytes(12));
                $occurredAt = $record['occurred_at'] ?? $record['published_at'] ?? $record['due_at'] ?? null;
                unset($record['id'], $record['record_key'], $record['created_at'], $record['updated_at']);
                $statement->execute([
                    ':module' => $module, ':class_id' => $classId, ':record_key' => $key,
                    ':payload' => json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ':occurred_at' => $occurredAt ?: null, ':created_by' => $sessionV2['id'],
                ]);
            }
            logActivityV2($pdoV2, $sessionV2, strtoupper($module), 'Đã commit ' . count($records) . ' bản ghi', $classId);
        });
        jsonResponseV2([
            'success' => true, 'committed' => true,
            'records' => moduleRowsV2($pdoV2, $module, $classId),
        ]);
    }
    if ($methodV2 === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) jsonResponseV2(['success' => false, 'error' => 'Thiếu ID bản ghi'], 422);
        transactionV2($pdoV2, function () use ($pdoV2, $id, $module, $classId, $sessionV2): void {
            $pdoV2->prepare(
                "DELETE FROM module_records WHERE id = :id AND module_key = :module AND class_id = :class_id"
            )->execute([':id' => $id, ':module' => $module, ':class_id' => $classId]);
            logActivityV2($pdoV2, $sessionV2, strtoupper($module), 'Đã commit xóa bản ghi', $classId);
        });
        jsonResponseV2(['success' => true, 'committed' => true]);
    }
}

if ($routeV2 === '/attendance') {
    $attendanceInput = requestBodyV2();
    $classId = trim((string) ($_GET['class_id'] ?? ($attendanceInput['class_id'] ?? '')));
    $date = (string) ($_GET['session_date'] ?? ($attendanceInput['session_date'] ?? date('Y-m-d')));
    $type = (string) ($_GET['session_type'] ?? ($attendanceInput['session_type'] ?? 'morning'));
    if ($classId === '') jsonResponseV2(['success' => false, 'error' => 'Thiếu class_id'], 422);
    if ($methodV2 === 'GET') {
        $statement = $pdoV2->prepare(
            "SELECT * FROM attendance_sessions
             WHERE class_id = :class_id AND session_date = :date AND session_type = :type LIMIT 1"
        );
        $statement->execute([':class_id' => $classId, ':date' => $date, ':type' => $type]);
        $attendanceSession = $statement->fetch();
        $records = [];
        if ($attendanceSession) {
            $recordStatement = $pdoV2->prepare("SELECT * FROM attendance_records WHERE session_id = :id ORDER BY id");
            $recordStatement->execute([':id' => $attendanceSession['id']]);
            $records = $recordStatement->fetchAll() ?: [];
        }
        jsonResponseV2(['success' => true, 'session' => $attendanceSession ?: null, 'records' => $records]);
    }
    if ($methodV2 === 'POST') {
        $records = $attendanceInput['records'] ?? null;
        if (!is_array($records)) {
            jsonResponseV2(['success' => false, 'error' => 'Danh sách điểm danh không hợp lệ'], 422);
        }
        $attendanceSessionId = transactionV2(
            $pdoV2,
            function () use ($pdoV2, $classId, $date, $type, $records, $attendanceInput, $sessionV2): int {
                $select = $pdoV2->prepare(
                    "SELECT id FROM attendance_sessions
                     WHERE class_id = :class_id AND session_date = :date AND session_type = :type LIMIT 1 FOR UPDATE"
                );
                $select->execute([':class_id' => $classId, ':date' => $date, ':type' => $type]);
                $existingId = $select->fetchColumn();
                if ($existingId) {
                    $id = (int) $existingId;
                    $pdoV2->prepare("UPDATE attendance_sessions SET is_locked = :locked WHERE id = :id")
                        ->execute([':locked' => !empty($attendanceInput['is_locked']) ? 1 : 0, ':id' => $id]);
                } else {
                    $insert = $pdoV2->prepare(
                        "INSERT INTO attendance_sessions
                         (class_id, session_date, session_type, is_locked, created_by)
                         VALUES (:class_id, :date, :type, :locked, :created_by)"
                    );
                    $insert->execute([
                        ':class_id' => $classId, ':date' => $date, ':type' => $type,
                        ':locked' => !empty($attendanceInput['is_locked']) ? 1 : 0,
                        ':created_by' => $sessionV2['id'],
                    ]);
                    $id = (int) $pdoV2->lastInsertId();
                }
                $pdoV2->prepare("DELETE FROM attendance_records WHERE session_id = :id")->execute([':id' => $id]);
                $insertRecord = $pdoV2->prepare(
                    "INSERT INTO attendance_records
                     (session_id, student_id, student_name, status, minutes_late, note, method, verified_by, scanned_at)
                     VALUES (:session_id, :student_id, :student_name, :status, :minutes_late, :note, :method, :verified_by, :scanned_at)"
                );
                foreach ($records as $record) {
                    $insertRecord->execute([
                        ':session_id' => $id, ':student_id' => (string) ($record['student_id'] ?? ''),
                        ':student_name' => (string) ($record['student_name'] ?? ''),
                        ':status' => (string) ($record['status'] ?? 'PRESENT'),
                        ':minutes_late' => $record['minutes_late'] ?? null,
                        ':note' => $record['note'] ?? null,
                        ':method' => (string) ($record['method'] ?? 'MANUAL'),
                        ':verified_by' => $sessionV2['name'],
                        ':scanned_at' => $record['scanned_at'] ?? null,
                    ]);
                }
                logActivityV2($pdoV2, $sessionV2, 'ĐIỂM DANH', 'Đã commit ' . count($records) . ' bản ghi', $classId);
                return $id;
            }
        );
        jsonResponseV2(['success' => true, 'committed' => true, 'session_id' => $attendanceSessionId]);
    }
}

if ($routeV2 === '/binary') {
    if ($methodV2 === 'GET') {
        $id = trim((string) ($_GET['id'] ?? ''));
        $statement = $pdoV2->prepare(
            "SELECT filename, mime_type, content_blob, byte_size, sha256 FROM binary_assets WHERE id = :id"
        );
        $statement->execute([':id' => $id]);
        $asset = $statement->fetch();
        if (!$asset) jsonResponseV2(['success' => false, 'error' => 'Không tìm thấy tệp'], 404);
        header('Content-Type: ' . $asset['mime_type']);
        header('Content-Length: ' . $asset['byte_size']);
        header('Content-Disposition: inline; filename="' . rawurlencode((string) $asset['filename']) . '"');
        header('ETag: "' . $asset['sha256'] . '"');
        echo $asset['content_blob'];
        exit;
    }
    if ($methodV2 === 'POST') {
        $entityType = trim((string) ($_POST['entity_type'] ?? ''));
        $entityId = trim((string) ($_POST['entity_id'] ?? ''));
        if ($entityType === '' || $entityId === '' || empty($_FILES['file']['tmp_name'])) {
            jsonResponseV2(['success' => false, 'error' => 'Thiếu tệp hoặc thông tin liên kết'], 422);
        }
        $tmp = (string) $_FILES['file']['tmp_name'];
        $content = file_get_contents($tmp);
        if ($content === false || strlen($content) === 0) {
            jsonResponseV2(['success' => false, 'error' => 'Tệp rỗng'], 422);
        }
        if (strlen($content) > 12 * 1024 * 1024) {
            jsonResponseV2(['success' => false, 'error' => 'Tệp vượt quá 12MB'], 413);
        }
        $assetId = bin2hex(random_bytes(16));
        $filename = basename((string) ($_FILES['file']['name'] ?? 'asset.bin'));
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp) ?: 'application/octet-stream';
        transactionV2(
            $pdoV2,
            function () use ($pdoV2, $assetId, $entityType, $entityId, $filename, $mime, $content, $sessionV2): void {
                $statement = $pdoV2->prepare(
                    "INSERT INTO binary_assets
                     (id, entity_type, entity_id, filename, mime_type, content_blob, byte_size, sha256, created_by)
                     VALUES (:id, :entity_type, :entity_id, :filename, :mime, :content, :size, :sha, :created_by)"
                );
                $statement->bindValue(':id', $assetId);
                $statement->bindValue(':entity_type', $entityType);
                $statement->bindValue(':entity_id', $entityId);
                $statement->bindValue(':filename', $filename);
                $statement->bindValue(':mime', $mime);
                $statement->bindValue(':content', $content, PDO::PARAM_LOB);
                $statement->bindValue(':size', strlen($content), PDO::PARAM_INT);
                $statement->bindValue(':sha', hash('sha256', $content));
                $statement->bindValue(':created_by', $sessionV2['id']);
                $statement->execute();
                if ($entityType === 'student-avatar') {
                    $pdoV2->prepare("UPDATE students SET avatar_asset_id = :asset WHERE id = :id")
                        ->execute([':asset' => $assetId, ':id' => $entityId]);
                } elseif ($entityType === 'user-avatar') {
                    $pdoV2->prepare("UPDATE users SET avatar_asset_id = :asset WHERE id = :id")
                        ->execute([':asset' => $assetId, ':id' => $entityId]);
                } elseif ($entityType === 'qr') {
                    $pdoV2->prepare(
                        "UPDATE student_qr_tokens SET qr_asset_id = :asset
                         WHERE student_id = :student_id AND is_revoked = 0"
                    )->execute([':asset' => $assetId, ':student_id' => $entityId]);
                }
                logActivityV2($pdoV2, $sessionV2, 'TỆP BLOB', 'Đã commit tệp ' . $filename);
            }
        );
        jsonResponseV2([
            'success' => true, 'committed' => true, 'asset_id' => $assetId,
            'url' => '/thcs/api/binary?id=' . $assetId,
        ]);
    }
}

if ($routeV2 === '/qr/token' && $methodV2 === 'POST') {
    $qrInput = requestBodyV2();
    $studentId = trim((string) ($qrInput['student_id'] ?? ''));
    $classId = trim((string) ($qrInput['class_id'] ?? ''));
    if ($studentId === '' && $classId === '') {
        jsonResponseV2(['success' => false, 'error' => 'Thiếu student_id hoặc class_id'], 422);
    }
    $tokens = transactionV2($pdoV2, function () use ($pdoV2, $studentId, $classId, $sessionV2): array {
        if ($studentId !== '') {
            $statement = $pdoV2->prepare("SELECT id, student_code, full_name, class_id FROM students WHERE id = :id");
            $statement->execute([':id' => $studentId]);
        } else {
            $statement = $pdoV2->prepare(
                "SELECT id, student_code, full_name, class_id FROM students WHERE class_id = :class_id ORDER BY id"
            );
            $statement->execute([':class_id' => $classId]);
        }
        $students = $statement->fetchAll() ?: [];
        if (!$students) throw new RuntimeException('Không tìm thấy học sinh để cấp QR');
        $result = [];
        foreach ($students as $student) {
            $find = $pdoV2->prepare(
                "SELECT qr_token, qr_asset_id, version FROM student_qr_tokens
                 WHERE student_id = :student_id AND is_revoked = 0 ORDER BY id DESC LIMIT 1"
            );
            $find->execute([':student_id' => (string) $student['id']]);
            $existing = $find->fetch();
            if (!$existing) {
                $token = 'THCS1.' . bin2hex(random_bytes(24));
                $insert = $pdoV2->prepare(
                    "INSERT INTO student_qr_tokens
                     (student_id, student_code, qr_token, version, is_revoked)
                     VALUES (:student_id, :student_code, :token, 1, 0)"
                );
                $insert->execute([
                    ':student_id' => (string) $student['id'],
                    ':student_code' => $student['student_code'],
                    ':token' => $token,
                ]);
                $existing = ['qr_token' => $token, 'qr_asset_id' => null, 'version' => 1];
            }
            $result[] = [
                'student_id' => (string) $student['id'],
                'student_code' => $student['student_code'],
                'student_name' => $student['full_name'],
                'class_id' => $student['class_id'],
                'qr_token' => $existing['qr_token'],
                'version' => (int) $existing['version'],
                'qr_url' => !empty($existing['qr_asset_id']) ? '/thcs/api/binary?id=' . $existing['qr_asset_id'] : null,
            ];
        }
        logActivityV2($pdoV2, $sessionV2, 'QR', 'Đã commit cấp/đọc ' . count($result) . ' mã QR', $classId ?: null);
        return $result;
    });
    jsonResponseV2(['success' => true, 'committed' => true, 'tokens' => $tokens]);
}

if ($routeV2 === '/qr/revoke' && $methodV2 === 'POST') {
    $qrInput = requestBodyV2();
    $studentId = trim((string) ($qrInput['student_id'] ?? ''));
    if ($studentId === '') jsonResponseV2(['success' => false, 'error' => 'Thiếu student_id'], 422);
    $newQr = transactionV2($pdoV2, function () use ($pdoV2, $studentId, $sessionV2): array {
        $pdoV2->prepare("UPDATE student_qr_tokens SET is_revoked = 1 WHERE student_id = :id AND is_revoked = 0")
            ->execute([':id' => $studentId]);
        $student = $pdoV2->prepare("SELECT student_code, class_id FROM students WHERE id = :id");
        $student->execute([':id' => $studentId]);
        $row = $student->fetch();
        if (!$row) throw new RuntimeException('Không tìm thấy học sinh');
        $versionStatement = $pdoV2->prepare(
            "SELECT COALESCE(MAX(version), 0) + 1 FROM student_qr_tokens WHERE student_id = :id"
        );
        $versionStatement->execute([':id' => $studentId]);
        $version = (int) $versionStatement->fetchColumn();
        $token = 'THCS1.' . bin2hex(random_bytes(24));
        $pdoV2->prepare(
            "INSERT INTO student_qr_tokens (student_id, student_code, qr_token, version, is_revoked)
             VALUES (:student_id, :student_code, :token, :version, 0)"
        )->execute([
            ':student_id' => $studentId, ':student_code' => $row['student_code'],
            ':token' => $token, ':version' => $version,
        ]);
        logActivityV2($pdoV2, $sessionV2, 'QR', 'Đã commit thu hồi và cấp QR mới', (string) $row['class_id']);
        return ['qr_token' => $token, 'version' => $version];
    });
    jsonResponseV2(['success' => true, 'committed' => true] + $newQr);
}

if ($routeV2 === '/qr/scan-lookup' && $methodV2 === 'POST') {
    $qrInput = requestBodyV2();
    $token = trim((string) ($qrInput['qr_token'] ?? ''));
    $classId = trim((string) ($qrInput['class_id'] ?? ''));
    if ($token === '' || $classId === '') {
        jsonResponseV2(['success' => false, 'error' => 'Thiếu mã QR hoặc lớp'], 422);
    }
    $statement = $pdoV2->prepare(
        "SELECT s.id AS student_id, s.student_code, s.full_name, s.gender, s.class_id,
                CASE WHEN s.avatar_asset_id IS NULL THEN NULL ELSE CONCAT('/thcs/api/binary?id=', s.avatar_asset_id) END AS avatar_url,
                q.version
         FROM student_qr_tokens q INNER JOIN students s ON CAST(s.id AS CHAR) = q.student_id
         WHERE q.qr_token = :token AND q.is_revoked = 0 LIMIT 1"
    );
    $statement->execute([':token' => $token]);
    $student = $statement->fetch();
    if (!$student) jsonResponseV2(['success' => false, 'error' => 'QR_NOT_FOUND'], 404);
    if ((string) $student['class_id'] !== $classId) {
        jsonResponseV2(['success' => false, 'error' => 'QR_WRONG_CLASS'], 409);
    }
    jsonResponseV2(['success' => true, 'student' => $student]);
}

if ($routeV2 === '/qr/confirm-attendance' && $methodV2 === 'POST') {
    $qrInput = requestBodyV2();
    $studentId = trim((string) ($qrInput['student_id'] ?? ''));
    $classId = trim((string) ($qrInput['class_id'] ?? ''));
    $date = (string) ($qrInput['session_date'] ?? date('Y-m-d'));
    $type = (string) ($qrInput['session_type'] ?? 'morning');
    if ($studentId === '' || $classId === '') {
        jsonResponseV2(['success' => false, 'error' => 'Thiếu học sinh hoặc lớp'], 422);
    }
    $recordId = transactionV2(
        $pdoV2,
        function () use ($pdoV2, $studentId, $classId, $date, $type, $qrInput, $sessionV2): int {
            $studentStatement = $pdoV2->prepare(
                "SELECT full_name FROM students WHERE id = :id AND class_id = :class_id"
            );
            $studentStatement->execute([':id' => $studentId, ':class_id' => $classId]);
            $studentName = $studentStatement->fetchColumn();
            if (!$studentName) throw new RuntimeException('Học sinh không thuộc lớp');
            $find = $pdoV2->prepare(
                "SELECT id FROM attendance_sessions
                 WHERE class_id = :class_id AND session_date = :date AND session_type = :type LIMIT 1 FOR UPDATE"
            );
            $find->execute([':class_id' => $classId, ':date' => $date, ':type' => $type]);
            $attendanceId = $find->fetchColumn();
            if (!$attendanceId) {
                $insertSession = $pdoV2->prepare(
                    "INSERT INTO attendance_sessions
                     (class_id, session_date, session_type, is_locked, created_by)
                     VALUES (:class_id, :date, :type, 0, :created_by)"
                );
                $insertSession->execute([
                    ':class_id' => $classId, ':date' => $date,
                    ':type' => $type, ':created_by' => $sessionV2['id'],
                ]);
                $attendanceId = (int) $pdoV2->lastInsertId();
            }
            $statement = $pdoV2->prepare(
                "INSERT INTO attendance_records
                 (session_id, student_id, student_name, status, minutes_late, note, method, verified_by, scanned_at)
                 VALUES (:session_id, :student_id, :student_name, :status, :minutes_late, :note, 'QR_CAMERA', :verified_by, NOW())
                 ON DUPLICATE KEY UPDATE status = VALUES(status), minutes_late = VALUES(minutes_late),
                 note = VALUES(note), method = 'QR_CAMERA', verified_by = VALUES(verified_by), scanned_at = NOW()"
            );
            $statement->execute([
                ':session_id' => $attendanceId, ':student_id' => $studentId,
                ':student_name' => $studentName,
                ':status' => (string) ($qrInput['status'] ?? 'PRESENT'),
                ':minutes_late' => $qrInput['minutes_late'] ?? null,
                ':note' => $qrInput['note'] ?? null, ':verified_by' => $sessionV2['name'],
            ]);
            logActivityV2($pdoV2, $sessionV2, 'ĐIỂM DANH QR', 'Đã commit QR cho ' . $studentName, $classId);
            return (int) $pdoV2->lastInsertId();
        }
    );
    jsonResponseV2(['success' => true, 'committed' => true, 'record_id' => $recordId]);
}

if ($routeV2 === '/dashboard' && $methodV2 === 'GET') {
    $classId = trim((string) ($_GET['class_id'] ?? ''));
    if ($classId === '') jsonResponseV2(['success' => false, 'error' => 'Thiếu class_id'], 422);
    $classStatement = $pdoV2->prepare("SELECT * FROM classes WHERE id = :id LIMIT 1");
    $classStatement->execute([':id' => $classId]);
    $class = $classStatement->fetch();
    if (!$class) jsonResponseV2(['success' => false, 'error' => 'Không tìm thấy lớp'], 404);
    $studentCount = $pdoV2->prepare("SELECT COUNT(*) FROM students WHERE class_id = :id");
    $studentCount->execute([':id' => $classId]);

    $todayAttendance = $pdoV2->prepare(
        "SELECT ar.status, COUNT(*) AS total FROM attendance_records ar
         INNER JOIN attendance_sessions ats ON ats.id = ar.session_id
         WHERE ats.class_id = :class_id AND ats.session_date = CURDATE() GROUP BY ar.status"
    );
    $todayAttendance->execute([':class_id' => $classId]);
    $attendanceStatus = [];
    foreach ($todayAttendance->fetchAll() ?: [] as $row) {
        $attendanceStatus[$row['status']] = (int) $row['total'];
    }

    $trendStatement = $pdoV2->prepare(
        "SELECT ats.session_date, ar.status, COUNT(*) AS total FROM attendance_sessions ats
         INNER JOIN attendance_records ar ON ar.session_id = ats.id
         WHERE ats.class_id = :class_id AND ats.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY ats.session_date, ar.status ORDER BY ats.session_date"
    );
    $trendStatement->execute([':class_id' => $classId]);
    $trend = [];
    foreach ($trendStatement->fetchAll() ?: [] as $row) {
        $key = (string) $row['session_date'];
        if (!isset($trend[$key])) $trend[$key] = ['date' => $key, 'present' => 0, 'absent' => 0, 'late' => 0];
        if ($row['status'] === 'PRESENT') $trend[$key]['present'] += (int) $row['total'];
        elseif ($row['status'] === 'LATE') $trend[$key]['late'] += (int) $row['total'];
        else $trend[$key]['absent'] += (int) $row['total'];
    }

    $moduleKeys = [
        'announcements', 'assignments', 'conduct', 'incidents', 'leave-requests',
        'gradebook', 'timetable', 'lesson-logs', 'posts', 'seating-chart', 'reports',
    ];
    $moduleData = [];
    $moduleCounts = [];
    foreach ($moduleKeys as $key) {
        $moduleData[$key] = moduleRowsV2($pdoV2, $key, $classId, 100);
        $moduleCounts[$key] = count($moduleData[$key]);
    }
    $scores = [];
    foreach ($moduleData['gradebook'] as $gradeRecord) {
        foreach (['tx1', 'tx2', 'tx3', 'gk', 'ck', 'dtb', 'score'] as $field) {
            if (isset($gradeRecord[$field]) && is_numeric($gradeRecord[$field])) {
                $scores[] = (float) $gradeRecord[$field];
            }
        }
    }
    $gradeDistribution = [
        ['label' => 'Dưới 5', 'count' => 0], ['label' => '5–6.4', 'count' => 0],
        ['label' => '6.5–7.9', 'count' => 0], ['label' => '8–10', 'count' => 0],
    ];
    foreach ($scores as $score) {
        if ($score < 5) $gradeDistribution[0]['count']++;
        elseif ($score < 6.5) $gradeDistribution[1]['count']++;
        elseif ($score < 8) $gradeDistribution[2]['count']++;
        else $gradeDistribution[3]['count']++;
    }
    $averageScore = count($scores) > 0 ? round(array_sum($scores) / count($scores), 2) : null;
    $activityStatement = $pdoV2->prepare(
        "SELECT id, user_name, user_role, action_type, description, created_at
         FROM activity_logs WHERE class_id = :class_id ORDER BY id DESC LIMIT 12"
    );
    $activityStatement->execute([':class_id' => $classId]);
    $absenceCount = 0;
    foreach ($attendanceStatus as $status => $count) {
        if (!in_array($status, ['PRESENT', 'LATE'], true)) $absenceCount += $count;
    }
    jsonResponseV2([
        'success' => true, 'generated_at' => date(DATE_ATOM), 'class' => $class,
        'kpis' => [
            'students' => (int) $studentCount->fetchColumn(),
            'present_today' => $attendanceStatus['PRESENT'] ?? 0,
            'late_today' => $attendanceStatus['LATE'] ?? 0,
            'absent_today' => $absenceCount, 'average_score' => $averageScore,
            'pending_assignments' => count(array_filter(
                $moduleData['assignments'],
                static fn($item) => !in_array(strtoupper((string) ($item['status'] ?? '')), ['COMPLETED', 'CLOSED'], true)
            )),
            'open_incidents' => count(array_filter(
                $moduleData['incidents'],
                static fn($item) => !in_array(($item['status'] ?? ''), ['RESOLVED', 'CLOSED'], true)
            )),
            'pending_leaves' => count(array_filter(
                $moduleData['leave-requests'], static fn($item) => ($item['status'] ?? '') === 'PENDING'
            )),
        ],
        'attendance_trend' => array_values($trend), 'grade_distribution' => $gradeDistribution,
        'module_counts' => $moduleCounts, 'modules' => $moduleData,
        'recent_activity' => $activityStatement->fetchAll() ?: [],
    ]);
}

if ($routeV2 === '/users' && $methodV2 === 'GET') {
    $users = $pdoV2->query(
        "SELECT id, public_id, name, username, email, phone, role, status, created_at,
                CASE WHEN avatar_asset_id IS NULL THEN NULL ELSE CONCAT('/thcs/api/binary?id=', avatar_asset_id) END AS avatar_url
         FROM users ORDER BY name"
    )->fetchAll() ?: [];
    jsonResponseV2(['success' => true, 'users' => $users]);
}

if ($routeV2 === '/logs' && $methodV2 === 'GET') {
    $logs = $pdoV2->query(
        "SELECT id, user_id, user_name, user_role, action_type, description, class_id, ip_address, created_at
         FROM activity_logs ORDER BY id DESC LIMIT 500"
    )->fetchAll() ?: [];
    jsonResponseV2(['success' => true, 'logs' => $logs]);
}

jsonResponseV2(['success' => false, 'error' => 'API_NOT_FOUND', 'route' => $routeV2], 404);
