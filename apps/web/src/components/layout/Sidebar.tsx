import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/RoleBadge';
import { UserAvatar } from '../ui/UserAvatar';

export const Sidebar: React.FC = () => {
  const { selectedClass, currentRole, currentUser, setSelectedClass, classesList, permittedClasses } = useAuth();
  const displayClasses = (permittedClasses && permittedClasses.length > 0) ? permittedClasses : classesList;
  const classId = selectedClass?.id || 0;
  const baseUrl = import.meta.env.BASE_URL || '/thcs';
  const logoUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}favicon.png`;

  const [isCollapsed, setIsCollapsed] = useState(false);

  const getNavItems = () => {
    if (currentRole === 'parent') {
      return [
        { to: '/portal/parent', label: 'Cổng Phụ Huynh', iconClass: 'fa-solid fa-heart-pulse', color: 'text-[#FF5D68]', bg: 'bg-[#FFEFEF]' },
        { to: `/app/classes/${classId}/feed`, label: 'Bảng tin Lớp học', iconClass: 'fa-solid fa-bolt', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
        { to: `/app/classes/${classId}/announcements`, label: 'Thông báo Lớp', iconClass: 'fa-solid fa-bullhorn', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
        { to: `/app/classes/${classId}/leave-requests`, label: 'Đơn xin nghỉ', iconClass: 'fa-solid fa-file-signature', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      ];
    }

    if (currentRole === 'student') {
      return [
        { to: '/portal/student', label: 'Cổng Học Sinh', iconClass: 'fa-solid fa-circle-user', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
        { to: `/app/classes/${classId}/feed`, label: 'Bảng tin Lớp học', iconClass: 'fa-solid fa-bolt', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
        { to: `/app/classes/${classId}/leave-requests`, label: 'Đơn xin nghỉ học', iconClass: 'fa-solid fa-file-signature', color: 'text-[#FF5D68]', bg: 'bg-[#FFEFEF]' },
        { to: `/app/classes/${classId}/timetable`, label: 'Thời khóa biểu', iconClass: 'fa-solid fa-calendar-days', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
        { to: `/app/classes/${classId}/assignments`, label: 'Bài tập về nhà', iconClass: 'fa-solid fa-book-bookmark', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      ];
    }

    const isSuperAdminOrAdmin = currentRole === 'superadmin' || currentRole === 'admin';

    return [
      { to: '/app/dashboard', label: 'Tổng quan', iconClass: 'fa-solid fa-chart-pie', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/feed`, label: 'Bảng tin lớp học', iconClass: 'fa-solid fa-bolt', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
      { to: `/app/classes/${classId}/students`, label: 'Hồ sơ học sinh', iconClass: 'fa-solid fa-user-graduate', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      { to: `/app/classes/${classId}/attendance`, label: 'Chuyên cần', iconClass: 'fa-solid fa-clipboard-user', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/leave-requests`, label: 'Đơn xin nghỉ', iconClass: 'fa-solid fa-file-signature', color: 'text-[#FF5D68]', bg: 'bg-[#FFEFEF]' },
      { to: `/app/classes/${classId}/gradebook`, label: 'Sổ điểm & Học tập', iconClass: 'fa-solid fa-graduation-cap', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/conduct`, label: 'Rèn luyện & Thi đua', iconClass: 'fa-solid fa-award', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
      { to: `/app/classes/${classId}/timetable`, label: 'Thời khóa biểu', iconClass: 'fa-solid fa-calendar-days', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      { to: `/app/classes/${classId}/assignments`, label: 'Bài tập về nhà', iconClass: 'fa-solid fa-book-bookmark', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/announcements`, label: 'Thông báo & Phản hồi', iconClass: 'fa-solid fa-bullhorn', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/reports`, label: 'Báo cáo & Xuất liệu', iconClass: 'fa-solid fa-file-export', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      ...(isSuperAdminOrAdmin ? [{ to: '/app/admin', label: 'Quản trị & Phân quyền', iconClass: 'fa-solid fa-shield-halved', color: 'text-[#B47800]', bg: 'bg-[#FFF9EB]', badge: currentRole === 'superadmin' ? 'SuperAdmin' : undefined }] : []),
    ];
  };

  const navItems = getNavItems();
  const displayName = currentUser?.name ? currentUser.name.replace(/\s*\([^)]*\)/g, '') : 'Người dùng';

  return (
    <aside
      className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-white text-[#18243A] z-40 border-r border-[#E1E6F0] shadow-[4px_0_24px_rgba(108,99,255,0.06)] transition-all duration-300 ${
        isCollapsed ? 'w-[78px]' : 'w-[265px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center gap-3 p-4 border-b border-[#E1E6F0] bg-[#FAFBFF] ${isCollapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] p-1 shadow-xs shrink-0">
          <img src={logoUrl} alt="Logo Quản Trị Giáo Dục" className="w-full h-full object-contain" />
        </div>

        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-sm leading-tight tracking-tight text-[#18243A] truncate">
              QUẢN TRỊ <span className="text-[#6C63FF]">GIÁO DỤC</span>
            </div>
            <div className="text-[10px] text-[#68758D] font-extrabold tracking-wider uppercase mt-0.5 truncate">
              Class & School SaaS
            </div>
          </div>
        )}
      </div>

      {/* Active Class Scope Selector Dropdown */}
      {!isCollapsed ? (
        <div className="px-3 py-2 mx-3 my-2.5 rounded-2xl bg-gradient-to-r from-[#EEECFF] to-[#E6F9F3] border border-[#C0BBFD] shadow-2xs">
          <select
            value={selectedClass?.id || 0}
            onChange={(e) => {
              const targetId = Number(e.target.value);
              const cls = displayClasses.find((c: any) => Number(c.id) === targetId);
              if (cls) setSelectedClass(cls);
            }}
            className="w-full bg-transparent font-black text-xs text-[#6C63FF] focus:outline-none cursor-pointer truncate"
          >
            {displayClasses.map((c: any) => (
              <option key={c.id} value={c.id}>🎓 {c.name} - {c.room}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="my-2 flex justify-center" title={`Lớp: ${selectedClass?.name}`}>
          <div className="w-9 h-9 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] text-[#6C63FF] font-black text-xs flex items-center justify-center">
            {selectedClass?.name || '8A3'}
          </div>
        </div>
      )}

      {/* Nav Menu Items */}
      <nav className="flex-1 space-y-1 px-2.5 py-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#6C63FF] text-white shadow-[0_6px_16px_rgba(108,99,255,0.35)] font-black'
                  : 'text-[#68758D] hover:bg-[#FAFBFF] hover:text-[#18243A]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'truncate'}`}>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`
                    }`}
                  >
                    <i className={`${item.iconClass} text-xs`}></i>
                  </div>
                  {!isCollapsed && <span className="truncate text-xs font-extrabold">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ml-1 ${
                    isActive ? 'bg-white text-[#6C63FF] border-white' : 'bg-[#FFF9EB] text-[#B47800] border-[#FFE399]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Collapse Toggle Button */}
      <div className="px-3 py-2 border-t border-[#E1E6F0]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'} px-3 py-2 rounded-2xl text-xs font-extrabold text-[#68758D] hover:bg-[#EEECFF] hover:text-[#6C63FF] transition-colors cursor-pointer`}
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
          {!isCollapsed && <span>Thu gọn</span>}
        </button>
      </div>

      {/* Sidebar Footer User Card */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#E1E6F0] bg-gradient-to-br from-[#FAFBFF] to-[#F4F3FF] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <UserAvatar
              name={displayName}
              avatarUrl={currentUser.avatar_url || currentUser.avatar}
              role={currentRole}
              size="xs"
              status="online"
              showRoleBadge={false}
            />

            <div className="truncate min-w-0">
              <div className="font-extrabold text-[#18243A] text-xs truncate leading-tight">{displayName}</div>
              <div className="mt-0.5">
                <RoleBadge role={currentRole} size="sm" showIcon={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
