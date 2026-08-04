import React from 'react';
import {
  Activity,
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileChartColumn,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageCircleMore,
  School,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClayIcon } from '../ui/ClayIcon';

const modules = [
  { path: 'students', label: 'Học sinh', icon: Users, tone: 'sky' },
  { path: 'attendance', label: 'Điểm danh & QR', icon: ClipboardCheck, tone: 'mint' },
  { path: 'gradebook', label: 'Điểm số', icon: GraduationCap, tone: 'lavender' },
  { path: 'conduct', label: 'Thi đua', icon: Sparkles, tone: 'lemon' },
  { path: 'timetable', label: 'Thời khóa biểu', icon: CalendarDays, tone: 'peach' },
  { path: 'assignments', label: 'Công việc', icon: BookOpenCheck, tone: 'sky' },
  { path: 'announcements', label: 'Thông báo', icon: Megaphone, tone: 'rose' },
  { path: 'incidents', label: 'Sự vụ', icon: ShieldAlert, tone: 'rose' },
  { path: 'leave-requests', label: 'Đơn nghỉ', icon: Activity, tone: 'mint' },
  { path: 'posts', label: 'Bảng tin', icon: MessageCircleMore, tone: 'lavender' },
  { path: 'reports', label: 'Báo cáo', icon: FileChartColumn, tone: 'lemon' },
] as const;

export const Sidebar: React.FC = () => {
  const { selectedClass } = useAuth();
  const classId = selectedClass?.id;

  return (
    <aside className="clay-sidebar">
      <div className="clay-brand">
        <div className="clay-brand__mark">
          <School aria-hidden="true" />
        </div>
        <div>
          <strong>EduClass</strong>
          <span>Quản trị lớp học</span>
        </div>
      </div>

      <NavLink
        to="/app/dashboard"
        className={({ isActive }) => 'clay-nav-item' + (isActive ? ' is-active' : '')}
      >
        <ClayIcon icon={LayoutDashboard} tone="lavender" size="sm" />
        <span>Dashboard lớp</span>
      </NavLink>

      <div className="clay-sidebar__label">Module lớp học</div>
      <nav className="clay-sidebar__nav">
        {modules.map((item) => (
          <NavLink
            key={item.path}
            to={classId ? '/app/classes/' + classId + '/' + item.path : '/app/dashboard'}
            className={({ isActive }) => 'clay-nav-item' + (isActive ? ' is-active' : '')}
          >
            <ClayIcon icon={item.icon} tone={item.tone} size="sm" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="clay-sidebar__footer">
        <ClayIcon icon={ChartNoAxesCombined} tone="mint" size="sm" />
        <div>
          <strong>Dữ liệu đã kết nối</strong>
          <span>Đồng bộ từ MySQL</span>
        </div>
      </div>
    </aside>
  );
};
