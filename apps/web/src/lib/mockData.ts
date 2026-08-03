import type {
  User, SchoolYear, Semester, ClassItem, Student, Guardian, AttendanceSession,
  LeaveRequest, Subject, TimetableEntry, LessonLog, AssignmentTask, ConductEvent,
  Incident, Announcement, AuditLog, PermissionItem, RolePermissionMatrix
} from '../types';

// ONLY SUPERADMIN ACCOUNT (username: superadmin | password: 123123)
export const mockUsers: User[] = [
  {
    id: 1,
    public_id: 'USR-SUPERADMIN-001',
    name: 'SuperAdmin',
    email: 'superadmin@vie.info.vn',
    username: 'superadmin',
    role: 'superadmin',
    phone: '0999888777',
    status: 'active',
  },
];

export const mockSchoolYears: SchoolYear[] = [
  { id: 1, name: '2025-2026', starts_on: '2025-09-05', ends_on: '2026-05-31', is_current: true },
];

export const mockSemesters: Semester[] = [
  { id: 1, code: 'HK1', name: 'Học kỳ I', school_year_id: 1, status: 'closed' },
  { id: 2, code: 'HK2', name: 'Học kỳ II', school_year_id: 1, status: 'active' },
];

export const EMPTY_CLASS: ClassItem = {
  id: 0,
  code: '',
  name: 'Chưa có lớp học',
  grade_level: '',
  room: 'Chưa khởi tạo',
  capacity: 0,
  student_count: 0,
  homeroom_teacher_id: 0,
  homeroom_teacher_name: 'Chưa phân công',
};

export const DEFAULT_CLASSES: ClassItem[] = [];

export const mockClasses: ClassItem[] = [];

export const mockGuardians: Guardian[] = [];

export const mockStudents: Student[] = [];

// Standard Core Subjects (Data strictly managed in Database)
export const mockSubjects: Subject[] = [
  { id: 1, name: 'Toán học', code: 'TOAN', weight: 2 },
  { id: 2, name: 'Ngữ văn', code: 'VVAN', weight: 2 },
  { id: 3, name: 'Tiếng Anh', code: 'TANG', weight: 2 },
  { id: 4, name: 'Vật lý', code: 'VLY', weight: 1 },
  { id: 5, name: 'Hóa học', code: 'HHOA', weight: 1 },
  { id: 6, name: 'Sinh học', code: 'SHOC', weight: 1 },
  { id: 7, name: 'Lịch sử & Địa lý', code: 'LS_DL', weight: 1 },
  { id: 8, name: 'Tin học', code: 'THOC', weight: 1 },
  { id: 9, name: 'Giáo dục công dân', code: 'GDCD', weight: 1 },
  { id: 10, name: 'Công nghệ', code: 'CNGHE', weight: 1 },
  { id: 11, name: 'Thể dục', code: 'TDUC', weight: 1 },
  { id: 12, name: 'Âm nhạc', code: 'ANAC', weight: 1 },
  { id: 13, name: 'Mỹ thuật', code: 'MTHUAT', weight: 1 },
];

export const mockAttendanceSession: AttendanceSession = {
  id: 0,
  class_id: 0,
  session_date: '',
  session_type: 'morning',
  status: 'open',
  records: []
};

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockTimetable: TimetableEntry[] = [];

export const mockLessonLogs: LessonLog[] = [];

export const mockTasks: AssignmentTask[] = [];

export const mockConductCriteria: { id: number; code: string; name: string; default_points: number; category: string }[] = [];

export const mockConductEvents: ConductEvent[] = [];

export const mockIncidents: Incident[] = [];

export const mockAnnouncements: Announcement[] = [];

export const mockRolePermissions: RolePermissionMatrix[] = [
  { role: 'superadmin', role_name: 'SuperAdmin', permissions: ['all'] },
  { role: 'admin', role_name: 'System Admin', permissions: ['all'] },
  { role: 'homeroom_teacher', role_name: 'GV Chủ Nhiệm', permissions: ['view_students', 'manage_grades', 'attendance'] },
  { role: 'subject_teacher', role_name: 'GV Bộ Môn', permissions: ['view_students', 'manage_grades'] },
  { role: 'parent', role_name: 'Phụ Huynh', permissions: ['view_children', 'leave_request'] },
  { role: 'student', role_name: 'Học Sinh', permissions: ['view_self', 'submit_assignment', 'leave_request'] },
];

export const mockAuditLogs: AuditLog[] = [];

export const mockPermissions: PermissionItem[] = [
  { id: 1, code: 'STUDENT_VIEW', name: 'Xem hồ sơ học sinh', category: 'Hồ sơ' },
  { id: 2, code: 'GRADE_EDIT', name: 'Nhập & Sửa điểm số', category: 'Sổ điểm' },
];
