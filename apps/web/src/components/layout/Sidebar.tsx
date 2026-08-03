import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { selectedClass, currentRole, currentUser } = useAuth();
  const classId = selectedClass?.id || 0;
  const baseUrl = import.meta.env.BASE_URL || '/thcs';
  const logoUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}favicon.png`;

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
      { to: '/app/dashboard', label: 'Tổng quan (Dashboard)', iconClass: 'fa-solid fa-chart-pie', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/feed`, label: 'Bảng tin Lớp học (Feed)', iconClass: 'fa-solid fa-bolt', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
      { to: `/app/classes/${classId}/students`, label: 'Hồ sơ học sinh', iconClass: 'fa-solid fa-user-graduate', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      { to: `/app/classes/${classId}/attendance`, label: 'Chuyên cần & Điểm danh', iconClass: 'fa-solid fa-clipboard-user', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/leave-requests`, label: 'Đơn xin nghỉ', iconClass: 'fa-solid fa-file-signature', color: 'text-[#FF5D68]', bg: 'bg-[#FFEFEF]' },
      { to: `/app/classes/${classId}/gradebook`, label: 'Sổ điểm & Học tập', iconClass: 'fa-solid fa-graduation-cap', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/conduct`, label: 'Rèn luyện & Thi đua', iconClass: 'fa-solid fa-award', color: 'text-[#F6B73C]', bg: 'bg-[#FFF9EB]' },
      { to: `/app/classes/${classId}/timetable`, label: 'Thời khóa biểu & Tiết học', iconClass: 'fa-solid fa-calendar-days', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      { to: `/app/classes/${classId}/assignments`, label: 'Bài tập về nhà', iconClass: 'fa-solid fa-book-bookmark', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/announcements`, label: 'Thông báo & Phản hồi', iconClass: 'fa-solid fa-bullhorn', color: 'text-[#6C63FF]', bg: 'bg-[#EEECFF]' },
      { to: `/app/classes/${classId}/incidents`, label: 'Sự cố & Kỷ luật', iconClass: 'fa-solid fa-triangle-exclamation', color: 'text-[#FF5D68]', bg: 'bg-[#FFEFEF]' },
      { to: `/app/classes/${classId}/reports`, label: 'Báo cáo & Xuất file', iconClass: 'fa-solid fa-file-export', color: 'text-[#22C997]', bg: 'bg-[#E6F9F3]' },
      ...(isSuperAdminOrAdmin ? [{ to: '/app/admin', label: 'Quản trị & Phân quyền', iconClass: 'fa-solid fa-shield-halved', color: 'text-[#B47800]', bg: 'bg-[#FFF9EB]', badge: currentRole === 'superadmin' ? 'SuperAdmin' : undefined }] : []),
    ];
  };

  const navItems = getNavItems();
  const displayName = currentUser?.name ? currentUser.name.replace(/\s*\([^)]*\)/g, '') : 'Người dùng';

  return (
    <aside className="hidden lg:flex w-[275px] flex-col fixed inset-y-0 left-0 bg-white text-[#18243A] z-40 border-r border-[#E1E6F0] shadow-[4px_0_24px_rgba(108,99,255,0.06)]">
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#E1E6F0] bg-[#FAFBFF]">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] p-1 shadow-xs shrink-0">
          <img src={logoUrl} alt="Logo Quản Trị Giáo Dục" className="w-full h-full object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-[#18243A] truncate">
            QUẢN TRỊ <span className="text-[#6C63FF]">GIÁO DỤC</span>
          </div>
          <div className="text-[10px] text-[#68758D] font-extrabold tracking-wider uppercase mt-0.5 truncate">
            Class & School Management
          </div>
        </div>
      </div>

      {/* Class Scope Selector Widget */}
      <div className="px-3 py-2.5 mx-3 my-3 rounded-2xl bg-gradient-to-r from-[#EEECFF] to-[#E6F9F3] border border-[#C0BBFD] shadow-xs">
        <div className="flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`w-2.5 h-2.5 rounded-full ${selectedClass && selectedClass.id !== 0 ? 'bg-[#22C997] animate-pulse' : 'bg-[#FF5D68]'} shrink-0`}></span>
            <span className="font-extrabold text-[#18243A] text-xs truncate">
              {selectedClass && selectedClass.id !== 0 ? `${selectedClass.name} - ${selectedClass.room}` : 'Chưa có lớp học'}
            </span>
          </div>

          {currentRole === 'superadmin' && (
            <span className="font-extrabold text-[10px] text-[#B47800] bg-[#FFF9EB] px-2 py-0.5 rounded-md border border-[#FFE399] shrink-0 flex items-center gap-1 shadow-2xs">
              <i className="fa-solid fa-crown text-[#F6B73C]"></i> Admin
            </span>
          )}
        </div>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 space-y-1 px-3 py-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#6C63FF] text-white shadow-[0_6px_16px_rgba(108,99,255,0.35)] font-black translate-x-1'
                  : 'text-[#68758D] hover:bg-[#FAFBFF] hover:text-[#18243A] hover:translate-x-1'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-white/20 text-white' : `${item.bg} ${item.color}`
                    }`}
                  >
                    <i className={`${item.iconClass} text-xs`}></i>
                  </div>
                  <span className="truncate text-xs font-extrabold">{item.label}</span>
                </div>

                {item.badge && (
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

      {/* Sidebar Footer User Card */}
      <div className="p-3.5 border-t border-[#E1E6F0] bg-[#FAFBFF] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 truncate">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8178FF] text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
              {(displayName || 'U').charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#22C997] ring-2 ring-white"></span>
          </div>

          <div className="truncate">
            <div className="font-extrabold text-[#18243A] text-xs truncate leading-tight">{displayName}</div>
            <div className="text-[10px] text-[#0E8360] font-extrabold uppercase leading-tight mt-0.5">Trực tuyến</div>
          </div>
        </div>

        <span className="text-[10px] font-extrabold text-[#6C63FF] bg-[#EEECFF] px-2 py-0.5 rounded-md border border-[#C0BBFD]">
          Pro v1.0
        </span>
      </div>
    </aside>
  );
};
