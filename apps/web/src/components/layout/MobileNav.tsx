import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, BookOpen, Menu } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { selectedClass } = useAuth();
  const classId = selectedClass?.id || 0;

  const navItems = [
    { to: '/app/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: `/app/classes/${classId}/students`, label: 'Học sinh', icon: Users },
    { to: `/app/classes/${classId}/attendance`, label: 'Điểm danh', icon: CalendarCheck },
    { to: `/app/classes/${classId}/gradebook`, label: 'Sổ điểm', icon: BookOpen },
    { to: `/app/classes/${classId}/reports`, label: 'Báo cáo', icon: Menu },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around h-14 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-500 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="h-4 w-4 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
