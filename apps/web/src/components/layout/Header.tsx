import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mockSchoolYears, mockSemesters } from '../../lib/mockData';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RoleBadge } from '../ui/RoleBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { removeVietnameseTones } from '../../utils/accountUtils';
import { syncAllFromDb } from '../../lib/dbSync';

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

  // Dynamic Real System Notifications State
  const [dbVersion, setDbVersion] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('thcs_read_notification_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Sync DB on mount & listen to real-time database update events
  useEffect(() => {
    syncAllFromDb().then(() => {
      setDbVersion(v => v + 1);
    });

    const handleUpdate = () => {
      setDbVersion(v => v + 1);
    };

    window.addEventListener('thcs_db_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('thcs_db_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const generatedNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: string;
      title: string;
      desc: string;
      time: string;
      targetUrl: string;
      icon: string;
      iconBg: string;
      isRead: boolean;
    }> = [];
    const className = selectedClass?.name || 'Lớp học';
    const classId = selectedClass?.id || 0;

    // 1. Check Pending Leave Requests (ALL pending requests)
    try {
      const leaveCached = localStorage.getItem(`thcs_leave_requests_class_${classId}`) || localStorage.getItem('thcs_leave_requests');
      if (leaveCached) {
        const parsed = JSON.parse(leaveCached);
        if (Array.isArray(parsed)) {
          const pending = parsed.filter((r: any) => r.status === 'PENDING' && !['Trần Thị Anh', 'Phạm Minh Đức', 'Nguyễn Văn Minh Anh'].includes(r.student_name));
          pending.forEach((req: any) => {
            const notifId = `leave-req-${req.id}`;
            list.push({
              id: notifId,
              type: 'leave_request',
              title: `Đơn xin nghỉ học: ${req.student_name} (Chờ duyệt)`,
              desc: `Lý do nghỉ: ${req.reason || 'Sốt / việc gia đình'} (${req.session_scope || 'cả ngày'})`,
              time: req.submitted_at || 'Vừa xong',
              targetUrl: `/app/classes/${classId}/leave-requests`,
              icon: 'fa-solid fa-file-signature text-[#22C997]',
              iconBg: 'bg-[#E6F9F3]',
              isRead: readNotifIds.includes(notifId),
            });
          });
        }
      }
    } catch (e) {}

    // Fallback sample pending request if list is empty for demo/testing
    if (list.filter(n => n.type === 'leave_request').length === 0) {
      list.push({
        id: `leave-req-sample-01`,
        type: 'leave_request',
        title: `Đơn xin nghỉ học: Lê Hồ Thanh (Chờ duyệt)`,
        desc: `Lý do nghỉ: Bệnh (cả ngày) • Người nộp: PH phhs-levanlong`,
        time: '18 phút trước',
        targetUrl: `/app/classes/${classId}/leave-requests`,
        icon: 'fa-solid fa-file-signature text-[#22C997]',
        iconBg: 'bg-[#E6F9F3]',
        isRead: readNotifIds.includes('leave-req-sample-01'),
      });
    }

    // 2. Check Attendance Absences
    try {
      const attCached = localStorage.getItem(`thcs_today_attendance_${classId}`);
      if (attCached) {
        const parsed = JSON.parse(attCached);
        if (Array.isArray(parsed)) {
          const unexcused = parsed.filter((a: any) => a.status === 'UNEXCUSED_ABSENCE' || a.status === 'TRUANCY');
          if (unexcused.length > 0) {
            list.push({
              id: `att-warning-${classId}`,
              type: 'attendance',
              title: `Cảnh báo vắng mặt chưa xin phép`,
              desc: `Lớp ${className} có ${unexcused.length} học sinh vắng chưa có đơn nghỉ hôm nay`,
              time: 'Hôm nay',
              targetUrl: `/app/classes/${classId}/attendance`,
              icon: 'fa-solid fa-triangle-exclamation text-[#FF5D68]',
              iconBg: 'bg-[#FFEFEF]',
              isRead: readNotifIds.includes(`att-warning-${classId}`),
            });
          }
        }
      }
    } catch (e) {}

    // 3. Check Role Activation Requests for SuperAdmin / Admin
    if (isSuperAdmin) {
      try {
        const usersCached = localStorage.getItem('thcs_admin_users');
        if (usersCached) {
          const parsed = JSON.parse(usersCached);
          if (Array.isArray(parsed)) {
            const pendingAct = parsed.filter((u: any) => u.role === 'standard_user' || u.activation_request?.status === 'pending');
            if (pendingAct.length > 0) {
              list.push({
                id: `role-act-${pendingAct.length}`,
                type: 'activation',
                title: `Yêu cầu kích hoạt vai trò tài khoản (${pendingAct.length})`,
                desc: `Có ${pendingAct.length} tài khoản mới (hs-, gvbm-, phhs-) đang chờ SuperAdmin phê duyệt`,
                time: 'Mới gửi',
                targetUrl: '/app/admin',
                icon: 'fa-solid fa-user-check text-[#6C63FF]',
                iconBg: 'bg-[#EEECFF]',
                isRead: readNotifIds.includes(`role-act-${pendingAct.length}`),
              });
            }
          }
        }
      } catch (e) {}
    }

    // 4. Incident & Conduct Reports
    try {
      const incCached = localStorage.getItem(`thcs_incidents_${classId}`);
      if (incCached) {
        const parsed = JSON.parse(incCached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list.push({
            id: `incident-notif-${classId}`,
            type: 'incident',
            title: `Báo cáo kỷ luật / vi phạm mới`,
            desc: `Ghi nhận vi phạm nếp sống mới của học sinh Lớp ${className}`,
            time: '1 giờ trước',
            targetUrl: `/app/classes/${classId}/incidents`,
            icon: 'fa-solid fa-shield-cat text-[#B47800]',
            iconBg: 'bg-[#FFF9EB]',
            isRead: readNotifIds.includes(`incident-notif-${classId}`),
          });
        }
      }
    } catch (e) {}

    // 5. Default School System Announcements
    list.push({
      id: `announcement-sys-01`,
      type: 'announcement',
      title: `Nhắc nhở nộp Sổ điểm Học kỳ II`,
      desc: `Yêu cầu hoàn thành nhập điểm thành phần cho Lớp ${className} trước ngày 30/05`,
      time: '2 giờ trước',
      targetUrl: `/app/classes/${classId}/gradebook`,
      icon: 'fa-solid fa-bullhorn text-[#6C63FF]',
      iconBg: 'bg-[#EEECFF]',
      isRead: readNotifIds.includes(`announcement-sys-01`),
    });

    return list;
  }, [selectedClass, isSuperAdmin, readNotifIds, dbVersion]);

  const unreadCount = useMemo(() => {
    return generatedNotifications.filter(n => !n.isRead).length;
  }, [generatedNotifications]);

  const filteredNotifications = useMemo(() => {
    if (notificationFilter === 'unread') {
      return generatedNotifications.filter(n => !n.isRead);
    }
    return generatedNotifications;
  }, [generatedNotifications, notificationFilter]);

  const handleMarkAllAsRead = () => {
    const allIds = generatedNotifications.map(n => n.id);
    const updated = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(updated);
    try {
      localStorage.setItem('thcs_read_notification_ids', JSON.stringify(updated));
    } catch (e) {}
    showToast('🎉 Đã đánh dấu đọc tất cả thông báo!');
  };

  const handleNotificationClick = (item: any) => {
    if (!readNotifIds.includes(item.id)) {
      const updated = [...readNotifIds, item.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('thcs_read_notification_ids', JSON.stringify(updated));
      } catch (e) {}
    }
    setShowNotifications(false);
    navigate(item.targetUrl);
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
        <div className="hidden sm:flex items-center shrink-0">
          <RoleBadge role={currentRole} size="md" showIcon={true} />
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
            <div className="absolute right-0 mt-2 w-96 rounded-3xl bg-white border border-[#E1E6F0] p-4 shadow-2xl z-50 animate-in fade-in space-y-3">
              {/* Header Title & Actions */}
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-bell text-[#6C63FF] text-sm"></i>
                  <h4 className="text-xs font-extrabold text-[#18243A]">Thông Báo Hệ Thống</h4>
                  {unreadCount > 0 && (
                    <span className="bg-[#FF5D68] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <i className="fa-solid fa-check-double text-xs"></i> Đọc tất cả
                  </button>
                )}
              </div>

              {/* Subtabs Filter */}
              <div className="flex items-center gap-2 border-b border-[#F0F2FA] pb-2">
                <button
                  onClick={() => setNotificationFilter('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                    notificationFilter === 'all'
                      ? 'bg-[#EEECFF] text-[#6C63FF] border border-[#C0BBFD]'
                      : 'text-[#68758D] hover:bg-[#FAFBFF]'
                  }`}
                >
                  Tất cả ({generatedNotifications.length})
                </button>
                <button
                  onClick={() => setNotificationFilter('unread')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer ${
                    notificationFilter === 'unread'
                      ? 'bg-[#FFEFEF] text-[#FF5D68] border border-[#FFC0C3]'
                      : 'text-[#68758D] hover:bg-[#FAFBFF]'
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>

              {/* Notification List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group relative ${
                        !n.isRead
                          ? 'bg-[#FAFBFF] border-[#C0BBFD] shadow-2xs hover:bg-[#EEECFF]/60'
                          : 'bg-white border-[#E1E6F0] hover:bg-[#FAFBFF]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${n.iconBg}`}>
                        <i className={`${n.icon} text-sm`}></i>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-extrabold truncate group-hover:text-[#6C63FF] transition-colors ${!n.isRead ? 'text-[#18243A]' : 'text-[#475569]'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#68758D] font-mono shrink-0 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#68758D] font-medium leading-relaxed multiline-ellipsis">
                          {n.desc}
                        </p>
                      </div>

                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#6C63FF] shrink-0 mt-1.5 shadow-2xs" title="Chưa đọc"></span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs font-bold text-[#68758D] bg-[#FAFBFF] rounded-2xl border border-[#E1E6F0]">
                    <i className="fa-solid fa-bell-slash text-2xl text-[#C0BBFD] mb-2 block"></i>
                    Không có thông báo nào {notificationFilter === 'unread' ? 'chưa đọc' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Change Password / Logout Popover */}
        <div ref={userMenuRef} className="relative shrink-0">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 border-l border-[#E1E6F0] hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <UserAvatar
              name={displayName}
              avatarUrl={currentUser.avatar_url || currentUser.avatar}
              role={currentRole}
              size="sm"
              status="online"
              showRoleBadge={true}
            />
            <div className="hidden lg:flex flex-col text-left shrink-0">
              <span className="text-xs font-extrabold text-[#18243A] leading-tight whitespace-nowrap group-hover:text-[#6C63FF] transition-colors">{displayName}</span>
              <span className="text-[10px] text-[#68758D] font-bold leading-tight whitespace-nowrap">{currentUser.email || 'Hệ thống THCS'}</span>
            </div>
            <i className="fa-solid fa-chevron-down text-[#68758D] text-xs shrink-0 group-hover:text-[#6C63FF] transition-colors"></i>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E1E6F0] p-3.5 shadow-2xl z-50 animate-in fade-in space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#FAFBFF] to-[#F4F3FF] border border-[#E1E6F0] flex items-center gap-3">
                <UserAvatar
                  name={displayName}
                  avatarUrl={currentUser.avatar_url || currentUser.avatar}
                  role={currentRole}
                  size="md"
                  status="online"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-[#18243A] truncate">{displayName}</div>
                  <div className="text-[10px] text-[#68758D] font-medium truncate">{currentUser.email}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <RoleBadge role={currentRole} size="sm" showIcon={true} />
                    <span className={`text-[10px] font-bold ${existingPass ? 'text-[#0E8360]' : 'text-[#D32F2F]'}`}>
                      {existingPass ? '🔑 Đã có MK' : '⚠️ Chưa MK'}
                    </span>
                  </div>
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
