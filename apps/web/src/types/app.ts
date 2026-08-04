export type RoleType =
  | 'superadmin'
  | 'admin'
  | 'homeroom_teacher'
  | 'subject_teacher'
  | 'parent'
  | 'student'
  | 'standard_user';

export interface User {
  id: number;
  public_id: string;
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: RoleType;
  status: string;
  avatar_url?: string | null;
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  grade_level: string;
  room?: string | null;
  capacity: number;
  student_count: number;
  homeroom_teacher_id?: number | null;
  homeroom_teacher_name?: string | null;
  status: string;
}

export interface SchoolYear {
  id: number;
  name: string;
  starts_on?: string | null;
  ends_on?: string | null;
  is_current: boolean;
}

export interface Semester {
  id: number;
  school_year_id: number;
  code: string;
  name: string;
  status: string;
}

export interface Student {
  id: number;
  public_id: string;
  student_code: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name: string;
  avatar_url?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  status: string;
  class_id: string;
  class_name?: string | null;
  group_name?: string | null;
  roll_number?: number | null;
  primary_guardian_name?: string | null;
  primary_guardian_phone?: string | null;
  health_note?: string | null;
}

export interface DashboardPayload {
  generated_at: string;
  class: ClassItem;
  kpis: {
    students: number;
    present_today: number;
    late_today: number;
    absent_today: number;
    average_score: number | null;
    pending_assignments: number;
    open_incidents: number;
    pending_leaves: number;
  };
  attendance_trend: Array<{ date: string; present: number; absent: number; late: number }>;
  grade_distribution: Array<{ label: string; count: number }>;
  module_counts: Record<string, number>;
  modules: Record<string, Array<Record<string, unknown>>>;
  recent_activity: Array<{
    id: number;
    user_name: string;
    user_role: string;
    action_type: string;
    description: string;
    created_at: string;
  }>;
}

export interface AttendanceRecord {
  id?: number;
  student_id: string;
  student_name: string;
  status: 'NOT_YET' | 'PRESENT' | 'LATE' | 'EXCUSED_ABSENCE' | 'UNEXCUSED_ABSENCE';
  minutes_late?: number | null;
  note?: string | null;
  method?: string;
  scanned_at?: string | null;
}

export interface QrToken {
  student_id: string;
  student_code: string;
  student_name: string;
  class_id: string;
  qr_token: string;
  version: number;
  qr_url?: string | null;
}
