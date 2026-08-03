import React from 'react';
import type { RoleType } from '../../types';

interface RoleBadgeProps {
  role: RoleType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const roleConfig: Record<string, { label: string; icon: string; style: string }> = {
  superadmin: {
    label: 'SuperAdmin Cao cấp',
    icon: 'fa-solid fa-crown text-amber-500',
    style: 'bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 border-purple-300/60 text-purple-800 shadow-[0_2px_10px_rgba(147,51,234,0.15)] ring-1 ring-purple-400/20',
  },
  admin: {
    label: 'System Admin',
    icon: 'fa-solid fa-user-shield text-emerald-600',
    style: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.12)]',
  },
  homeroom_teacher: {
    label: 'GV Chủ Nhiệm',
    icon: 'fa-solid fa-chalkboard-user text-indigo-600',
    style: 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border-indigo-300 text-indigo-800 shadow-[0_2px_8px_rgba(99,102,241,0.12)]',
  },
  subject_teacher: {
    label: 'GV Bộ Môn',
    icon: 'fa-solid fa-book-open-reader text-sky-600',
    style: 'bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-sky-300 text-sky-800 shadow-[0_2px_8px_rgba(14,165,233,0.12)]',
  },
  parent: {
    label: 'Phụ Huynh Học Sinh',
    icon: 'fa-solid fa-users-between-lines text-amber-600',
    style: 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300 text-amber-900 shadow-[0_2px_8px_rgba(245,158,11,0.12)]',
  },
  student: {
    label: 'Học Sinh',
    icon: 'fa-solid fa-graduation-cap text-cyan-600',
    style: 'bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 border-cyan-300 text-cyan-900 shadow-[0_2px_8px_rgba(6,182,212,0.12)]',
  },
  standard_user: {
    label: 'Tài khoản thường',
    icon: 'fa-solid fa-user-clock text-slate-500',
    style: 'bg-slate-100 border-slate-300 text-slate-700',
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = roleConfig[role] || {
    label: role,
    icon: 'fa-solid fa-user text-slate-500',
    style: 'bg-slate-100 border-slate-300 text-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-lg',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
    lg: 'px-3.5 py-1.5 text-xs gap-2 rounded-xl font-black',
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold border tracking-tight whitespace-nowrap transition-all ${sizeStyles[size]} ${config.style} ${className}`}
    >
      {showIcon && <i className={`${config.icon} shrink-0`}></i>}
      <span>{config.label}</span>
    </span>
  );
};
