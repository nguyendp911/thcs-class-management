import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../lib/mockData';
import type { RoleType, User } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RoleBadge } from '../components/ui/RoleBadge';
import { LogIn, User as UserIcon, Lock, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { logActivity } from '../utils/logger';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsUser, updateUserPassword } = useAuth();
  const baseUrl = import.meta.env.BASE_URL || '/thcs';
  const logoUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}logo.png`;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Activation & Mandatory Password Change Modal State
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<RoleType>('student');
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);

  // Helper to auto-resolve role from username/email/registered account
  const resolveRoleForUsername = (uName: string): { role: RoleType; label: string; user?: User } => {
    const clean = uName.trim().toLowerCase();
    if (!clean) return { role: 'student', label: 'Tự động nhận diện khi nhập Username...' };

    let allUsers: User[] = [...mockUsers];
    try {
      const cached = localStorage.getItem('thcs_admin_users');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) allUsers = [...parsed, ...mockUsers];
      }
    } catch (e) {}

    const roleLabelMap: Record<RoleType, string> = {
      superadmin: 'SuperAdmin Cao cấp 👑',
      admin: 'Quản trị hệ thống (System Admin) 🛡️',
      homeroom_teacher: 'Giáo viên Chủ nhiệm 👨‍🏫',
      subject_teacher: 'Giáo viên Bộ môn 📚',
      parent: 'Phụ huynh Học sinh 👨‍👩‍👧',
      student: 'Học sinh 🎓',
      standard_user: 'Tài khoản thường',
    };

    // 1. Exact match by username, email, or public_id
    const found = allUsers.find(u =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.public_id && u.public_id.toLowerCase() === clean)
    );

    if (found && found.role && found.role !== 'standard_user') {
      return { role: found.role, label: roleLabelMap[found.role] || found.role, user: found };
    }

    // 2. Flexible keyword matching for admin / superadmin
    if (clean.includes('superadmin')) {
      const saUser = allUsers.find(u => u.role === 'superadmin') || mockUsers[0];
      return { role: 'superadmin', label: roleLabelMap['superadmin'], user: saUser };
    }
    if (clean.includes('admin')) {
      const adminUser = allUsers.find(u => u.role === 'admin') || mockUsers[1] || mockUsers[0];
      return { role: 'admin', label: roleLabelMap['admin'], user: adminUser };
    }

    // 3. Prefixes & keywords for student, teacher, parent
    if (clean.startsWith('hs-') || clean.includes('hocsinh') || clean.includes('student')) {
      return { role: 'student', label: 'Học sinh (Tự động theo hs-)', user: found };
    }
    if (clean.startsWith('gvbm-') || clean.includes('giaovien') || clean.includes('teacher')) {
      return { role: 'subject_teacher', label: 'Giáo viên Bộ môn (Tự động theo gvbm-)', user: found };
    }
    if (clean.startsWith('phhs-') || clean.includes('phuhuynh') || clean.includes('parent')) {
      return { role: 'parent', label: 'Phụ huynh (Tự động theo phhs-)', user: found };
    }
    if (clean.startsWith('gvcn-')) {
      return { role: 'homeroom_teacher', label: 'Giáo viên Chủ nhiệm (Tự động theo gvcn-)', user: found };
    }

    if (found && found.activation_request?.target_role) {
      const tRole = found.activation_request.target_role;
      return { role: tRole, label: `${roleLabelMap[tRole] || tRole} (Tài khoản mới)`, user: found };
    }

    return { role: 'student', label: 'Học sinh (Mặc định)', user: found };
  };

  const resolvedRoleInfo = resolveRoleForUsername(username);



  const triggerActivationFlow = (user: User) => {
    const usernameLower = user.username?.toLowerCase() || '';
    let role: RoleType = 'student';
    if (usernameLower.startsWith('phhs-') || user.activation_request?.target_role === 'parent') {
      role = 'parent';
    } else if (usernameLower.startsWith('gvbm-') || user.activation_request?.target_role === 'subject_teacher') {
      role = 'subject_teacher';
    } else {
      role = 'student';
    }

    setPendingUser(user);
    setTargetRole(role);
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setActivationError(null);
    setIsActivationModalOpen(true);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase();
    if (!clean) return;

    const resolved = resolveRoleForUsername(username);
    const userToLogin = resolved.user || {
      id: Date.now(),
      public_id: `USR-${Date.now().toString().slice(-4)}`,
      name: clean,
      email: `${clean}@school.edu.vn`,
      username: clean,
      role: resolved.role,
      status: 'active',
    };

    if (userToLogin.role === 'standard_user' || userToLogin.must_change_password || clean.startsWith('hs-') || clean.startsWith('gvbm-') || clean.startsWith('phhs-')) {
      triggerActivationFlow(userToLogin);
      return;
    }

    loginAsUser(userToLogin, resolved.role);
    logActivity(
      userToLogin.name || clean,
      resolved.role,
      'ĐĂNG NHẬP',
      `Đăng nhập hệ thống thành công với vai trò ${resolved.label}`,
      userToLogin.scopes?.[0]?.class_id
    );
    setToastMessage(`🎉 Đăng nhập thành công với vai trò ${resolved.label}`);
    setTimeout(() => {
      navigate('/app/dashboard');
    }, 600);
  };

  const handleActivationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    if (currentPassInput !== '123456') {
      setActivationError('Mật khẩu hiện tại chưa đúng. Mật khẩu mặc định là 123456.');
      return;
    }

    if (newPassInput.length < 6) {
      setActivationError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassInput === '123456') {
      setActivationError('Mật khẩu mới không được trùng với mật khẩu mặc định 123456.');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setActivationError('Xác nhận mật khẩu mới chưa trùng khớp.');
      return;
    }

    if (pendingUser) {
      updateUserPassword(pendingUser.id, newPassInput);

      const activatedUser: User = {
        ...pendingUser,
        role: targetRole,
        must_change_password: false,
        activation_request: {
          target_role: targetRole,
          status: 'approved',
          requested_at: new Date().toLocaleString(),
        },
      };

      loginAsUser(activatedUser, targetRole);
      setIsActivationModalOpen(false);
      setToastMessage(`🎉 Đã đổi mật khẩu & kích hoạt thành công Vai trò: ${targetRole === 'student' ? 'Học sinh' : targetRole === 'parent' ? 'Phụ huynh' : 'Giáo viên bộ môn'}!`);

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#EEECFF] via-[#FAFBFF] to-[#E6F9F3] flex flex-col justify-between py-10 sm:px-6 lg:px-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-[#E6F9F3] border border-[#A3F0D9] p-4 text-xs font-extrabold text-[#0E8360] flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Top Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center pt-4">
        <div className="relative inline-flex items-center justify-center p-3 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl mb-4 group hover:scale-105 transition-all duration-300">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#6C63FF]/20 to-[#22C997]/20 blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
          <img src={logoUrl} alt="Logo THCS" className="relative h-20 w-20 object-contain drop-shadow-md" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#18243A] tracking-tight">CỔNG ĐĂNG NHẬP THCS</h2>
        <p className="mt-1 text-xs font-extrabold text-[#6C63FF] uppercase tracking-wider flex items-center justify-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#6C63FF] animate-pulse" />
          Hệ thống Quản lý Lớp học & Đào tạo Số
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="clay-card p-8 space-y-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl">
          {/* Form Login */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tài khoản Username / Email:</label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#68758D]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="VD: superadmin, hs-duongphucnguyen, gvbm-lehoangnam..."
                  className="w-full rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF] py-2.5 pl-10 pr-3 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:bg-white focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                />
              </div>
              <p className="text-[10px] text-[#68758D] font-bold mt-1.5 flex items-center gap-1 flex-wrap">
                <span>Ví dụ:</span>
                <code className="font-mono bg-[#EEECFF] text-[#6C63FF] px-1.5 py-0.5 rounded-md text-[10px]">hs-tenhocsinh</code>
                <code className="font-mono bg-[#EEECFF] text-[#6C63FF] px-1.5 py-0.5 rounded-md text-[10px]">gvbm-tengiaovien</code>
                <code className="font-mono bg-[#EEECFF] text-[#6C63FF] px-1.5 py-0.5 rounded-md text-[10px]">phhs-tenphuhuynh</code>
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mật khẩu:</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#68758D]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF] py-2.5 pl-10 pr-3 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:bg-white focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Vai trò hệ thống (Tự động nhận diện):</label>
              <div className="mt-1.5 w-full rounded-2xl border border-[#E1E6F0] bg-[#FAFBFF] p-3 text-xs font-extrabold flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <RoleBadge role={resolvedRoleInfo.role} size="md" showIcon={true} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#EEECFF] text-[#6C63FF] px-2 py-0.5 rounded-lg border border-[#C0BBFD] shrink-0 ml-2 shadow-2xs">
                  Tự động gán
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-xs font-extrabold rounded-2xl shadow-lg shadow-[#6C63FF]/25 hover:shadow-xl hover:shadow-[#6C63FF]/35 transition-all duration-200 mt-2"
              icon={<LogIn className="h-4 w-4" />}
            >
              Đăng Nhập Hệ Thống
            </Button>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-8 pb-2">
        <p className="text-[11px] font-extrabold text-[#68758D]">
          © 2026 Trường THCS • Hệ thống Chuyển đổi số & Quản lý Giáo dục
        </p>
      </div>

      {/* Mandatory Password Change & Role Activation Modal */}
      <Modal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        title="KÍCH HOẠT TÀI KHOẢN MỚI & ĐỔI MẬT KHẨU BẮT BUỘC"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsActivationModalOpen(false)}>Hủy bỏ</Button>
            <Button onClick={handleActivationSubmit} variant="primary" icon={<UserCheck className="h-4 w-4" />}>
              Đổi Mật Khẩu & Kích Hoạt Quyền
            </Button>
          </>
        }
      >
        <form onSubmit={handleActivationSubmit} className="space-y-4 py-1">
          <div className="rounded-xl border border-[#FFE399] bg-[#FFF9EB] p-3 text-xs text-[#B47800] space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-[#B47800] flex-shrink-0" />
              Quy định bảo mật đăng nhập lần đầu
            </div>
            <p className="text-[11px] leading-relaxed">
              Tài khoản mới <code className="font-mono font-extrabold text-[#18243A]">{pendingUser?.username || pendingUser?.name}</code> đang ở vai trò <strong>Tài khoản thường</strong>. Bạn phải thay đổi mật khẩu mặc định (123456) và xác nhận gửi yêu cầu kích hoạt vai trò <strong>{targetRole === 'student' ? 'Học sinh (hs-)' : targetRole === 'parent' ? 'Phụ huynh (phhs-)' : 'Giáo viên bộ môn (gvbm-)'}</strong>.
            </p>
          </div>

          {activationError && (
            <div className="rounded-xl border border-[#FFC0C3] bg-[#FFEFEF] p-3 text-xs font-bold text-[#D32F2F] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#D32F2F] flex-shrink-0" />
              {activationError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tài khoản kích hoạt:</label>
              <input
                type="text"
                disabled
                value={`${pendingUser?.username || pendingUser?.name} (${pendingUser?.name})`}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] bg-[#F4F5F8] p-2 text-xs font-mono font-bold text-[#18243A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Vai trò yêu cầu kích hoạt:</label>
              <div className="mt-1 px-3 py-2 rounded-xl bg-[#EEECFF] border border-[#C0BBFD] text-xs font-extrabold text-[#6C63FF] flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#6C63FF]" />
                {targetRole === 'student' ? 'Học Sinh (hs-)' : targetRole === 'parent' ? 'Phụ Huynh (phhs-)' : 'Giáo Viên Bộ Môn (gvbm-)'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mật khẩu hiện tại (Mặc định):</label>
              <input
                type="password"
                required
                value={currentPassInput}
                onChange={(e) => setCurrentPassInput(e.target.value)}
                placeholder="Nhập 123456..."
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mật khẩu mới (Tối thiểu 6 ký tự):</label>
              <input
                type="password"
                required
                value={newPassInput}
                onChange={(e) => setNewPassInput(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                required
                value={confirmPassInput}
                onChange={(e) => setConfirmPassInput(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
