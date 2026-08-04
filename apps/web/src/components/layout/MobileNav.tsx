import React from 'react';
import { ClipboardCheck, GraduationCap, LayoutDashboard, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { selectedClass } = useAuth();
  const classId = selectedClass?.id || '';
  const items = [
    { to: '/app/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/app/classes/' + classId + '/students', label: 'Học sinh', icon: Users },
    { to: '/app/classes/' + classId + '/attendance', label: 'Điểm danh', icon: ClipboardCheck },
    { to: '/app/classes/' + classId + '/gradebook', label: 'Điểm', icon: GraduationCap },
  ];

  return (
    <nav className="clay-mobile-nav">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={label} to={to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
