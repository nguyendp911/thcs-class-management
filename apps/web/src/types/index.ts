export type RoleType = 'superadmin' | 'admin' | 'homeroom_teacher' | 'subject_teacher' | 'parent' | 'student' | 'standard_user';

export type AttendanceStatus = 'NOT_YET' | 'PRESENT' | 'EXCUSED_ABSENCE' | 'UNEXCUSED_ABSENCE' | 'LATE' | 'EXEMPT' | 'EARLY_LEAVE' | 'TRUANCY';

export interface User {
  id: number;
  public_id: string;
  name: string;
  email: string;
  username?: string;
  role: RoleType;
  phone?: string;
  avatar?: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  must_change_password?: boolean;
  activation_request?: {
    target_role: RoleType;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
  };
}

export interface RoleActivationRequest {
  id: number;
  user_id: number;
  username: string;
  user_name: string;
  account_type: 'HS' | 'GVBM';
  requested_role: RoleType;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface RolePermissionMatrix {
  role: RoleType;
  role_name: string;
  permissions: string[];
}

export interface SchoolYear {
  id: number;
  name: string;
  starts_on: string;
  ends_on: string;
  is_current: boolean;
}

export interface Semester {
  id: number;
  code: string;
  name: string;
  school_year_id: number;
  status: 'active' | 'closed';
}

export interface ClassItem {
  id: number;
  code: string;
  name: string;
  grade_level: string;
  room: string;
  capacity: number;
  student_count: number;
  homeroom_teacher_id: number;
  homeroom_teacher_name: string;
}

export interface StudentTag {
  id: number;
  name: string;
  color: string;
  is_sensitive?: boolean;
}

export interface Student {
  id: number;
  public_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url?: string;
  gender: 'nam' | 'nữ';
  date_of_birth: string;
  address: string;
  status: 'đang học' | 'bảo lưu' | 'chuyển lớp' | 'thôi học';
  class_id: number;
  class_name: string;
  group_name?: string;
  roll_number?: number;
  primary_guardian_name?: string;
  primary_guardian_phone?: string;
  health_note?: string;
  tags?: StudentTag[];
  warnings?: string[];
}

export interface Guardian {
  id: number;
  student_id: number;
  full_name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  is_primary: boolean;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: number;
  status: AttendanceStatus;
  minutes_late?: number;
  note?: string;
  matched_leave_request_id?: number;
}

export interface AttendanceSession {
  id: number;
  class_id: number;
  session_date: string;
  session_type: 'morning' | 'afternoon' | 'full_day';
  status: 'open' | 'locked';
  records: AttendanceRecord[];
}

export interface LeaveRequest {
  id: number;
  student_id: number;
  student_name: string;
  guardian_name?: string;
  guardian_phone?: string;
  class_name: string;
  starts_at: string;
  ends_at: string;
  reason: string;
  session_scope: 'sáng' | 'chiều' | 'cả ngày';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  review_note?: string;
  created_at: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  weight: number;
  teacher_name?: string;
  teacher_phone?: string;
}

export interface ScoreItem {
  student_id: number;
  tx1?: number;
  tx2?: number;
  tx3?: number;
  gk?: number;
  ck?: number;
  dtb?: number;
}

export interface TimetableEntry {
  id: number;
  day_of_week: number;
  period: number;
  subject_id: number;
  subject_name: string;
  teacher_name: string;
  room: string;
}

export interface LessonLog {
  id: number;
  class_id: number;
  log_date: string;
  period: number;
  subject_name: string;
  lesson_title: string;
  teacher_name: string;
  student_absent_notes?: string;
  conduct_notes?: string;
  homework_assigned?: string;
}

export interface AssignmentTask {
  id: number;
  title: string;
  task_type: 'bài tập' | 'trực nhật' | 'nộp giấy tờ' | 'thu quỹ';
  priority: 'cao' | 'trung bình' | 'thấp';
  assignee_name: string;
  due_at: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ConductEvent {
  id: number;
  student_id: number;
  student_name: string;
  event_type: 'positive' | 'violation';
  points: number;
  description: string;
  logged_at: string;
  criterion_name?: string;
  recorded_by?: string;
  occurred_at?: string;
}

export interface Incident {
  id: number;
  title: string;
  incident_date?: string;
  occurred_at?: string;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  student_names: string[];
  description: string;
}

export interface Announcement {
  id: number;
  title: string;
  body_html: string;
  priority: 'bình thường' | 'quan trọng' | 'khẩn cấp' | 'thường';
  author_name: string;
  published_at: string;
  read_count: number;
  ack_count: number;
  total_recipients: number;
  status?: string;
  acknowledgement_required?: boolean;
}

export interface AuditLog {
  id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  created_at: string;
}

export interface TeacherLessonEvaluation {
  id: number;
  class_id: number;
  eval_date: string;
  period: number;
  subject_name: string;
  teacher_name: string;
  student_id: number;
  student_name: string;
  evaluation_type: 'praise' | 'reminder';
  category_title: string;
  points_impact: number;
  comment: string;
  created_at: string;
}

export interface StudentGradeRecord {
  tx1?: number;
  tx2?: number;
  tx3?: number;
  gk?: number;
  ck?: number;
}

