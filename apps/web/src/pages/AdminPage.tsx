import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockRolePermissions } from '../lib/mockData';
import type { ClassItem, User, RolePermissionMatrix } from '../types';
import { generateUsername } from '../utils/accountUtils';
import { saveToDb } from '../lib/dbSync';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Plus, CheckCircle, Lock, Users, School, Key, Crown, Database, Download, Trash2, AlertTriangle, ShieldCheck, Edit, Check, UserCheck, BookOpen
} from 'lucide-react';

export interface SubjectTeacherItem {
  id: number;
  subject_code: string;
  subject_name: string;
  teacher_name: string;
  phone: string;
  email: string;
  class_assigned: string;
}

const DEFAULT_SUBJECT_TEACHERS: SubjectTeacherItem[] = [
  { id: 1, subject_code: 'TOAN', subject_name: 'Toán học', teacher_name: 'ThS. Trần Đức Minh', phone: '0912.345.678', email: 'ducminh.toan@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 2, subject_code: 'VVAN', subject_name: 'Ngữ văn', teacher_name: 'Cô Nguyễn Thị Phương', phone: '0983.456.789', email: 'phuong.nguvan@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 3, subject_code: 'TANG', subject_name: 'Tiếng Anh', teacher_name: 'ThS. Lê Hoàng Yến', phone: '0904.567.890', email: 'hoangyen.tienganh@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 4, subject_code: 'VLY', subject_name: 'Vật lý', teacher_name: 'Thầy Phạm Quốc Huy', phone: '0935.678.901', email: 'huypq.vatly@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 5, subject_code: 'HHOA', subject_name: 'Hóa học', teacher_name: 'Cô Vũ Thị Thu Hương', phone: '0976.789.012', email: 'huong.hoahoc@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 6, subject_code: 'SHOC', subject_name: 'Sinh học', teacher_name: 'Cô Hoàng Thị Mai', phone: '0917.890.123', email: 'mai.sinhhoc@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 7, subject_code: 'LS_DL', subject_name: 'Lịch sử & Địa lý', teacher_name: 'Thầy Ngô Văn Hải', phone: '0988.901.234', email: 'hai.lichsu@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 8, subject_code: 'THOC', subject_name: 'Tin học', teacher_name: 'Thầy Đỗ Anh Tuấn', phone: '0909.012.345', email: 'tuan.tinhoc@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 9, subject_code: 'GDCD', subject_name: 'Giáo dục công dân', teacher_name: 'Cô Bùi Thị Dung', phone: '0931.123.456', email: 'dung.gdcd@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 10, subject_code: 'CNGHE', subject_name: 'Công nghệ', teacher_name: 'Thầy Nguyễn Văn Nam', phone: '0962.234.567', email: 'nam.congnghe@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 11, subject_code: 'TDUC', subject_name: 'Thể dục', teacher_name: 'Thầy Dương Văn Hùng', phone: '0972.234.567', email: 'hung.theduc@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 12, subject_code: 'ANAC', subject_name: 'Âm nhạc', teacher_name: 'Cô Đặng Kim Anh', phone: '0913.345.678', email: 'kimanh.amnhac@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
  { id: 13, subject_code: 'MTHUAT', subject_name: 'Mỹ thuật', teacher_name: 'Thầy Phan Thanh Nam', phone: '0984.456.789', email: 'nam.mythuat@school.edu.vn', class_assigned: 'Khối 8 (Tất cả)' },
];

interface PermissionMeta {
  code: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

const AVAILABLE_PERMISSIONS: PermissionMeta[] = [
  { code: 'view_students', name: 'Xem hồ sơ học sinh', category: 'Học sinh', description: 'Cho phép truy cập và xem chi tiết lý lịch học sinh trong lớp', icon: '👨‍🎓' },
  { code: 'manage_grades', name: 'Nhập & sửa sổ điểm môn học', category: 'Học tập', description: 'Toàn quyền cập nhật điểm 15p, 1 tiết, giữa kỳ và cuối kỳ', icon: '📝' },
  { code: 'attendance', name: 'Điểm danh chuyên cần hàng ngày', category: 'Chuyên cần', description: 'Thực hiện điểm danh diện diện, vắng có phép/không phép', icon: '📋' },
  { code: 'leave_request', name: 'Nộp & duyệt đơn xin nghỉ học', category: 'Đơn từ', description: 'Tạo đơn mới hoặc xét duyệt đơn xin nghỉ học của học sinh', icon: '✉️' },
  { code: 'submit_assignment', name: 'Nộp bài tập về nhà', category: 'Bài tập', description: 'Đính kèm tệp và gửi bài làm trực tuyến cho giáo viên', icon: '📚' },
  { code: 'view_children', name: 'Xem hồ sơ con em (Phụ huynh)', category: 'Gia đình', description: 'Theo dõi điểm số, nề nếp và nhận thông báo dành cho Phụ huynh', icon: '👨‍👩‍👧' },
  { code: 'view_self', name: 'Xem hồ sơ cá nhân (Học sinh)', category: 'Cá nhân', description: 'Tra cứu kết quả học tập và rèn luyện của bản thân học sinh', icon: '👤' },
  { code: 'manage_announcements', name: 'Đăng & quản lý thông báo lớp', category: 'Thông báo', description: 'Tạo bài đăng, cập nhật tin tức và đính kèm tài liệu lên Bảng tin', icon: '📢' },
  { code: 'all', name: 'Toàn quyền Hệ thống SuperAdmin', category: 'Hệ thống', description: 'Truy cập không giới hạn tới mọi module và cấu hình cơ sở dữ liệu', icon: '👑' },
];

export const AdminPage: React.FC = () => {
  const { currentRole, updateUserPassword, setSelectedClass, updateClass, addClass, deleteClass, classesList } = useAuth();
  const [activeTab, setActiveTab] = useState<'classes' | 'subject_teachers' | 'rbac' | 'users' | 'activations' | 'database'>('classes');

  // Subject Teachers State
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherItem[]>(() => {
    try {
      const saved = localStorage.getItem('thcs_subject_teachers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SUBJECT_TEACHERS;
  });

  const [editingSubjectTeacher, setEditingSubjectTeacher] = useState<SubjectTeacherItem | null>(null);
  const [editSubjectTeacherName, setEditSubjectTeacherName] = useState('');
  const [editSubjectTeacherPhone, setEditSubjectTeacherPhone] = useState('');
  const [editSubjectTeacherEmail, setEditSubjectTeacherEmail] = useState('');
  const [editSubjectTeacherClass, setEditSubjectTeacherClass] = useState('');

  const saveSubjectTeachersState = (newList: SubjectTeacherItem[]) => {
    setSubjectTeachers(newList);
    saveToDb('thcs_subject_teachers', newList);
  };

  const [userList, setUserList] = useState<User[]>([]);

  const saveUsersListState = (newUsers: User[]) => {
    const map = new Map();
    newUsers.forEach((u: User) => {
      if (u && (u.username || u.id)) map.set(u.username || u.id, u);
    });
    const cleanList = Array.from(map.values());
    setUserList(cleanList);
    saveToDb('thcs_admin_users', cleanList);
  };

  const [roleMatrix, setRoleMatrix] = useState<RolePermissionMatrix[]>(mockRolePermissions);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDemoPurged, setIsDemoPurged] = useState<boolean>(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // Modals state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade] = useState('Khối 8');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // Modal Edit Class State
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [editClassNameInput, setEditClassNameInput] = useState('');
  const [editClassGradeInput, setEditClassGradeInput] = useState('Khối 7');
  const [editClassRoomInput, setEditClassRoomInput] = useState('');
  const [editClassTeacherInput, setEditClassTeacherInput] = useState('');
  const [editClassCapacityInput, setEditClassCapacityInput] = useState('45');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<any>('homeroom_teacher');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Edit User Account Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserNameInput, setEditUserNameInput] = useState('');
  const [editUserEmailInput, setEditUserEmailInput] = useState('');
  const [editUserPhoneInput, setEditUserPhoneInput] = useState('');
  const [editUserRoleInput, setEditUserRoleInput] = useState<any>('standard_user');
  const [editUserStatusInput, setEditUserStatusInput] = useState<'active' | 'inactive'>('active');

  // Edit RBAC Permissions Modal
  const [editingRole, setEditingRole] = useState<RolePermissionMatrix | null>(null);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);

  // Reset Password for specific user modal
  const [selectedUserForPass, setSelectedUserForPass] = useState<User | null>(null);
  const [adminSetPasswordInput, setAdminSetPasswordInput] = useState('');

  // Fetch latest users from MySQL users API on mount
  useEffect(() => {
    fetch('/thcs/api/users')
      .then(res => res.json())
      .then(data => {
        if (data && data.users && Array.isArray(data.users) && data.users.length > 0) {
          const map = new Map();
          data.users.forEach((u: User) => {
            if (u && (u.username || u.id)) map.set(u.username || u.id, u);
          });
          const cleanList = Array.from(map.values());
          setUserList(cleanList);
        }
      })
      .catch(() => {});

    fetch('/thcs/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings && Array.isArray(data.settings)) {
          const match = data.settings.find((s: any) => s.setting_key === 'demo_purged');
          if (match && match.setting_value === 'true') {
            setIsDemoPurged(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEditSubjectTeacher = (st: SubjectTeacherItem) => {
    setEditingSubjectTeacher(st);
    setEditSubjectTeacherName(st.teacher_name);
    setEditSubjectTeacherPhone(st.phone);
    setEditSubjectTeacherEmail(st.email);
    setEditSubjectTeacherClass(st.class_assigned);
  };

  const handleSaveSubjectTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjectTeacher || !editSubjectTeacherName.trim()) return;

    const updated = subjectTeachers.map(st => {
      if (st.id === editingSubjectTeacher.id) {
        return {
          ...st,
          teacher_name: editSubjectTeacherName.trim(),
          phone: editSubjectTeacherPhone.trim(),
          email: editSubjectTeacherEmail.trim(),
          class_assigned: editSubjectTeacherClass.trim() || 'Khối 8 (Tất cả)',
        };
      }
      return st;
    });

    saveSubjectTeachersState(updated);
    setEditingSubjectTeacher(null);
    showToast(`🎉 Cập nhật thông tin Giáo viên Bộ môn môn ${editingSubjectTeacher.subject_name} thành công!`);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClassItem: ClassItem = {
      id: Date.now(),
      code: newClassCode.trim().toUpperCase() || 'L01',
      name: newClassName.trim(),
      grade_level: newClassGrade,
      room: newClassRoom.trim() || 'Phòng 101',
      capacity: 45,
      student_count: 0,
      homeroom_teacher_id: 1,
      homeroom_teacher_name: newClassTeacher.trim() || 'Nguyễn Văn Quản Trị',
    };

    addClass(newClassItem);
    setIsAddClassModalOpen(false);
    showToast(`🎉 Thêm lớp ${newClassName} thành công!`);

    setNewClassName('');
    setNewClassCode('');
    setNewClassRoom('');
    setNewClassTeacher('');
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setEditClassNameInput(cls.name);
    setEditClassGradeInput(cls.grade_level);
    setEditClassRoomInput(cls.room);
    setEditClassTeacherInput(cls.homeroom_teacher_name);
    setEditClassCapacityInput(cls.capacity.toString());
  };

  const handleSaveEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !editClassNameInput.trim()) return;

    const updatedItem: ClassItem = {
      ...editingClass,
      name: editClassNameInput.trim(),
      grade_level: editClassGradeInput,
      room: editClassRoomInput.trim(),
      homeroom_teacher_name: editClassTeacherInput.trim(),
      capacity: Number(editClassCapacityInput),
    };

    updateClass(updatedItem);
    setSelectedClass(updatedItem);

    // Sync to MySQL API directly
    fetch('/thcs/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    }).catch(() => {});

    setEditingClass(null);
    showToast(`🎉 Cập nhật cấu hình ${editClassNameInput} thành công!`);
  };

  const handleDeleteClass = (id: number | string) => {
    const target = classesList.find(c => String(c.id) === String(id));
    if (!target) return;
    if (confirm(`Bạn có chắc chắn muốn xóa lớp ${target.name}?`)) {
      deleteClass(id);
      setEditingClass(null);
      showToast(`Đã xóa ${target.name} khỏi hệ thống!`);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const prefix = 
      newUserRole === 'homeroom_teacher' ? 'GVCN' :
      newUserRole === 'subject_teacher' ? 'GVBM' :
      newUserRole === 'student' ? 'HS' :
      newUserRole === 'admin' ? 'ADMIN' :
      newUserRole === 'superadmin' ? 'SUPERADMIN' :
      'PHHS';
    const generatedUsername = generateUsername(newUserName, prefix);
    const passToUse = newUserPassword.trim() || '123456';

    // Prevent duplicated username creation
    if (userList.some(u => u.username?.toLowerCase() === generatedUsername.toLowerCase())) {
      showToast(`⚠️ Tài khoản ${generatedUsername} đã tồn tại trong hệ thống!`);
      return;
    }

    const newUser: User = {
      id: Date.now(),
      public_id: `USR-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim() || `${generatedUsername.toLowerCase()}@school.edu.vn`,
      username: generatedUsername,
      role: newUserRole,
      phone: newUserPhone.trim() || '0901234567',
      status: 'active',
      must_change_password: false,
      activation_request: {
        target_role: newUserRole,
        status: 'approved' as const,
        requested_at: new Date().toLocaleString(),
      },
    };

    updateUserPassword(newUser.id, passToUse);
    saveUsersListState([newUser, ...userList]);

    // Direct MySQL Sync API
    fetch('/thcs/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newUser,
        password: passToUse,
      }),
    }).catch(() => {});
    setIsAddUserModalOpen(false);
    showToast(`🎉 Đã tạo thành công Tài khoản: ${generatedUsername} (Mật khẩu: ${passToUse})!`);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserPassword('');
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserNameInput(user.name);
    setEditUserEmailInput(user.email || '');
    setEditUserPhoneInput(user.phone || '');
    setEditUserRoleInput(user.role);
    setEditUserStatusInput(user.status || 'active');
  };

  const handleSaveEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserNameInput.trim()) return;

    const updated = userList.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editUserNameInput.trim(),
          email: editUserEmailInput.trim(),
          phone: editUserPhoneInput.trim(),
          role: editUserRoleInput,
          status: editUserStatusInput,
        };
      }
      return u;
    });

    saveUsersListState(updated);
    setEditingUser(null);
    showToast(`🎉 Cập nhật thông tin tài khoản ${editingUser.username || editingUser.name} thành công!`);
  };

  const handleDeleteUser = (userId: number) => {
    const target = userList.find(u => u.id === userId);
    if (!target) return;
    if (target.role === 'superadmin') {
      showToast('⚠️ Không thể xóa tài khoản SuperAdmin hệ thống!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${target.name} (${target.username}) khỏi hệ thống?`)) {
      const updated = userList.filter(u => u.id !== userId);
      saveUsersListState(updated);
      showToast(`Đã xóa tài khoản ${target.username || target.name} thành công!`);
    }
  };

  const handleApproveActivation = (userId: number) => {
    const updatedUsers = userList.map(u => {
      if (u.id === userId) {
        const targetRole = u.activation_request?.target_role || (u.username?.startsWith('HS-') ? 'student' : 'subject_teacher');
        return {
          ...u,
          role: targetRole,
          must_change_password: false,
          activation_request: {
            target_role: targetRole,
            status: 'approved' as const,
            requested_at: u.activation_request?.requested_at || new Date().toLocaleString(),
          },
        };
      }
      return u;
    });

    saveUsersListState(updatedUsers);
    const targetUser = userList.find(u => u.id === userId);
    showToast(`🎉 Đã phê duyệt kích hoạt thành công tài khoản ${targetUser?.username || targetUser?.name}!`);
  };

  const handleOpenEditPermissions = (roleMatrixItem: RolePermissionMatrix) => {
    setEditingRole(roleMatrixItem);
    setSelectedPermissionCodes(roleMatrixItem.permissions.includes('all') ? AVAILABLE_PERMISSIONS.map(p => p.code) : [...roleMatrixItem.permissions]);
  };

  const handleTogglePermission = (code: string) => {
    if (selectedPermissionCodes.includes(code)) {
      setSelectedPermissionCodes(selectedPermissionCodes.filter(c => c !== code));
    } else {
      setSelectedPermissionCodes([...selectedPermissionCodes, code]);
    }
  };

  const handleSavePermissions = () => {
    if (!editingRole) return;

    const isAll = selectedPermissionCodes.length === AVAILABLE_PERMISSIONS.length;
    const finalPerms = isAll ? ['all'] : selectedPermissionCodes;

    const updatedMatrix = roleMatrix.map(r => {
      if (r.role === editingRole.role) {
        return { ...r, permissions: finalPerms };
      }
      return r;
    });

    setRoleMatrix(updatedMatrix);
    saveToDb('thcs_role_permissions', updatedMatrix);
    showToast(`🎉 Cập nhật ma trận phân quyền cho vai trò ${editingRole.role_name} thành công!`);
    setEditingRole(null);
  };

  const handleAdminSetUserPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPass || !adminSetPasswordInput.trim()) return;

    updateUserPassword(selectedUserForPass.id, adminSetPasswordInput.trim());
    showToast(`🎉 Đã đổi mật khẩu trực tiếp cho tài khoản ${selectedUserForPass.name} thành công!`);
    setSelectedUserForPass(null);
    setAdminSetPasswordInput('');
  };

  const handlePurgeDemoDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purgeConfirmText.trim() !== 'CONFIRM_PURGE_DEMO') {
      alert('Vui lòng nhập chính xác từ khóa "CONFIRM_PURGE_DEMO" để xác nhận xóa.');
      return;
    }

    try {
      await fetch('/thcs/api/purge-demo', { method: 'POST' });
    } catch (err) {}

    // Clear Demo Users & Keep Senior Admins
    const seniorAdminsOnly = userList.filter(u => u.role === 'superadmin' || u.role === 'admin');
    setUserList(seniorAdminsOnly);

    setIsDemoPurged(true);
    setIsPurgeModalOpen(false);
    showToast('🎉 Đã khởi tạo vận hành sản xuất sạch 100%! Toàn bộ dữ liệu demo đã được dọn dẹp trực tiếp trên MySQL.');
  };

  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-[#E6F9F3] border border-[#A3F0D9] p-4 text-xs font-extrabold text-[#0E8360] flex items-center gap-2 shadow-xl animate-in fade-in">
          <CheckCircle className="h-5 w-5 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Production Clean Status Alert Banner */}
      {isDemoPurged && (
        <div className="rounded-2xl border border-[#A3F0D9] bg-[#E6F9F3] p-4 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="h-5 w-5 text-[#0E8360]" />
            <span className="text-xs font-extrabold text-[#0E8360]">
              Trạng thái hệ thống: ĐÃ KHỞI TẠO VẬN HÀNH SẢN XUẤT SẠCH 100% (Production Clean State). Dữ liệu demo đã được xóa hoàn tất.
            </span>
          </div>
          <Badge variant="mint">Đã nghiệm thu</Badge>
        </div>
      )}

      {/* Page Title & Senior Controls */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18243A] tracking-tight flex items-center gap-2.5">
            <Crown className="h-7 w-7 text-[#F6B73C]" />
            Quản Trị Hệ Thống & Ma Trận Phân Quyền
          </h1>
          <p className="text-sm text-[#68758D] font-bold mt-1">
            Quản lý toàn bộ danh sách lớp học, phân quyền tài khoản, ma trận phân quyền RBAC cao cấp và sao lưu dữ liệu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddClassModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Thêm Lớp Học Mới
          </Button>
          <Button
            size="sm"
            variant="mint"
            onClick={() => setIsAddUserModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Tạo Tài Khoản Mới
          </Button>
          {!isDemoPurged && currentRole === 'superadmin' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsPurgeModalOpen(true)}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Dọn Dẹp Sạch Dữ Liệu Demo
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Card Grid on Responsive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'classes'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <School className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === 'classes' ? 'bg-white/20 text-white' : 'bg-[#F0F2FA] text-[#68758D]'
            }`}>
              {classesList.length} lớp
            </span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">Quản Lý Lớp Học</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'classes' ? 'text-white/80' : 'text-[#68758D]'}`}>
              Sơ đồ & Cấu hình lớp
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subject_teachers')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'subject_teachers'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'subject_teachers' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === 'subject_teachers' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'
            }`}>
              {subjectTeachers.length} môn
            </span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">Giáo Viên Bộ Môn</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'subject_teachers' ? 'text-white/80' : 'text-[#68758D]'}`}>
              Phân công & Liên hệ
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'users'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#F0F2FA] text-[#68758D]'
            }`}>
              {userList.length} TK
            </span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">Tài Khoản & User</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'users' ? 'text-white/80' : 'text-[#68758D]'}`}>
              Phân quyền thành viên
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activations')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'activations'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'activations' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            {userList.filter(u => u.role === 'standard_user' || u.activation_request?.status === 'pending').length > 0 ? (
              <span className="bg-[#FF5D68] text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-black animate-pulse">
                {userList.filter(u => u.role === 'standard_user' || u.activation_request?.status === 'pending').length} chờ
              </span>
            ) : (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === 'activations' ? 'bg-white/20 text-white' : 'bg-[#E6F9F3] text-[#0E8360]'}`}>
                Sạch
              </span>
            )}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">Duyệt Kích Hoạt</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'activations' ? 'text-white/80' : 'text-[#68758D]'}`}>
              HS, GVBM, PHHS
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'rbac'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'rbac' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === 'rbac' ? 'bg-white/20 text-white' : 'bg-[#FEF6E6] text-[#D97706]'
            }`}>
              RBAC
            </span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">Ma Trận RBAC</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'rbac' ? 'text-white/80' : 'text-[#68758D]'}`}>
              Phân quyền chi tiết
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'database'
              ? 'bg-gradient-to-br from-[#6C63FF] to-[#5A52E0] border-[#6C63FF] text-white shadow-lg shadow-[#6C63FF]/25 ring-2 ring-[#6C63FF]/30'
              : 'bg-white border-[#E1E6F0] text-[#18243A] hover:border-[#6C63FF]/50 hover:bg-[#FAFBFF]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl ${activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-[#EEECFF] text-[#6C63FF]'}`}>
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-[#E6F9F3] text-[#0E8360]'
            }`}>
              MySQL
            </span>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black leading-tight">CSDL & Sao Lưu</div>
            <div className={`text-[10px] mt-0.5 font-bold ${activeTab === 'database' ? 'text-white/80' : 'text-[#68758D]'}`}>
              MySQL Server Host
            </div>
          </div>
        </button>
      </div>

      {/* Tab 1: Class Management */}
      {activeTab === 'classes' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#18243A]">Danh Sách Các Lớp Học Trong Trường</h2>
            <Badge variant="purple">Tổng số: {classesList.length} lớp</Badge>
          </div>

          {classesList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E1E6F0] p-8 text-center bg-[#FAFBFF] space-y-2">
              <School className="h-10 w-10 text-[#68758D] mx-auto opacity-50" />
              <p className="text-sm font-extrabold text-[#18243A]">Chưa có lớp học nào trong hệ thống</p>
              <p className="text-xs text-[#68758D]">Nhấn nút "Thêm Lớp Học Mới" ở phía trên để khởi tạo lớp học mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesList.map(cls => (
                <div key={cls.id} className="rounded-2xl border border-[#E1E6F0] p-4 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#18243A]">{cls.name}</h3>
                    <Badge variant="mint">{cls.grade_level}</Badge>
                  </div>

                  <div className="text-xs text-[#68758D] font-bold space-y-1">
                    <div>Phòng học: <span className="text-[#18243A] font-extrabold">{cls.room}</span></div>
                    <div>GVCN: <span className="text-[#0E8360] font-extrabold">{cls.homeroom_teacher_name}</span></div>
                  </div>

                  <div className="pt-2 border-t border-[#E1E6F0] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#68758D]">Sĩ số: {cls.student_count}/{cls.capacity} em</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="text-xs font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" /> Sửa cấu hình
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="text-xs font-extrabold text-[#FF5D68] hover:underline cursor-pointer"
                        title="Xóa lớp học"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subject Teachers Management */}
      {activeTab === 'subject_teachers' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#6C63FF]" />
                Danh Sách & Phân Công Giáo Viên Bộ Môn (GVBM)
              </h2>
              <p className="text-xs text-[#68758D] font-bold mt-1">
                Quản lý thông tin liên hệ và phân công giảng dạy của Giáo viên Bộ môn theo từng môn học trong trường
              </p>
            </div>
            <Badge variant="purple">Tổng số: {subjectTeachers.length} môn học</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#18243A]">
              <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                <tr>
                  <th className="p-3">Mã Môn</th>
                  <th className="p-3">Môn Học</th>
                  <th className="p-3">Giáo Viên Bộ Môn Phụ Trách</th>
                  <th className="p-3">Số Điện Thoại Liên Hệ</th>
                  <th className="p-3">Email Liên Hệ</th>
                  <th className="p-3">Lớp/Khối Phụ Trách</th>
                  <th className="p-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {subjectTeachers.map(st => (
                  <tr key={st.id} className="hover:bg-[#FAFBFF]">
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#6C63FF] bg-[#EEECFF] px-2 py-0.5 rounded-lg border border-[#C0BBFD]">
                        {st.subject_code}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-[#18243A]">{st.subject_name}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-[#0E8360] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22C997]"></span>
                        {st.teacher_name}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#18243A]">{st.phone}</td>
                    <td className="p-3 font-mono text-[#68758D]">{st.email}</td>
                    <td className="p-3">
                      <Badge variant="mint">{st.class_assigned}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenEditSubjectTeacher(st)}
                        className="px-3 py-1.5 rounded-xl bg-[#EEECFF] text-[#6C63FF] font-extrabold hover:bg-[#E2DFFF] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" /> Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: User Accounts */}
      {activeTab === 'users' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#18243A]">Quản Lý Tài Khoản Đăng Nhập</h2>
            <Badge variant="mint">Tổng số: {userList.length} tài khoản</Badge>
          </div>

          <div className="rounded-2xl border border-[#E1E6F0] overflow-hidden">
            <table className="w-full text-left text-xs font-bold text-[#18243A]">
              <thead className="bg-[#FAFBFF] border-b border-[#E1E6F0] text-[#68758D] text-[11px] uppercase">
                <tr>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Tài khoản (Username)</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {userList.map(u => (
                  <tr key={u.id} className="hover:bg-[#FAFBFF]">
                    <td className="p-3 font-extrabold">{u.name}</td>
                    <td className="p-3 font-mono text-[#6C63FF]">{u.username || u.email}</td>
                    <td className="p-3">
                      <Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'warning' : 'purple'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="mint">{u.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="text-xs font-extrabold text-[#6C63FF] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" /> Sửa
                        </button>
                        <button
                          onClick={() => { setSelectedUserForPass(u); setAdminSetPasswordInput(''); }}
                          className="text-xs font-extrabold text-[#0E8360] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Key className="h-3.5 w-3.5" /> Mật khẩu
                        </button>
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-xs font-extrabold text-[#FF5D68] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Activation Requests */}
      {activeTab === 'activations' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#18243A]">Duyệt Kích Hoạt Quyền Tài Khoản (HS-, GVBM-, PHHS-)</h2>
            <Badge variant="warning">Yêu cầu chờ duyệt</Badge>
          </div>

          <div className="rounded-2xl border border-[#E1E6F0] overflow-hidden">
            <table className="w-full text-left text-xs font-bold text-[#18243A]">
              <thead className="bg-[#FAFBFF] border-b border-[#E1E6F0] text-[#68758D] text-[11px] uppercase">
                <tr>
                  <th className="p-3">Tài Khoản</th>
                  <th className="p-3">Họ Tên Phụ Huynh/Học Sinh/GV</th>
                  <th className="p-3">Quyền Yêu Cầu</th>
                  <th className="p-3">Thời Gian Gửi</th>
                  <th className="p-3 text-right">Duyệt Kích Hoạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {userList.filter(u => u.role === 'standard_user' || u.activation_request?.status === 'pending').map(u => (
                  <tr key={u.id} className="hover:bg-[#FAFBFF]">
                    <td className="p-3 font-mono font-extrabold text-[#6C63FF]">{u.username || u.public_id}</td>
                    <td className="p-3 font-extrabold">{u.name}</td>
                    <td className="p-3">
                      <Badge variant="warning">
                        {u.activation_request?.target_role === 'student' ? 'Học Sinh (hs-)' : u.activation_request?.target_role === 'parent' ? 'Phụ Huynh (phhs-)' : 'GVBM (gvbm-)'}
                      </Badge>
                    </td>
                    <td className="p-3 text-[#68758D] font-mono text-[11px]">{u.activation_request?.requested_at || 'Mới đây'}</td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="mint"
                        onClick={() => handleApproveActivation(u.id)}
                        icon={<Check className="h-3.5 w-3.5" />}
                      >
                        Phê Duyệt Kích Hoạt
                      </Button>
                    </td>
                  </tr>
                ))}
                {userList.filter(u => u.role === 'standard_user' || u.activation_request?.status === 'pending').length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs font-extrabold text-[#0E8360] bg-[#E6F9F3]">
                      ✓ Hiện tại tất cả tài khoản hs-, gvbm-, phhs- đã được kích hoạt hoàn tất.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#18243A]">Ma Trận Phân Quyền Vai Trò (RBAC Matrix)</h2>
            <Badge variant="purple">RBAC Enterprise</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleMatrix.map(r => (
              <div key={r.role} className="rounded-2xl border border-[#E1E6F0] p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#18243A]">{r.role_name}</h3>
                  <button
                    onClick={() => handleOpenEditPermissions(r)}
                    className="text-xs font-extrabold text-[#6C63FF] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" /> Chỉnh sửa quyền
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.permissions.map(p => (
                    <span key={p} className="text-[10px] font-extrabold bg-[#EEECFF] text-[#6C63FF] px-2 py-0.5 rounded-md font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Database Backup & Host Management */}
      {activeTab === 'database' && (
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#18243A]">Cơ Sở Dữ Liệu MySQL Host (`kjioxydi_thcs`)</h2>
            <Badge variant="mint">Host vie.info.vn</Badge>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] space-y-3">
            <div className="text-xs font-extrabold text-[#18243A] flex items-center gap-2">
              <Database className="h-4 w-4 text-[#6C63FF]" />
              Máy chủ MySQL Database đang kết nối: <code className="font-mono text-[#6C63FF]">localhost / kjioxydi_thcs</code>
            </div>
            <p className="text-xs text-[#68758D] font-medium leading-relaxed">
              Dữ liệu Chuyên cần, Học sinh, Hồ sơ và Cấu hình lớp học được lưu trữ trực tiếp và bền vững trên cơ sở dữ liệu MySQL máy chủ cPanel Host.
            </p>
            <div className="pt-2">
              <a
                href="/thcs/api/attendance"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-extrabold shadow-xs hover:bg-[#5148E5]"
              >
                <Download className="h-4 w-4" /> Kiểm tra API MySQL trực tuyến
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Class */}
      <Modal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        title={`Chỉnh Sửa Cấu Hình: ${editingClass?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingClass(null)}>Hủy</Button>
            <Button onClick={handleSaveEditClassSubmit} variant="primary" icon={<Check className="h-4 w-4" />}>
              Lưu Cấu Hình
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEditClassSubmit} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên Lớp Học:</label>
            <input
              type="text"
              required
              value={editClassNameInput}
              onChange={(e) => setEditClassNameInput(e.target.value)}
              placeholder="VD: Lớp 8A3"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Phòng Học:</label>
            <input
              type="text"
              required
              value={editClassRoomInput}
              onChange={(e) => setEditClassRoomInput(e.target.value)}
              placeholder="VD: Phòng 001"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Giáo Viên Chủ Nhiệm (Chọn hoặc Nhập trực tiếp):</label>
            <select
              value={userList.some(u => u.name === editClassTeacherInput) ? editClassTeacherInput : (editClassTeacherInput ? 'custom' : '')}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setEditClassTeacherInput(e.target.value);
                }
              }}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-extrabold bg-white text-[#18243A]"
            >
              <option value="">-- Chọn từ tài khoản đã có --</option>
              {userList.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.username}) - {u.role === 'superadmin' ? 'SuperAdmin' : u.role === 'homeroom_teacher' ? 'GVCN' : u.role === 'subject_teacher' ? 'GVBM' : u.role}
                </option>
              ))}
              <option value="custom">✍️ Tự nhập tên Giáo viên Chủ nhiệm...</option>
            </select>

            <input
              type="text"
              required
              value={editClassTeacherInput}
              onChange={(e) => setEditClassTeacherInput(e.target.value)}
              placeholder="Nhập họ tên Giáo viên Chủ nhiệm..."
              className="mt-2 w-full rounded-xl border border-[#6C63FF] p-2 text-xs font-extrabold bg-[#FAFBFF] text-[#18243A]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Khối Học:</label>
            <select
              value={editClassGradeInput}
              onChange={(e) => setEditClassGradeInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
            >
              <option value="Khối 6">Khối 6</option>
              <option value="Khối 7">Khối 7</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Khối 9">Khối 9</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Sức Chứa Tối Đa (Học sinh):</label>
            <input
              type="number"
              required
              value={editClassCapacityInput}
              onChange={(e) => setEditClassCapacityInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Add Class */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        title="Khởi Tạo Lớp Học Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddClassModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateClass} variant="primary" icon={<Plus className="h-4 w-4" />}>
              Thêm Lớp Học
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateClass} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên Lớp Học:</label>
            <input
              type="text"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="VD: Lớp 8A3"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mã Lớp (Viết tắt):</label>
            <input
              type="text"
              required
              value={newClassCode}
              onChange={(e) => setNewClassCode(e.target.value)}
              placeholder="VD: 8A3"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Phòng Học:</label>
            <input
              type="text"
              required
              value={newClassRoom}
              onChange={(e) => setNewClassRoom(e.target.value)}
              placeholder="VD: Phòng 001"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Giáo Viên Chủ Nhiệm (Chọn từ tài khoản hoặc Nhập tên trực tiếp):</label>
            <select
              value={userList.some(u => u.name === newClassTeacher) ? newClassTeacher : (newClassTeacher ? 'custom' : '')}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setNewClassTeacher(e.target.value);
                }
              }}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-extrabold bg-white text-[#18243A]"
            >
              <option value="">-- Chọn Giáo viên Chủ nhiệm --</option>
              {userList.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.username}) - {u.role === 'superadmin' ? 'SuperAdmin' : u.role === 'homeroom_teacher' ? 'GVCN' : u.role === 'subject_teacher' ? 'GVBM' : u.role}
                </option>
              ))}
              <option value="custom">✍️ Tự nhập tên Giáo viên Chủ nhiệm...</option>
            </select>

            <input
              type="text"
              required
              value={newClassTeacher}
              onChange={(e) => setNewClassTeacher(e.target.value)}
              placeholder="Nhập họ và tên Giáo viên Chủ nhiệm (VD: Cô Nguyễn Thị Phương)..."
              className="mt-2 w-full rounded-xl border border-[#6C63FF] p-2 text-xs font-extrabold bg-[#FAFBFF] text-[#18243A]"
            />
            <p className="text-[10px] text-[#68758D] font-bold mt-1">
              ℹ️ Thông tin Giáo viên Chủ nhiệm sẽ tự động đồng bộ lên Sơ đồ lớp và Hồ sơ học sinh!
            </p>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Subject Teacher */}
      <Modal
        isOpen={!!editingSubjectTeacher}
        onClose={() => setEditingSubjectTeacher(null)}
        title={`Phân Công & Cập Nhật GVBM: Môn ${editingSubjectTeacher?.subject_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingSubjectTeacher(null)}>Hủy</Button>
            <Button onClick={handleSaveSubjectTeacherSubmit} variant="primary" icon={<Check className="h-4 w-4" />}>
              Lưu Phân Công
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSubjectTeacherSubmit} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ & Tên Giáo Viên Bộ Môn:</label>
            <input
              type="text"
              required
              value={editSubjectTeacherName}
              onChange={(e) => setEditSubjectTeacherName(e.target.value)}
              placeholder="VD: ThS. Trần Đức Minh"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-extrabold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Số Điện Thoại Liên Hệ:</label>
            <input
              type="text"
              required
              value={editSubjectTeacherPhone}
              onChange={(e) => setEditSubjectTeacherPhone(e.target.value)}
              placeholder="VD: 0912.345.678"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Email Liên Hệ:</label>
            <input
              type="email"
              value={editSubjectTeacherEmail}
              onChange={(e) => setEditSubjectTeacherEmail(e.target.value)}
              placeholder="VD: ducminh.toan@school.edu.vn"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Lớp / Khối Học Phụ Trách:</label>
            <input
              type="text"
              value={editSubjectTeacherClass}
              onChange={(e) => setEditSubjectTeacherClass(e.target.value)}
              placeholder="VD: Khối 8 (Tất cả) hoặc Lớp 8A1, 8A2"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Add User */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Tạo Tài Khoản Đăng Nhập Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddUserModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateUser} variant="primary" icon={<Plus className="h-4 w-4" />}>
              Tạo Tài Khoản
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ và Tên:</label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="VD: Nguyễn Văn Tú Em"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Email:</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="VD: tuem@school.edu.vn"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Số điện thoại:</label>
            <input
              type="text"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
              placeholder="VD: 0901234567"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Vai Trò Mục Tiêu:</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
            >
              <option value="homeroom_teacher">Giáo viên Chủ nhiệm</option>
              <option value="subject_teacher">Giáo viên Bộ môn</option>
              <option value="parent">Phụ huynh</option>
              <option value="student">Học sinh</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mật Khẩu Ban Đầu (Mặc định: 123456):</label>
            <input
              type="text"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Edit User Account */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Chỉnh Sửa Tài Khoản: ${editingUser?.username || editingUser?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Hủy</Button>
            <Button onClick={handleSaveEditUserSubmit} variant="primary" icon={<Check className="h-4 w-4" />}>
              Lưu Thay Đổi
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEditUserSubmit} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ và Tên:</label>
            <input
              type="text"
              required
              value={editUserNameInput}
              onChange={(e) => setEditUserNameInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Email:</label>
            <input
              type="email"
              value={editUserEmailInput}
              onChange={(e) => setEditUserEmailInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Số điện thoại:</label>
            <input
              type="text"
              value={editUserPhoneInput}
              onChange={(e) => setEditUserPhoneInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Vai Trò (Role):</label>
              <select
                value={editUserRoleInput}
                onChange={(e) => setEditUserRoleInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
              >
                <option value="superadmin">SuperAdmin</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="homeroom_teacher">Giáo viên Chủ nhiệm</option>
                <option value="subject_teacher">Giáo viên Bộ môn</option>
                <option value="parent">Phụ huynh</option>
                <option value="student">Học sinh</option>
                <option value="standard_user">Tài khoản thường</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Trạng Thái:</label>
              <select
                value={editUserStatusInput}
                onChange={(e) => setEditUserStatusInput(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
              >
                <option value="active">🟢 Đang hoạt động (Active)</option>
                <option value="inactive">🔴 Khóa / Ngưng (Inactive)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Edit RBAC Permissions */}
      <Modal
        isOpen={!!editingRole}
        onClose={() => setEditingRole(null)}
        title={`Chỉnh Sửa Phân Quyền: ${editingRole?.role_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingRole(null)}>Hủy</Button>
            <Button onClick={handleSavePermissions} variant="primary" icon={<Check className="h-4 w-4" />}>
              Lưu Phân Quyền
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-[#68758D] font-bold">Tích chọn các quyền mà vai trò này được phép truy cập:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {AVAILABLE_PERMISSIONS.map(p => (
              <label key={p.code} className="flex items-center justify-between p-2.5 rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] hover:bg-[#EEECFF] cursor-pointer transition-colors">
                <div className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <div>
                    <div className="text-xs font-extrabold text-[#18243A]">{p.name}</div>
                    <div className="text-[10px] text-[#68758D] font-bold">{p.description}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedPermissionCodes.includes(p.code)}
                  onChange={() => handleTogglePermission(p.code)}
                  className="h-4 w-4 text-[#6C63FF] rounded cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </Modal>

      {/* Modal Admin Set User Password */}
      <Modal
        isOpen={!!selectedUserForPass}
        onClose={() => setSelectedUserForPass(null)}
        title={`Đổi Mật Khẩu Cho: ${selectedUserForPass?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedUserForPass(null)}>Hủy</Button>
            <Button onClick={handleAdminSetUserPasswordSubmit} variant="primary" icon={<Lock className="h-4 w-4" />}>
              Cập Nhật Mật Khẩu
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdminSetUserPasswordSubmit} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mật Khẩu Mới:</label>
            <input
              type="password"
              required
              value={adminSetPasswordInput}
              onChange={(e) => setAdminSetPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Purge Demo Data */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="DỌN DẸP SẠCH DỮ LIỆU DEMO (SUPERADMIN ONLY)"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsPurgeModalOpen(false)}>Hủy</Button>
            <Button onClick={handlePurgeDemoDataSubmit} variant="danger" icon={<Trash2 className="h-4 w-4" />}>
              Xác Nhận Xóa Sạch Dữ Liệu
            </Button>
          </>
        }
      >
        <form onSubmit={handlePurgeDemoDataSubmit} className="space-y-3 py-1">
          <div className="p-3 rounded-xl bg-[#FFEFEF] border border-[#FFC0C3] text-xs font-bold text-[#D32F2F] flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#FF5D68] flex-shrink-0" />
            Cảnh báo: Hành động này sẽ dọn dẹp toàn bộ dữ liệu mẫu trong hệ thống.
          </div>
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nhập từ khóa xác nhận:</label>
            <input
              type="text"
              required
              value={purgeConfirmText}
              onChange={(e) => setPurgeConfirmText(e.target.value)}
              placeholder="CONFIRM_PURGE_DEMO"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono font-bold"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
