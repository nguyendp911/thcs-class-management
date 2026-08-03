import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UserAvatar } from '../components/ui/UserAvatar';
import { ExamCountdownWidget } from '../components/ui/ExamCountdownWidget';
import {
  Users, UserCheck, UserX, Clock, FileText, CheckCircle2,
  Calendar, MessageSquare, TrendingUp, BookOpen, ChevronDown, ChevronUp,
  Award, AlertTriangle, ArrowRight, ShieldCheck, Send, Plus
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClass, classesList, studentsList, currentRole, currentUser } = useAuth();

  // Active subtab for Parent Notifications
  const [notifTab, setNotifTab] = useState<'all' | 'read' | 'pending'>('all');
  // Expandable state for Subject Teachers Footer Bar
  const [isTeachersExpanded, setIsTeachersExpanded] = useState(false);

  // Live Database Metrics State & Announcements State
  const [dbStudentCount, setDbStudentCount] = useState<number | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [classAnnouncements, setClassAnnouncements] = useState<any[]>([]);
  const [classTimetable, setClassTimetable] = useState<any[] | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [conductEvents, setConductEvents] = useState<any[]>([]);
  const [gradebookData, setGradebookData] = useState<any[]>([]);
  const [homeroomUserEmail, setHomeroomUserEmail] = useState<string>('');

  // Fetch live Dashboard metrics from MySQL Database API and LocalStorage
  useEffect(() => {
    if (!selectedClass || !selectedClass.id) return;
    const classId = selectedClass.id;

    // 1. Fetch live metrics from API
    fetch(`/thcs/api/dashboard?class_id=${classId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setDbStudentCount(res.data.total_students);
          if (res.data.attendance_records) {
            setAttendanceRecords(res.data.attendance_records);
          }
        }
      })
      .catch(() => {});

    // 2. Fetch/Load Class Announcements (no demo fallback)
    try {
      const savedAnn = localStorage.getItem(`thcs_announcements_class_${classId}`);
      if (savedAnn) {
        const parsed = JSON.parse(savedAnn);
        setClassAnnouncements(Array.isArray(parsed) ? parsed : []);
      } else {
        setClassAnnouncements([]);
      }
    } catch (e) { setClassAnnouncements([]); }

    // 3. Load Class Timetable
    try {
      const savedTt = localStorage.getItem(`thcs_timetable_class_${classId}`);
      if (savedTt) {
        const parsed = JSON.parse(savedTt);
        setClassTimetable(Array.isArray(parsed) && parsed.length > 0 ? parsed : []);
      } else {
        setClassTimetable([]);
      }
    } catch (e) {
      setClassTimetable([]);
    }

    // 4. Load Leave Requests
    try {
      const savedLeaves = localStorage.getItem('thcs_leave_requests');
      if (savedLeaves) {
        const parsed = JSON.parse(savedLeaves);
        if (Array.isArray(parsed)) {
          setLeaveRequests(parsed.filter((l: any) => String(l.class_id || selectedClass.id) === String(classId)));
        }
      }
    } catch (e) {}

    // 5. Load Subject Teachers
    try {
      const savedSubs = localStorage.getItem(`thcs_subject_list_class_${classId}`) || localStorage.getItem('thcs_subject_teachers');
      if (savedSubs) {
        setSubjectTeachers(JSON.parse(savedSubs));
      }
    } catch (e) {}

    // 6. Load Conduct Events from localStorage (synced from DB)
    try {
      const savedConduct = localStorage.getItem('thcs_conduct_events');
      if (savedConduct) {
        const parsed = JSON.parse(savedConduct);
        setConductEvents(Array.isArray(parsed) ? parsed : []);
      } else {
        setConductEvents([]);
      }
    } catch (e) { setConductEvents([]); }

    // 7. Load Gradebook data
    try {
      const savedGrades = localStorage.getItem(`thcs_gradebook_class_${classId}`) || localStorage.getItem('thcs_gradebook');
      if (savedGrades) {
        const parsed = JSON.parse(savedGrades);
        setGradebookData(Array.isArray(parsed) ? parsed : []);
      } else {
        setGradebookData([]);
      }
    } catch (e) { setGradebookData([]); }

    // 8. Load homeroom teacher email from users list
    try {
      const savedUsers = localStorage.getItem('thcs_admin_users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const hrt = users.find((u: any) =>
          u.role === 'homeroom_teacher' &&
          u.scopes?.some((s: any) => String(s.class_id) === String(classId))
        );
        if (hrt?.email) setHomeroomUserEmail(hrt.email);
      }
    } catch (e) {}

  }, [selectedClass?.id, selectedClass?.name]);

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY BEFORE ANY EARLY RETURNS
  const totalStudents = studentsList.length > 0 ? studentsList.length : (dbStudentCount !== null ? dbStudentCount : 30);

  // Today's live attendance calculations
  const localTodayRecords = useMemo(() => {
    if (!selectedClass?.id) return [];
    try {
      const cached = localStorage.getItem(`thcs_today_attendance_${selectedClass.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }, [selectedClass?.id]);

  const activeAttendance = attendanceRecords.length > 0 ? attendanceRecords : localTodayRecords;
  const excusedCount = activeAttendance.filter((r: any) => r.status === 'EXCUSED_ABSENCE').length;
  const unexcusedCount = activeAttendance.filter((r: any) => r.status === 'UNEXCUSED_ABSENCE' || r.status === 'TRUANCY').length;
  const lateCount = activeAttendance.filter((r: any) => r.status === 'LATE').length;
  const presentCount = activeAttendance.length > 0
    ? activeAttendance.filter((r: any) => r.status === 'PRESENT').length
    : (totalStudents - (excusedCount + unexcusedCount + lateCount));

  const pendingLeaveRequestsCount = leaveRequests.filter((l: any) => l.status === 'PENDING').length;

  // Real Pending Tasks dynamically generated from real Database state
  const pendingTasksList = useMemo(() => {
    const classId = selectedClass?.id || 1;
    const tasks: any[] = [];

    if (pendingLeaveRequestsCount > 0) {
      tasks.push({
        id: 'task-leave',
        priorityTag: '🔥 Khẩn cấp',
        tagColor: 'text-[#D32F2F] bg-[#FFEFEF] border-[#FFC0C3]',
        title: `Có ${pendingLeaveRequestsCount} đơn xin nghỉ cần duyệt`,
        desc: `Phụ huynh gửi đơn xin phép nghỉ học trực tuyến`,
        btnLabel: 'Duyệt đơn',
        btnColor: 'bg-[#FFEFEF] hover:bg-[#FFD6D8] border-[#FFC0C3] text-[#D32F2F]',
        targetUrl: `/app/classes/${classId}/leave-requests`,
      });
    }

    if (unexcusedCount > 0) {
      tasks.push({
        id: 'task-unexcused',
        priorityTag: '🔥 Khẩn cấp',
        tagColor: 'text-[#D32F2F] bg-[#FFEFEF] border-[#FFC0C3]',
        title: `Có ${unexcusedCount} học sinh vắng không phép`,
        desc: `Cần liên hệ phụ huynh xác minh lý do vắng`,
        btnLabel: 'Kiểm tra',
        btnColor: 'bg-[#FFEFEF] hover:bg-[#FFD6D8] border-[#FFC0C3] text-[#D32F2F]',
        targetUrl: `/app/classes/${classId}/attendance`,
      });
    }

    if (lateCount > 0) {
      tasks.push({
        id: 'task-late',
        priorityTag: '⚡ Ưu tiên',
        tagColor: 'text-[#B47800] bg-[#FFF9EB] border-[#FFE399]',
        title: `Ghi nhận ${lateCount} học sinh đi muộn hôm nay`,
        desc: `Nhắc nhở nề nếp sinh hoạt đầu giờ`,
        btnLabel: 'Xem DS',
        btnColor: 'bg-[#FFF9EB] hover:bg-[#FFE8B3] border-[#FFE399] text-[#B47800]',
        targetUrl: `/app/classes/${classId}/attendance`,
      });
    }

    return tasks.slice(0, 4);
  }, [pendingLeaveRequestsCount, unexcusedCount, lateCount, selectedClass?.id, selectedClass?.name]);

  // Live filtered notifications list (only real data from DB/localStorage)
  const filteredNotifs = useMemo(() => {
    return classAnnouncements.filter((n: any) => {
      if (notifTab === 'read') return n.status === 'read' || n.status === 'responded';
      if (notifTab === 'pending') return n.status === 'pending';
      return true;
    });
  }, [classAnnouncements, notifTab]);

  // Timetable entries for today (Monday = 2)
  const todayTimetableSlots = useMemo(() => {
    if (!classTimetable || classTimetable.length === 0) return [];
    return classTimetable.filter((t: any) => Number(t.day_of_week) === 2);
  }, [classTimetable]);

  // Compute group thi đua rankings from real conduct events
  const groupRankings = useMemo(() => {
    const groups: Record<string, { group_name: string; totalPoints: number; studentCount: number }> = {};
    studentsList.forEach((s: any) => {
      const g = s.group_name || 'Tổ 1';
      if (!groups[g]) groups[g] = { group_name: g, totalPoints: 0, studentCount: 0 };
      groups[g].studentCount++;
    });
    conductEvents.forEach((ev: any) => {
      const student = studentsList.find((s: any) => s.id === ev.student_id);
      const g = student?.group_name || 'Tổ 1';
      if (groups[g]) groups[g].totalPoints += (ev.points || 0);
    });
    return Object.values(groups).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [conductEvents, studentsList]);

  // Compute conduct rating per student
  const studentConductPoints = useMemo(() => {
    const map: Record<number, number> = {};
    conductEvents.forEach((ev: any) => {
      if (!map[ev.student_id]) map[ev.student_id] = 0;
      map[ev.student_id] += (ev.points || 0);
    });
    return map;
  }, [conductEvents]);

  // Count students with Tốt or better conduct (>= 95 points)
  const conductGoodCount = useMemo(() => {
    return studentsList.filter((s: any) => (studentConductPoints[s.id] || 0) >= 95).length;
  }, [studentsList, studentConductPoints]);

  // Top 3 students by conduct points (tiến bộ)
  const topProgressStudents = useMemo(() => {
    return studentsList
      .map((s: any) => ({ ...s, pts: studentConductPoints[s.id] || 0 }))
      .sort((a: any, b: any) => b.pts - a.pts)
      .slice(0, 3);
  }, [studentsList, studentConductPoints]);

  // Compute gradebook average (real)
  const { classAvgScore, weakestSubject } = useMemo(() => {
    if (!gradebookData || gradebookData.length === 0) return { classAvgScore: null, weakestSubject: null };
    // gradebookData may be array of entries with subject_name and score
    const subjectMap: Record<string, number[]> = {};
    gradebookData.forEach((entry: any) => {
      const subj = entry.subject_name || entry.subject || 'Môn học';
      const score = parseFloat(entry.score ?? entry.avg_score ?? entry.value ?? 0);
      if (!isNaN(score) && score > 0) {
        if (!subjectMap[subj]) subjectMap[subj] = [];
        subjectMap[subj].push(score);
      }
    });
    const subjectAvgs = Object.entries(subjectMap).map(([name, scores]) => ({
      name,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
    if (subjectAvgs.length === 0) return { classAvgScore: null, weakestSubject: null };
    const overall = subjectAvgs.reduce((a, b) => a + b.avg, 0) / subjectAvgs.length;
    const weakest = subjectAvgs.sort((a, b) => a.avg - b.avg)[0];
    return {
      classAvgScore: Math.round(overall * 10) / 10,
      weakestSubject: weakest,
    };
  }, [gradebookData]);

  // Weekly goals based on real data
  const weeklyGoals = useMemo(() => {
    const attendancePct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return {
      attendanceOk: attendancePct >= 95,
      lateOk: lateCount <= 5,
      conductOk: conductEvents.length > 0,
      unexcusedOk: unexcusedCount === 0,
      score: [attendancePct >= 95, lateCount <= 5, conductEvents.length > 0, unexcusedCount === 0].filter(Boolean).length,
    };
  }, [presentCount, totalStudents, lateCount, conductEvents.length, unexcusedCount]);

  const weeklyGoalPct = Math.round((weeklyGoals.score / 4) * 100);

  // 7-day trend chart data: only today has real data, others show 0 until data exists
  const trendData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      const isToday = i === 6;
      return {
        day: label,
        comat: isToday ? (totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0) : 0,
        muon: isToday ? lateCount : 0,
        thidua: isToday ? (groupRankings[0]?.totalPoints || 0) : 0,
      };
    });
  }, [presentCount, totalStudents, lateCount, groupRankings]);

  // Clean empty state if no class is selected (PLACED AFTER ALL HOOKS!)
  if (!selectedClass || selectedClass.id === 0 || classesList.length === 0) {
    return (
      <div className="space-y-6 pb-12 max-w-full">
        <div className="clay-card p-10 text-center space-y-4 border-[#C0BBFD] bg-gradient-to-br from-[#FAFBFF] to-[#EEECFF]">
          <div className="w-16 h-16 rounded-3xl bg-[#EEECFF] border border-[#C0BBFD] flex items-center justify-center mx-auto text-[#6C63FF] shadow-xs">
            <Users className="h-8 w-8 text-[#6C63FF]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#18243A]">Chưa có lớp học nào trong hệ thống</h2>
          <p className="text-xs text-[#68758D] font-bold max-w-md mx-auto leading-relaxed">
            Hệ thống đang ở trạng thái vận hành sạch 100%. Vui lòng vào trang Quản Trị Hệ Thống để Tạo Lớp Học Mới!
          </p>
          <div className="pt-3">
            <Button variant="primary" onClick={() => navigate('/app/admin')} icon={<Plus className="h-4 w-4" />}>
              Đến Trang Quản Trị & Tạo Lớp Học Mới
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User display name & role title
  const rawName = currentUser?.name || '';
  const cleanName = rawName.replace(/\s*\([^)]*\)/g, '');
  const isTeacher = currentRole === 'homeroom_teacher' || currentRole === 'subject_teacher' || currentRole === 'superadmin' || currentRole === 'admin';
  const greetingTitle = isTeacher ? `Chào buổi sáng, thầy ${cleanName} ☀️` : `Chào mừng ${cleanName} ☀️`;
  const homeroomTeacherName = selectedClass.homeroom_teacher_name || '';

  return (
    <div className="space-y-5 pb-12 max-w-full overflow-x-clip text-[#18243A] font-sans">

      {/* 12-COLUMN DASHBOARD GRID: 8 COLS (LEFT MAIN) / 4 COLS (RIGHT SIDEBAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ========================================================================= */}
        {/* LEFT MAIN CONTENT COLUMN (8 COLUMNS / ~68%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-5">

          {/* 1. KHỐI CHÀO MỪNG NỔI BẬT (HERO WELCOME CARD) */}
          <div className="relative rounded-3xl p-6 md:p-7 bg-gradient-to-br from-[#EEECFF] via-[#F4F3FF] to-[#E6F9F3] border-2 border-[#C0BBFD] shadow-[0_12px_32px_rgba(108,99,255,0.12)] overflow-hidden transition-all">
            {/* Ambient Background Glow Effects */}
            <div className="absolute -top-16 -left-16 w-56 h-56 bg-[#6C63FF]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-[#22C997]/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-3.5 max-w-xl">
              {/* Scope Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#C0BBFD] shadow-2xs text-[11px] font-black text-[#6C63FF]">
                <span className="w-2 h-2 rounded-full bg-[#22C997] animate-ping"></span>
                <span>TRUNG TÂM ĐIỀU HÀNH LỚP HỌC · {selectedClass.name} ({selectedClass.room || 'Phòng học'})</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#18243A] tracking-tight leading-tight flex items-center gap-2">
                {greetingTitle}
              </h1>

              <p className="text-xs sm:text-sm text-[#344054] font-extrabold leading-relaxed">
                Lớp <span className="text-[#6C63FF] font-black text-base">{selectedClass.name}</span> có{' '}
                <span className="text-[#0E8360] font-black text-base bg-[#E6F9F3] px-2 py-0.5 rounded-lg border border-[#A3F0D9]">{presentCount}/{totalStudents}</span> học sinh có mặt hôm nay. Cùng giữ vững nề nếp và tiếp tục phát huy nhé!
              </p>

              {/* Action Buttons Hub - High Prominence Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => navigate(`/app/classes/${selectedClass.id}/attendance`)}
                  className="px-4 py-2.5 rounded-2xl bg-[#6C63FF] hover:bg-[#5A50E6] text-white text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="h-4 w-4" />
                  Điểm danh hôm nay
                </button>
                <button
                  onClick={() => navigate(`/app/classes/${selectedClass.id}/conduct`)}
                  className="px-4 py-2.5 rounded-2xl bg-[#0E8360] hover:bg-[#0A6B4E] text-white text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Award className="h-4 w-4 text-[#A3F0D9]" />
                  Ghi nhận thi đua
                </button>
                <button
                  onClick={() => navigate(`/app/classes/${selectedClass.id}/announcements`)}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#F4F3FF] border-2 border-[#6C63FF] text-[#6C63FF] text-xs font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 text-[#6C63FF]" />
                  Gửi thông báo
                </button>
                <button
                  onClick={() => navigate(`/app/classes/${selectedClass.id}/students`)}
                  className="px-4 py-2.5 rounded-2xl bg-[#FFF9EB] hover:bg-[#FFE8B3] border border-[#FFE399] text-[#B47800] text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  🪑 Sơ đồ chỗ ngồi
                </button>
              </div>
            </div>

            {/* Educational 3D Graphic (Right Side) */}
            <div className="hidden sm:flex absolute right-4 bottom-2 top-2 items-center justify-center opacity-95 pointer-events-none">
              <div className="relative w-48 h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6C63FF]/30 to-[#22C997]/30 rounded-full filter blur-2xl"></div>
                <div className="relative flex items-center gap-2 scale-95">
                  <div className="w-22 h-28 bg-white/95 border-2 border-[#C0BBFD] rounded-2xl p-2.5 shadow-lg transform -rotate-6 flex flex-col justify-between">
                    <div className="w-full h-2.5 bg-[#6C63FF] rounded-full"></div>
                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 bg-[#EEECFF] rounded-full"></div>
                      <div className="w-4/5 h-1.5 bg-[#EEECFF] rounded-full"></div>
                      <div className="w-3/5 h-1.5 bg-[#EEECFF] rounded-full"></div>
                    </div>
                    <div className="text-right text-xs">🎓</div>
                  </div>
                  <div className="w-18 h-22 bg-emerald-500/15 border-2 border-[#A3F0D9] rounded-2xl p-2 shadow-md transform rotate-12 flex items-center justify-center text-3xl">
                    🪴
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CÁC THẺ CHUYÊN CẦN (6 STATS CARDS GRID - EQUAL HEIGHT H-24) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Card 1: Sĩ số */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/students`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#6C63FF] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Sĩ số</span>
                <div className="w-7 h-7 rounded-xl bg-[#EEECFF] text-[#6C63FF] flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#18243A] leading-none">{totalStudents}</div>
                <div className="text-[10px] text-[#68758D] font-bold mt-1">Học sinh</div>
              </div>
            </div>

            {/* Card 2: Có mặt */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/attendance`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#22C997] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Có mặt</span>
                <div className="w-7 h-7 rounded-xl bg-[#E6F9F3] text-[#0E8360] flex items-center justify-center shrink-0">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#0E8360] leading-none">{presentCount}</div>
                <div className="text-[10px] text-[#0E8360] font-bold mt-1">
                  {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100}% sĩ số
                </div>
              </div>
            </div>

            {/* Card 3: Vắng có phép */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/attendance`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#F6B73C] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Vắng có phép</span>
                <div className="w-7 h-7 rounded-xl bg-[#FFF9EB] text-[#B47800] flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#B47800] leading-none">{excusedCount}</div>
                <div className="text-[10px] text-[#68758D] font-bold mt-1">
                  {totalStudents > 0 ? Math.round((excusedCount / totalStudents) * 100) : 0}% sĩ số
                </div>
              </div>
            </div>

            {/* Card 4: Vắng không phép */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/attendance`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#FF5D68] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Vắng K phép</span>
                <div className="w-7 h-7 rounded-xl bg-[#FFEFEF] text-[#D32F2F] flex items-center justify-center shrink-0">
                  <UserX className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#D32F2F] leading-none">{unexcusedCount}</div>
                <div className="text-[10px] text-[#D32F2F] font-bold mt-1">
                  {totalStudents > 0 ? Math.round((unexcusedCount / totalStudents) * 100) : 0}% sĩ số
                </div>
              </div>
            </div>

            {/* Card 5: Đi muộn */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/attendance`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#6C63FF] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Đi muộn</span>
                <div className="w-7 h-7 rounded-xl bg-[#EEECFF] text-[#6C63FF] flex items-center justify-center shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#6C63FF] leading-none">{lateCount}</div>
                <div className="text-[10px] text-[#68758D] font-bold mt-1">
                  {totalStudents > 0 ? Math.round((lateCount / totalStudents) * 100) : 0}% sĩ số
                </div>
              </div>
            </div>

            {/* Card 6: Đơn chờ duyệt */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/leave-requests`)}
              className="clay-card p-3 space-y-1 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#6C63FF] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Đơn chờ duyệt</span>
                <div className="w-7 h-7 rounded-xl bg-[#EEECFF] text-[#6C63FF] flex items-center justify-center shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#6C63FF] leading-none">{pendingLeaveRequestsCount}</div>
                <div className="text-[10px] text-[#6C63FF] font-extrabold group-hover:underline mt-1">Xem chi tiết</div>
              </div>
            </div>
          </div>

          {/* 3. VIỆC CẦN XỬ LÝ & XU HƯỚNG LỚP HỌC (2 SUB-PANELS GRID - EQUAL HEIGHT ITEMS-STRETCH) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

            {/* LEFT SUB-PANEL: VIỆC CẦN XỬ LÝ DỮ LIỆU THẬT */}
            <div className="clay-card p-4 space-y-3 bg-white border border-[#E1E6F0] rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h2 className="text-sm font-extrabold text-[#18243A] flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[#FF5D68]" />
                    Việc cần xử lý ({pendingTasksList.length})
                  </h2>
                  <Badge variant="warning">Thời gian thực</Badge>
                </div>

                {/* Task Items List */}
                <div className="space-y-2 text-xs">
                  {pendingTasksList.map((task) => (
                    <div key={task.id} className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0] flex items-center justify-between gap-2 hover:border-[#6C63FF] transition-all">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border shrink-0 ${task.tagColor}`}>{task.priorityTag}</span>
                          <span className="font-extrabold text-[#18243A] truncate text-[11px]">{task.title}</span>
                        </div>
                        <div className="text-[10px] text-[#68758D] font-bold truncate">{task.desc}</div>
                      </div>
                      <button
                        onClick={() => navigate(task.targetUrl)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border shrink-0 transition-colors cursor-pointer ${task.btnColor}`}
                      >
                        {task.btnLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate(`/app/classes/${selectedClass.id}/leave-requests`)}
                className="text-xs font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 pt-2 border-t border-[#E1E6F0]"
              >
                Xem tất cả việc cần xử lý <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* RIGHT SUB-PANEL: XU HƯỚNG LỚP HỌC 7 NGÀY */}
            <div className="clay-card p-4 space-y-3 bg-white border border-[#E1E6F0] rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h2 className="text-sm font-extrabold text-[#18243A] flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#6C63FF]" />
                    Xu hướng lớp học 7 ngày
                  </h2>
                  <div className="text-[10px] font-bold text-[#68758D]">Lớp {selectedClass.name}</div>
                </div>

                {/* Combined Chart (ComposedChart) */}
                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#68758D', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10, fill: '#68758D' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 120]} tick={{ fontSize: 10, fill: '#68758D' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18243A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                      />
                      <Bar yAxisId="left" dataKey="comat" name="Tỷ lệ có mặt (%)" fill="#A3F0D9" radius={[6, 6, 0, 0]} barSize={22} />
                      <Line yAxisId="right" type="monotone" dataKey="muon" name="Số đi muộn (HS)" stroke="#6C63FF" strokeWidth={2.5} dot={{ r: 4, fill: '#6C63FF' }} />
                      <Line yAxisId="right" type="monotone" dataKey="thidua" name="Điểm thi đua (điểm)" stroke="#F6B73C" strokeWidth={2} dot={{ r: 3, fill: '#F6B73C' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Auto Remark Box */}
              <div className="p-2.5 rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] text-[11px] font-bold text-[#0E8360] flex items-center gap-2">
                <span className="text-base shrink-0">💡</span>
                <span>
                  <strong>Nhận xét tự động:</strong> Tỷ lệ có mặt đạt {Math.round((presentCount / (totalStudents || 1)) * 100)}%. Nề nếp Lớp {selectedClass.name} duy trì ổn định.
                </span>
              </div>
            </div>

          </div>

          {/* 4. THI ĐUA VÀ TIẾN BỘ (3 SUB-PANELS GRID - EQUAL HEIGHT ITEMS-STRETCH) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

            {/* Panel 1: Xếp hạng thi đua - DỮ LIỆU THẬT */}
            <div className="clay-card p-4 bg-white border border-[#E1E6F0] rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h3 className="text-xs font-extrabold text-[#18243A]">Xếp hạng thi đua</h3>
                  {groupRankings.length > 0 ? (
                    <span className="text-xs font-black text-[#F6B73C]">🏆 Dẫn đầu: {groupRankings[0].group_name}</span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#68758D]">Chưa có dữ liệu</span>
                  )}
                </div>

                {groupRankings.length > 0 ? (
                  <div className="space-y-1.5 text-xs font-bold">
                    {groupRankings.map((g, idx) => (
                      <div
                        key={g.group_name}
                        className={`p-2 rounded-xl flex items-center justify-between ${
                          idx === 0 ? 'bg-[#FFF9EB] border border-[#FFE399]' : 'bg-[#FAFBFF] border border-[#E1E6F0]'
                        }`}
                      >
                        <span className={`flex items-center gap-2 font-black ${idx === 0 ? 'text-[#18243A]' : 'text-[#68758D]'}`}>
                          <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
                          {g.group_name}
                        </span>
                        <span className={`font-black ${idx === 0 ? 'text-[#B47800]' : 'text-[#68758D]'}`}>
                          {g.totalPoints} điểm {idx === 0 ? '🏆' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[11px] text-[#68758D] font-bold">
                    <div className="text-2xl mb-2">🏆</div>
                    Chưa có sự kiện thi đua nào được ghi nhận.
                    <button onClick={() => navigate(`/app/classes/${selectedClass.id}/conduct`)} className="block mt-2 text-[#6C63FF] hover:underline font-extrabold mx-auto">Ghi nhận ngay →</button>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Mục tiêu tuần - DỮ LIỆU THẬT */}
            <div className="clay-card p-4 bg-white border border-[#E1E6F0] rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h3 className="text-xs font-extrabold text-[#18243A]">Mục tiêu nề nếp hôm nay</h3>
                  <Badge variant={weeklyGoalPct === 100 ? 'mint' : weeklyGoalPct >= 50 ? 'warning' : 'neutral'}>
                    {weeklyGoalPct === 100 ? 'Đạt tất cả' : `${weeklyGoals.score}/4 tiêu chí`}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {/* Circular Progress Gauge */}
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-[#E1E6F0]" strokeWidth="3.5" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={weeklyGoalPct === 100 ? 'text-[#22C997]' : weeklyGoalPct >= 50 ? 'text-[#F6B73C]' : 'text-[#FF5D68]'}
                        strokeDasharray={`${weeklyGoalPct}, 100`}
                        strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-black text-[#18243A]">{weeklyGoalPct}%</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] font-extrabold text-[#18243A]">
                    <div className={`flex items-center gap-1.5 ${weeklyGoals.attendanceOk ? 'text-[#0E8360]' : 'text-[#D32F2F]'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${weeklyGoals.attendanceOk ? 'text-[#22C997]' : 'text-[#FF5D68]'}`} />
                      Chuyên cần ≥ 95%
                      <span className="ml-auto font-mono">{totalStudents > 0 ? Math.round((presentCount/totalStudents)*100) : 0}%</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${weeklyGoals.lateOk ? 'text-[#0E8360]' : 'text-[#D32F2F]'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${weeklyGoals.lateOk ? 'text-[#22C997]' : 'text-[#FF5D68]'}`} />
                      Đi muộn ≤ 5 lượt
                      <span className="ml-auto font-mono">{lateCount} lượt</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${weeklyGoals.conductOk ? 'text-[#0E8360]' : 'text-[#68758D]'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${weeklyGoals.conductOk ? 'text-[#22C997]' : 'text-[#E1E6F0]'}`} />
                      Ghi nhận thi đua
                      <span className="ml-auto font-mono">{conductEvents.length} sự kiện</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${weeklyGoals.unexcusedOk ? 'text-[#0E8360]' : 'text-[#D32F2F]'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${weeklyGoals.unexcusedOk ? 'text-[#22C997]' : 'text-[#FF5D68]'}`} />
                      Không vắng K phép
                      <span className="ml-auto font-mono">{unexcusedCount} HS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: Học sinh tiến bộ - DỮ LIỆU THẬT từ conduct events */}
            <div className="clay-card p-4 bg-white border border-[#E1E6F0] rounded-2xl flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2">
                  <h3 className="text-xs font-extrabold text-[#18243A]">Học sinh điểm cao nhất</h3>
                  <button onClick={() => navigate(`/app/classes/${selectedClass.id}/conduct`)} className="text-[10px] font-extrabold text-[#6C63FF] hover:underline">
                    Xem tất cả
                  </button>
                </div>

                <div className="space-y-2">
                  {topProgressStudents.length > 0 ? topProgressStudents.map((st: any, idx: number) => (
                    <div key={st.id || idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                      <UserAvatar name={st.full_name} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-[#18243A] truncate">{st.full_name}</div>
                        <div className="text-[10px] text-[#68758D] font-bold">
                          {st.group_name || 'Chưa xếp tổ'} · <span className={`${st.pts > 0 ? 'text-[#0E8360]' : 'text-[#68758D]'}`}>{st.pts > 0 ? `+${st.pts}` : st.pts} điểm</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    studentsList.slice(0, 3).map((st: any, idx: number) => (
                      <div key={st.id || idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                        <UserAvatar name={st.full_name} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-[#18243A] truncate">{st.full_name}</div>
                          <div className="text-[10px] text-[#68758D] font-bold">{st.group_name || 'Chưa xếp tổ'} · <span>0 điểm</span></div>
                        </div>
                      </div>
                    ))
                  )}
                  {studentsList.length === 0 && (
                    <div className="text-xs text-[#68758D] italic text-center py-2">Chưa có học sinh trong lớp.</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* 5. HỌC TẬP VÀ RÈN LUYỆN (4 SMALL SUMMARY CARDS - EQUAL HEIGHT H-24) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Điểm TB Lớp */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/gradebook`)}
              className="clay-card p-3 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#6C63FF] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Điểm TB lớp</span>
                <div className="w-7 h-7 rounded-xl bg-[#EEECFF] text-[#6C63FF] flex items-center justify-center shrink-0">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#6C63FF] leading-none">
                  {classAvgScore !== null ? classAvgScore : '—'}
                  <span className="text-xs font-bold text-[#68758D]">/10</span>
                </div>
                <div className="text-[10px] text-[#68758D] font-bold mt-1">
                  {classAvgScore !== null ? `${gradebookData.length} bản ghi điểm` : 'Chưa có dữ liệu điểm'}
                </div>
              </div>
            </div>

            {/* Card 2: HS tiến bộ */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/students`)}
              className="clay-card p-3 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#22C997] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">HS tiến bộ</span>
                <div className="w-7 h-7 rounded-xl bg-[#E6F9F3] text-[#0E8360] flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#0E8360] leading-none">
                  {conductEvents.length > 0 ? conductGoodCount : '—'}
                  <span className="text-xs font-bold text-[#68758D]">/{totalStudents}</span>
                </div>
                <div className="text-[10px] text-[#0E8360] font-bold mt-1">
                  {conductEvents.length > 0 ? `${totalStudents > 0 ? Math.round((conductGoodCount/totalStudents)*100) : 0}% đạt Tốt trở lên` : 'Chưa có dữ liệu thi đua'}
                </div>
              </div>
            </div>

            {/* Card 3: Môn cần chú ý */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/gradebook`)}
              className="clay-card p-3 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#F6B73C] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Môn cần chú ý</span>
                <div className="w-7 h-7 rounded-xl bg-[#FFF9EB] text-[#B47800] flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-base font-black text-[#B47800] truncate leading-none">
                  {weakestSubject ? weakestSubject.name : (gradebookData.length === 0 ? 'Chưa có dữ liệu' : 'Đồng đều')}
                </div>
                <div className="text-[10px] text-[#68758D] font-bold mt-1">
                  {weakestSubject ? `TB: ${Math.round(weakestSubject.avg * 10) / 10}/10` : ''}
                </div>
              </div>
            </div>

            {/* Card 4: Kết quả rèn luyện */}
            <div
              onClick={() => navigate(`/app/classes/${selectedClass.id}/conduct`)}
              className="clay-card p-3 bg-white border border-[#E1E6F0] rounded-2xl hover:border-[#22C997] transition-all cursor-pointer group flex flex-col justify-between h-24"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#68758D]">Rèn luyện Tốt</span>
                <div className="w-7 h-7 rounded-xl bg-[#E6F9F3] text-[#0E8360] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <div className="text-xl font-black text-[#0E8360] leading-none">
                  {conductEvents.length > 0 ? conductGoodCount : '—'}
                  <span className="text-xs font-bold text-[#68758D]">/{totalStudents}</span>
                </div>
                <div className="text-[10px] text-[#0E8360] font-bold mt-1">
                  {conductEvents.length > 0 ? `${totalStudents > 0 ? Math.round((conductGoodCount/totalStudents)*100) : 0}% Đạt Tốt` : 'Chưa có dữ liệu'}
                </div>
              </div>
            </div>
          </div>

          {/* 6. GIÁO VIÊN PHỤ TRÁCH LỚP (FOOTER COLLAPSIBLE BAR) */}
          <div className="clay-card p-4 bg-white border border-[#E1E6F0] rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <UserAvatar name={homeroomTeacherName} size="sm" />
                <div>
                  <div className="font-extrabold text-[#18243A] text-sm">{homeroomTeacherName}</div>
                  <div className="text-[11px] text-[#6C63FF] font-bold">Giáo viên chủ nhiệm {selectedClass.name}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#68758D]">
                {(homeroomUserEmail || selectedClass.homeroom_teacher_name) && (
                  <div>✉️ Email: <span className="text-[#18243A]">{homeroomUserEmail || `${(selectedClass.homeroom_teacher_name || '').toLowerCase().replace(/\s+/g, '').replace(/[àáạảãăắặẳẵâấậẩẫ]/g,'a').replace(/[èéẹẻẽêếệểễ]/g,'e').replace(/[ìíịỉĩ]/g,'i').replace(/[òóọỏõôốộổỗơớợởỡ]/g,'o').replace(/[ùúụủũưứựửữ]/g,'u').replace(/[ỳýỵỷỹ]/g,'y').replace(/[đ]/g,'d')}@school.edu.vn`}</span></div>
                )}
                <div>🕒 Giờ liên hệ: <span className="text-[#18243A]">Thứ 2 – Thứ 6: 07:00 – 17:00</span></div>
                <button
                  onClick={() => setIsTeachersExpanded(!isTeachersExpanded)}
                  className="px-3 py-1 rounded-xl bg-[#EEECFF] text-[#6C63FF] font-extrabold hover:bg-[#DED9FF] transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                >
                  {isTeachersExpanded ? <>Thu gọn <ChevronUp className="h-3.5 w-3.5" /></> : <>Mở rộng GVBM <ChevronDown className="h-3.5 w-3.5" /></>}
                </button>
              </div>
            </div>

            {/* Expandable Subject Teachers List */}
            {isTeachersExpanded && (
              <div className="pt-3 border-t border-[#E1E6F0] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-bold animate-in fade-in">
                {subjectTeachers.length > 0 ? subjectTeachers.slice(0, 6).map((st: any) => (
                  <div key={st.id || st.code} className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                    <div className="text-[#6C63FF] font-extrabold">{st.name || st.subject_name || 'Môn học'}</div>
                    <div>GV: {st.teacher_name || 'Giáo viên bộ môn'}</div>
                    <div className="text-[10px] text-[#68758D]">SĐT: {st.teacher_phone || st.phone || '0981234567'}</div>
                  </div>
                )) : (
                  <>
                    <div className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                      <div className="text-[#6C63FF] font-extrabold">Toán học</div>
                      <div>GV: Thầy Trần Đức Minh</div>
                      <div className="text-[10px] text-[#68758D]">Email: tdminh@school.edu.vn</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                      <div className="text-[#FF5D68] font-extrabold">Ngữ văn</div>
                      <div>GV: Cô Nguyễn Thị Hương</div>
                      <div className="text-[10px] text-[#68758D]">Email: nthuong@school.edu.vn</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                      <div className="text-[#22C997] font-extrabold">Tiếng Anh</div>
                      <div>GV: Cô Lê Hoàng Yến</div>
                      <div className="text-[10px] text-[#68758D]">Email: lhyen@school.edu.vn</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR COLUMN (4 COLUMNS / ~32%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">

          {/* 1. LỊCH HỌC HÔM NAY (TIMELINE COLUMN) */}
          <div className="clay-card p-4 space-y-4 bg-white border border-[#E1E6F0] rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2.5">
              <h2 className="text-sm font-extrabold text-[#18243A] flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#6C63FF]" />
                Lịch học hôm nay
              </h2>
              <span className="text-[10px] font-black text-[#6C63FF] bg-[#EEECFF] px-2 py-0.5 rounded-md border border-[#C0BBFD]">
                {selectedClass.name}
              </span>
            </div>

            {/* Dynamic Timetable Timeline OR Empty State */}
            {todayTimetableSlots.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:left-11 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E1E6F0]">
                {todayTimetableSlots.map((slot: any, idx: number) => (
                  <div key={slot.id || idx} className="flex items-start gap-3 relative z-10">
                    <span className="text-[11px] font-mono font-black text-[#6C63FF] w-10 text-right pt-0.5 shrink-0">
                      Tiết {slot.period}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6C63FF] ring-4 ring-[#EEECFF] mt-1.5 shrink-0"></div>
                    <div className="p-3 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#18243A]">{slot.subject_name || slot.subject || 'Môn học'}</span>
                        <span className="text-[10px] text-[#68758D] font-mono">Phòng {slot.room || selectedClass.room || '201'}</span>
                      </div>
                      <div className="text-[11px] text-[#475467] font-bold">GV: {slot.teacher_name || 'Giáo viên bộ môn'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* CLEAN EMPTY STATE WHEN NO TIMETABLE IS SCHEDULED FOR THIS CLASS */
              <div className="p-5 text-center space-y-3 bg-[#FAFBFF] border border-[#E1E6F0] rounded-2xl my-2">
                <div className="w-12 h-12 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] text-[#6C63FF] flex items-center justify-center mx-auto shadow-2xs">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-[#18243A]">Chưa xếp thời khóa biểu</h3>
                  <p className="text-[11px] text-[#68758D] font-bold leading-relaxed max-w-xs mx-auto">
                    Lớp {selectedClass.name} chưa có lịch học nào được xếp. Vui lòng thiết lập thời khóa biểu cho lớp.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/app/classes/${selectedClass.id}/timetable`)}
                  className="px-3.5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#5A50E6] text-white text-xs font-extrabold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Xếp thời khóa biểu ngay
                </button>
              </div>
            )}

            <button
              onClick={() => navigate(`/app/classes/${selectedClass.id}/timetable`)}
              className="text-xs font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 pt-1 border-t border-[#E1E6F0] w-full justify-between"
            >
              <span>Xem thời khóa biểu đầy đủ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 2. THÔNG BÁO & PHẢN HỒI PHỤ HUYNH DỮ LIỆU THẬT */}
          <div className="clay-card p-4 space-y-3 bg-white border border-[#E1E6F0] rounded-2xl">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2.5">
              <h2 className="text-sm font-extrabold text-[#18243A] flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-[#6C63FF]" />
                Thông báo & Phản hồi PHHS
              </h2>
            </div>

            {/* Subtabs: Tất cả, Đã đọc, Chờ phản hồi */}
            <div className="flex items-center gap-1 bg-[#FAFBFF] p-1 rounded-xl border border-[#E1E6F0] text-[11px] font-extrabold">
              <button
                onClick={() => setNotifTab('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${notifTab === 'all' ? 'bg-[#6C63FF] text-white shadow-2xs' : 'text-[#68758D] hover:bg-[#EEECFF]'}`}
              >
                Tất cả ({classAnnouncements.length})
              </button>
              <button
                onClick={() => setNotifTab('read')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${notifTab === 'read' ? 'bg-[#6C63FF] text-white shadow-2xs' : 'text-[#68758D] hover:bg-[#EEECFF]'}`}
              >
                Đã đọc
              </button>
              <button
                onClick={() => setNotifTab('pending')}
                className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${notifTab === 'pending' ? 'bg-[#6C63FF] text-white shadow-2xs' : 'text-[#68758D] hover:bg-[#EEECFF]'}`}
              >
                Chờ phản hồi
              </button>
            </div>

            {/* Notifications List - only real data */}
            <div className="space-y-2">
              {filteredNotifs.length > 0 ? filteredNotifs.map((n: any, idx: number) => (
                <div key={n.id || idx} className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0] flex items-center justify-between gap-2 hover:border-[#6C63FF] transition-all">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-extrabold text-[#18243A] truncate">{n.title}</div>
                    <div className="text-[10px] text-[#68758D] font-mono">{n.published_at || 'Hôm nay'}</div>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                    n.status === 'read' ? 'bg-[#E6F9F3] text-[#0E8360] border border-[#A3F0D9]' :
                    n.status === 'responded' ? 'bg-[#EEECFF] text-[#6C63FF] border border-[#C0BBFD]' :
                    'bg-[#FFF9EB] text-[#B47800] border border-[#FFE399]'
                  }`}>
                    {n.status === 'read' ? 'Đã đọc' : n.status === 'responded' ? 'Đã phản hồi' : 'Chờ phản hồi'}
                  </span>
                </div>
              )) : (
                <div className="text-center py-5 text-[11px] font-bold text-[#68758D] space-y-2">
                  <div className="text-2xl">📭</div>
                  <div>Chưa có thông báo nào cho lớp {selectedClass.name}.</div>
                  <button onClick={() => navigate(`/app/classes/${selectedClass.id}/announcements`)} className="text-[#6C63FF] hover:underline font-extrabold">Tạo thông báo mới →</button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(`/app/classes/${selectedClass.id}/announcements`)}
              className="text-xs font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 pt-1 border-t border-[#E1E6F0] w-full justify-between"
            >
              <span>Xem tất cả thông báo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 3. LỊCH THI & SỰ KIỆN ĐẾM NGƯỢC WIDGET */}
          <ExamCountdownWidget />

        </div>

      </div>

    </div>
  );
};
