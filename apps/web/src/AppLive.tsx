import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  Activity, BookOpenCheck, CalendarDays, FileChartColumn, GraduationCap,
  LayoutGrid, Megaphone, MessageCircleMore, ShieldAlert, Sparkles,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { Sidebar } from './components/layout/Sidebar';
import { StatePanel } from './components/ui/StatePanel';
import { AdminLivePage } from './pages/AdminLivePage';
import { AttendanceLivePage } from './pages/AttendanceLivePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ModulePage, type ModuleConfig } from './pages/ModulePage';
import { StudentsLivePage } from './pages/StudentsLivePage';

const moduleConfigs: ModuleConfig[] = [
  { moduleKey: 'gradebook', title: 'Sổ điểm', description: 'Điểm số và nhận xét môn học', itemLabel: 'Điểm số', icon: GraduationCap, tone: 'lavender', fields: [{ key: 'student_name', label: 'Học sinh', required: true }, { key: 'subject', label: 'Môn học', required: true }, { key: 'score', label: 'Điểm', type: 'number', required: true }, { key: 'assessment', label: 'Loại đánh giá' }, { key: 'occurred_at', label: 'Ngày đánh giá', type: 'date' }, { key: 'note', label: 'Nhận xét', type: 'textarea' }], columns: [{ key: 'student_name', label: 'Học sinh' }, { key: 'subject', label: 'Môn' }, { key: 'score', label: 'Điểm' }, { key: 'assessment', label: 'Đánh giá' }, { key: 'occurred_at', label: 'Ngày' }] },
  { moduleKey: 'conduct', title: 'Thi đua & rèn luyện', description: 'Theo dõi điểm cộng, điểm trừ', itemLabel: 'Ghi nhận', icon: Sparkles, tone: 'lemon', fields: [{ key: 'student_name', label: 'Học sinh', required: true }, { key: 'category', label: 'Nội dung', required: true }, { key: 'points', label: 'Điểm', type: 'number', required: true }, { key: 'occurred_at', label: 'Thời gian', type: 'datetime-local' }, { key: 'note', label: 'Ghi chú', type: 'textarea' }], columns: [{ key: 'student_name', label: 'Học sinh' }, { key: 'category', label: 'Nội dung' }, { key: 'points', label: 'Điểm' }, { key: 'occurred_at', label: 'Thời gian' }] },
  { moduleKey: 'timetable', title: 'Thời khóa biểu', description: 'Lịch học theo lớp', itemLabel: 'Tiết học', icon: CalendarDays, tone: 'peach', fields: [{ key: 'weekday', label: 'Thứ', type: 'select', options: ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'], required: true }, { key: 'period', label: 'Tiết', type: 'number', required: true }, { key: 'subject', label: 'Môn học', required: true }, { key: 'teacher', label: 'Giáo viên' }, { key: 'room', label: 'Phòng' }], columns: [{ key: 'weekday', label: 'Ngày' }, { key: 'period', label: 'Tiết' }, { key: 'subject', label: 'Môn' }, { key: 'teacher', label: 'Giáo viên' }, { key: 'room', label: 'Phòng' }] },
  { moduleKey: 'assignments', title: 'Công việc lớp', description: 'Bài tập và nhiệm vụ cần hoàn thành', itemLabel: 'Công việc', icon: BookOpenCheck, tone: 'sky', fields: [{ key: 'title', label: 'Tiêu đề', required: true }, { key: 'subject', label: 'Môn học' }, { key: 'due_at', label: 'Hạn hoàn thành', type: 'datetime-local' }, { key: 'status', label: 'Trạng thái', type: 'select', options: ['PENDING','IN_PROGRESS','COMPLETED','CLOSED'] }, { key: 'description', label: 'Mô tả', type: 'textarea' }], columns: [{ key: 'title', label: 'Công việc' }, { key: 'subject', label: 'Môn' }, { key: 'due_at', label: 'Hạn' }, { key: 'status', label: 'Trạng thái' }] },
  { moduleKey: 'announcements', title: 'Thông báo', description: 'Thông tin chính thức của lớp', itemLabel: 'Thông báo', icon: Megaphone, tone: 'rose', fields: [{ key: 'title', label: 'Tiêu đề', required: true }, { key: 'audience', label: 'Đối tượng' }, { key: 'published_at', label: 'Thời gian đăng', type: 'datetime-local' }, { key: 'content', label: 'Nội dung', type: 'textarea', required: true }], columns: [{ key: 'title', label: 'Tiêu đề' }, { key: 'audience', label: 'Đối tượng' }, { key: 'published_at', label: 'Thời gian' }, { key: 'content', label: 'Nội dung' }] },
  { moduleKey: 'incidents', title: 'Sự vụ', description: 'Theo dõi sự việc cần xử lý', itemLabel: 'Sự vụ', icon: ShieldAlert, tone: 'rose', fields: [{ key: 'student_name', label: 'Học sinh' }, { key: 'title', label: 'Sự việc', required: true }, { key: 'severity', label: 'Mức độ', type: 'select', options: ['LOW','MEDIUM','HIGH'] }, { key: 'status', label: 'Trạng thái', type: 'select', options: ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'] }, { key: 'occurred_at', label: 'Thời gian', type: 'datetime-local' }, { key: 'description', label: 'Chi tiết', type: 'textarea' }], columns: [{ key: 'student_name', label: 'Học sinh' }, { key: 'title', label: 'Sự việc' }, { key: 'severity', label: 'Mức độ' }, { key: 'status', label: 'Trạng thái' }] },
  { moduleKey: 'leave-requests', title: 'Đơn nghỉ học', description: 'Yêu cầu nghỉ học từ phụ huynh', itemLabel: 'Đơn nghỉ', icon: Activity, tone: 'mint', fields: [{ key: 'student_name', label: 'Học sinh', required: true }, { key: 'from_date', label: 'Từ ngày', type: 'date', required: true }, { key: 'to_date', label: 'Đến ngày', type: 'date', required: true }, { key: 'status', label: 'Trạng thái', type: 'select', options: ['PENDING','APPROVED','REJECTED'] }, { key: 'reason', label: 'Lý do', type: 'textarea', required: true }], columns: [{ key: 'student_name', label: 'Học sinh' }, { key: 'from_date', label: 'Từ ngày' }, { key: 'to_date', label: 'Đến ngày' }, { key: 'status', label: 'Trạng thái' }] },
  { moduleKey: 'posts', title: 'Bảng tin lớp', description: 'Trao đổi chung trong lớp', itemLabel: 'Bài viết', icon: MessageCircleMore, tone: 'lavender', fields: [{ key: 'title', label: 'Tiêu đề', required: true }, { key: 'author', label: 'Người đăng' }, { key: 'published_at', label: 'Thời gian', type: 'datetime-local' }, { key: 'content', label: 'Nội dung', type: 'textarea', required: true }], columns: [{ key: 'title', label: 'Tiêu đề' }, { key: 'author', label: 'Người đăng' }, { key: 'published_at', label: 'Thời gian' }, { key: 'content', label: 'Nội dung' }] },
  { moduleKey: 'reports', title: 'Báo cáo lớp', description: 'Báo cáo tổng hợp theo kỳ', itemLabel: 'Báo cáo', icon: FileChartColumn, tone: 'lemon', fields: [{ key: 'title', label: 'Tên báo cáo', required: true }, { key: 'period', label: 'Kỳ báo cáo' }, { key: 'status', label: 'Trạng thái' }, { key: 'occurred_at', label: 'Ngày lập', type: 'date' }, { key: 'summary', label: 'Tóm tắt', type: 'textarea' }], columns: [{ key: 'title', label: 'Báo cáo' }, { key: 'period', label: 'Kỳ' }, { key: 'status', label: 'Trạng thái' }, { key: 'occurred_at', label: 'Ngày' }] },
  { moduleKey: 'seating-chart', title: 'Sơ đồ chỗ ngồi', description: 'Vị trí bàn ghế và học sinh', itemLabel: 'Vị trí', icon: LayoutGrid, tone: 'sky', fields: [{ key: 'student_name', label: 'Học sinh', required: true }, { key: 'row', label: 'Hàng', type: 'number', required: true }, { key: 'seat', label: 'Vị trí', type: 'number', required: true }, { key: 'note', label: 'Ghi chú' }], columns: [{ key: 'student_name', label: 'Học sinh' }, { key: 'row', label: 'Hàng' }, { key: 'seat', label: 'Vị trí' }, { key: 'note', label: 'Ghi chú' }] },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="clay-app"><Sidebar /><div className="clay-main"><Header /><main className="clay-main__content">{children}</main><MobileNav /></div></div>;

const Protected: React.FC<{ children: React.ReactNode; admin?: boolean }> = ({ children, admin }) => {
  const { isLoading, isAuthenticated, isSuperAdmin } = useAuth();
  if (isLoading) return <div className="clay-auth-loading"><StatePanel variant="loading" title="Đang xác thực session" message="Kiểm tra session phía server trong MySQL." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (admin && !isSuperAdmin) return <Navigate to="/app/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const RootRedirect = () => {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/app/dashboard' : '/login'} replace />;
};

export default function AppLive() {
  const baseUrl = import.meta.env.BASE_URL || '/thcs/';
  return <AuthProvider><BrowserRouter basename={baseUrl}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/app/dashboard" element={<Protected><DashboardPage /></Protected>} />
    <Route path="/app/classes/:classId/students" element={<Protected><StudentsLivePage /></Protected>} />
    <Route path="/app/classes/:classId/attendance" element={<Protected><AttendanceLivePage /></Protected>} />
    {moduleConfigs.map((config) => <Route key={config.moduleKey} path={`/app/classes/:classId/${config.moduleKey}`} element={<Protected><ModulePage config={config} /></Protected>} />)}
    <Route path="/app/classes/:classId/students/:studentId" element={<Protected><StudentsLivePage /></Protected>} />
    <Route path="/app/admin" element={<Protected admin><AdminLivePage /></Protected>} />
    <Route path="/portal/parent" element={<Protected><DashboardPage /></Protected>} />
    <Route path="/portal/student" element={<Protected><DashboardPage /></Protected>} />
    <Route path="/" element={<RootRedirect />} />
    <Route path="*" element={<RootRedirect />} />
  </Routes></BrowserRouter></AuthProvider>;
}
