import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockSchoolYears, mockSemesters } from '../../lib/mockData';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { removeVietnameseTones } from '../../utils/accountUtils';
import type { RoleType } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser, currentRole, isSuperAdmin, selectedSchoolYear, setSelectedSchoolYear,
    selectedSemester, setSelectedSemester, selectedClass, setSelectedClass, classesList, permittedClasses, studentsList, logout,
    updateUserPassword, getUserPassword
  } = useAuth();

  const displayClasses = (permittedClasses && permittedClasses.length > 0) ? permittedClasses : classesList;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for auto-closing dropdowns when clicking outside
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Student Header Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = removeVietnameseTones(searchQuery.trim().toLowerCase());
    return (studentsList || []).filter((s) => {
      if (!s) return false;
      const fullNameNorm = removeVietnameseTones((s.full_name || '').toLowerCase());
      const codeNorm = removeVietnameseTones((s.student_code || s.public_id || '').toLowerCase());
      const firstNameNorm = removeVietnameseTones((s.first_name || '').toLowerCase());
      const guardianPhone = (s.primary_guardian_phone || '').toLowerCase();
      const guardianNameNorm = removeVietnameseTones((s.primary_guardian_name || '').toLowerCase());

      return (
        fullNameNorm.includes(query) ||
        codeNorm.includes(query) ||
        firstNameNorm.includes(query) ||
        guardianPhone.includes(query) ||
        guardianNameNorm.includes(query)
      );
    }).slice(0, 6);
  }, [searchQuery, studentsList]);

  const handleSelectStudentResult = (studentCode: string) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    navigate(`/app/classes/${selectedClass?.id || 0}/students/${studentCode}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      setIsSearchFocused(false);
      navigate(`/app/classes/${selectedClass?.id || 0}/students?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Change Password Modal state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const notifications = [
    { id: 1, title: 'Cảnh báo vắng 2 buổi', desc: 'Học sinh Nguyễn Văn Minh Anh vắng chưa xin phép', time: '10 phút trước' },
    { id: 2, title: 'Đơn xin nghỉ mới', desc: 'Phụ huynh học sinh Trần Thị Anh nộp đơn xin nghỉ', time: '1 giờ trước' },
    { id: 3, title: 'Cần duyệt bảng điểm', desc: 'Sổ điểm học kỳ II môn Toán đã hoàn thành 100%', time: '3 giờ trước' },
  ];

  const roleLabels: Record<RoleType, string> = {
    superadmin: 'SuperAdmin Cao cấp',
    homeroom_teacher: 'Giáo viên Chủ nhiệm',
    subject_teacher: 'Giáo viên Bộ môn',
    admin: 'System Admin',
    parent: 'Phụ huynh Học sinh',
    student: 'Học sinh Lớp 7A1',
    standard_user: 'Tài khoản thường (Chưa kích hoạt)',
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const existingPass = getUserPassword(currentUser.id);

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (existingPass && currentPasswordInput !== existingPass) {
      alert('Mật khẩu hiện tại nhập chưa chính xác. Vui lòng thử lại.');
      return;
    }

    if (newPasswordInput.length < 4) {
      alert('Mật khẩu mới phải có tối thiểu 4 ký tự.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      alert('Xác nhận mật khẩu mới chưa trùng khớp.');
      return;
    }

    updateUserPassword(currentUser.id, newPasswordInput);
    setIsChangePasswordModalOpen(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    showToast('🎉 Đã cập nhật đổi mật khẩu thành công!');
  };

  // Clean user display name
  const displayName = currentUser?.name ? currentUser.name.replace(/\s*\([^)]*\)/g, '') : 'Người dùng';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border border-[#E1E6F0] bg-white/95 px-3 md:px-5 backdrop-blur-md shadow-[0_16px_36px_rgba(108,99,255,0.07)] rounded-2xl my-2 max-w-full overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3.5 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-lg animate-in fade-in">
          <i className="fa-solid fa-circle-check text-[#22C997] text-base"></i>
          {toastMessage}
        </div>
      )}

      {/* Left Flex Group: Search Bar + Scope Context Selectors */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        {/* Search Input with Live Dropdown */}
        <div className="relative w-36 sm:w-48 md:w-56 shrink-0">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#68758D] text-xs pointer-events-none z-10"></i>
          <input
            id="header-student-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm học sinh..."
            autoComplete="off"
            className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] py-1.5 pl-9 pr-2 text-xs text-[#18243A] font-bold focus:border-[#6C63FF] focus:bg-white focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(24,36,58,0.04)]"
          />
          {/* Live Dropdown Results */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-[#E1E6F0] bg-white shadow-[0_8px_24px_rgba(24,36,58,0.13)] overflow-hidden">
              {searchResults.map(s => (
                <button
                  key={s.id}
                  onMouseDown={() => handleSelectStudentResult(s.student_code)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#F4F3FF] transition-colors border-b border-[#F0F2FA] last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B7CF6] flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">
                    {s.first_name?.charAt(0) || (s.full_name || 'H').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-[#18243A] truncate">{s.full_name}</div>
                    <div className="text-[10px] text-[#68758D] font-semibold">{s.student_code} · {s.class_name || selectedClass.name}</div>
                  </div>
                </button>
              ))}
              {searchQuery.trim() && (
                <button
                  onMouseDown={() => { setIsSearchFocused(false); navigate(`/app/classes/${selectedClass?.id || 0}/students?search=${encodeURIComponent(searchQuery.trim())}`); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#6C63FF] hover:bg-[#F4F3FF] transition-colors border-t border-[#E1E6F0]"
                >
                  <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                  Xem tất cả kết quả tìm kiếm &ldquo;{searchQuery}&rdquo;
                </button>
              )}
            </div>
          )}
          {/* No results message */}
          {isSearchFocused && searchQuery.trim().length > 0 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-[#E1E6F0] bg-white shadow-[0_8px_24px_rgba(24,36,58,0.13)] px-3 py-3 text-xs text-[#68758D] font-medium">
              Không tìm thấy học sinh &ldquo;{searchQuery}&rdquo;
            </div>
          )}
          {/* Mobile Compact Class Selector */}
          <div className="flex md:hidden items-center shrink-0">
            {!isSuperAdmin && displayClasses.length <= 1 ? (
              <div className="rounded-xl border border-[#C0BBFD] bg-[#EEECFF] px-2 py-1.5 text-xs font-black text-[#6C63FF] flex items-center gap-1 shrink-0" title="Tài khoản của bạn được phân công xem lớp này">
                <i className="fa-solid fa-lock text-[10px]"></i>
                <span className="max-w-[75px] truncate">{selectedClass?.name || 'Lớp của bạn'}</span>
              </div>
            ) : (
              <select
                value={selectedClass?.id || 0}
                onChange={(e) => {
                  const targetId = String(e.target.value);
                  const cls = displayClasses.find((c: any) => String(c.id) === targetId);
                  if (cls) {
                    setSelectedClass(cls);
                    const newPath = location.pathname.replace(/\/app\/classes\/[^\/]+/, `/app/classes/${cls.id}`);
                    if (newPath !== location.pathname) {
                      navigate(newPath);
                    }
                  }
                }}
                className="rounded-xl border border-[#C0BBFD] bg-[#EEECFF] px-2 py-1.5 text-xs font-black text-[#6C63FF] focus:outline-none cursor-pointer max-w-[95px] truncate"
              >
                {displayClasses.length === 0 ? (
                  <option value={0}>Chưa có lớp</option>
                ) : (
                  displayClasses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Scope Context Dropdowns (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 border-l border-[#E1E6F0] pl-2.5">
          {!isSuperAdmin && displayClasses.length <= 1 ? (
            <div className="rounded-xl border border-[#C0BBFD] bg-[#EEECFF] px-3 py-1.5 text-xs font-black text-[#6C63FF] flex items-center gap-1.5 shrink-0" title="Tài khoản của bạn được phân công lớp này">
              <i className="fa-solid fa-lock text-xs text-[#6C63FF]"></i>
              <span>{selectedClass?.name || 'Lớp phân công'}</span>
            </div>
          ) : (
            <select
              value={selectedClass?.id || 0}
              onChange={(e) => {
                const targetId = String(e.target.value);
                const cls = displayClasses.find((c: any) => String(c.id) === targetId);
                if (cls) {
                  setSelectedClass(cls);
                  const newPath = location.pathname.replace(/\/app\/classes\/[^\/]+/, `/app/classes/${cls.id}`);
                  if (newPath !== location.pathname) {
                    navigate(newPath);
                  }
                }
              }}
              className="rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] px-2.5 py-1.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF] focus:outline-none cursor-pointer"
            >
              {displayClasses.length > 0 ? (
                displayClasses.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              ) : (
                <option value="0">Chưa có lớp học nào</option>
              )}
            </select>
          )}

          <select
            value={selectedSchoolYear?.id || 1}
            onChange={(e) => {
              const y = mockSchoolYears.find((sy: any) => sy.id === Number(e.target.value));
              if (y) setSelectedSchoolYear(y);
            }}
            className="rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] px-2.5 py-1.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none cursor-pointer"
          >
            {mockSchoolYears.map((y: any) => (
              <option key={y.id} value={y.id}>Năm {y.name}</option>
            ))}
          </select>

          <select
            value={selectedSemester?.id || 1}
            onChange={(e) => {
              const sem = mockSemesters.find((s: any) => s.id === Number(e.target.value));
              if (sem) setSelectedSemester(sem);
            }}
            className="rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] px-2.5 py-1.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none cursor-pointer"
          >
            {mockSemesters.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Flex Group: Fixed Account Role Badge + Notifications + User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Fixed Active Account Role Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-[#EEECFF] border border-[#C0BBFD] px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
          <i className="fa-solid fa-user-check text-[#6C63FF] text-sm shrink-0"></i>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-extrabold text-[#6C63FF] leading-none">Vai trò tài khoản</span>
            <span className="text-xs font-extrabold text-[#18243A] leading-tight">
              {roleLabels[currentRole]}
            </span>
          </div>
        </div>

        {/* Notifications Bell */}
        <div ref={notificationsRef} className="relative shrink-0">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 text-[#68758D] hover:text-[#6C63FF] rounded-xl hover:bg-[#EEECFF] transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-bell text-base"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#FF5D68] ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#E1E6F0] p-4 shadow-2xl z-50 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-extrabold text-[#18243A]">Thông Báo Hệ Thống</h4>
                  {unreadCount > 0 && (
                    <span className="bg-[#FF5D68] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setUnreadCount(0)}
                  className="text-[11px] font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-check text-xs"></i> Đọc tất cả
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0] hover:bg-[#EEECFF]/60 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#18243A]">{n.title}</span>
                      <span className="text-[10px] text-[#68758D] font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#68758D] font-medium leading-tight">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Change Password / Logout Popover */}
        <div ref={userMenuRef} className="relative shrink-0">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 border-l border-[#E1E6F0] hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8178FF] font-extrabold text-white text-xs shadow-md shrink-0">
              {(displayName || 'U').charAt(0)}
            </div>
            <div className="hidden lg:flex flex-col text-left shrink-0">
              <span className="text-xs font-extrabold text-[#18243A] leading-tight whitespace-nowrap">{displayName}</span>
              <span className="text-[10px] text-[#0E8360] font-extrabold leading-tight whitespace-nowrap">{roleLabels[currentRole]}</span>
            </div>
            <i className="fa-solid fa-chevron-down text-[#68758D] text-xs shrink-0"></i>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E1E6F0] p-3 shadow-2xl z-50 animate-in fade-in space-y-2">
              <div className="p-2.5 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0]">
                <div className="text-xs font-extrabold text-[#18243A]">{displayName}</div>
                <div className="text-[10px] text-[#68758D] font-semibold">{currentUser.email}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="inline-block text-[10px] font-extrabold text-[#6C63FF] bg-[#EEECFF] px-2 py-0.5 rounded-md border border-[#C0BBFD]">
                    {roleLabels[currentRole]}
                  </span>
                  <span className={`text-[10px] font-bold ${existingPass ? 'text-[#0E8360]' : 'text-[#D32F2F]'}`}>
                    {existingPass ? '🔑 Đã có mật khẩu' : '⚠️ Chưa tạo khẩu'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); setIsChangePasswordModalOpen(true); }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold text-[#6C63FF] bg-[#EEECFF] hover:bg-[#DED9FF] border border-[#C0BBFD] transition-colors cursor-pointer"
              >
                <span>{existingPass ? '🔑 Đổi mật khẩu tài khoản' : '🔑 Khởi tạo mật khẩu mới'}</span>
                <i className="fa-solid fa-key text-xs"></i>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold text-[#FF5D68] bg-[#FFEFEF] hover:bg-[#FFD4D7] border border-[#FFC0C3] transition-colors cursor-pointer"
              >
                <span>Đăng xuất tài khoản</span>
                <i className="fa-solid fa-right-from-bracket text-sm"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        title={existingPass ? `Đổi Mật Khẩu Tài Khoản: ${displayName}` : `Cập Nhật Mật Khẩu Mới: ${displayName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsChangePasswordModalOpen(false)}>Hủy bỏ</Button>
            <Button onClick={handleChangePasswordSubmit} icon={<i className="fa-solid fa-key text-xs"></i>}>
              Lưu thay đổi mật khẩu
            </Button>
          </>
        }
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
          {existingPass ? (
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mật khẩu hiện tại:</label>
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#FFF9EB] border border-[#FFE399] text-xs font-bold text-[#B47800]">
              ℹ️ Tài khoản của bạn chưa được cài đặt mật khẩu riêng. Vui lòng khởi tạo mật khẩu mới bên dưới.
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mật khẩu mới:</label>
            <input
              type="password"
              required
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Xác nhận mật khẩu mới:</label>
            <input
              type="password"
              required
              value={confirmPasswordInput}
              onChange={(e) => setConfirmPasswordInput(e.target.value)}
              placeholder="Xác nhận mật khẩu mới..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </header>
  );
};
