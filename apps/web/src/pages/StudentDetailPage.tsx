import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockSubjects } from '../lib/mockData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  User, Shield, GraduationCap, Award, ArrowLeft, CheckCircle, Edit, Printer, Phone, Mail, MapPin, HeartPulse, Trophy, ThumbsUp, ThumbsDown
} from 'lucide-react';

export const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { studentsList: students } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'guardians' | 'academic' | 'conduct'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetClass, setTargetClass] = useState('Lớp 7A2');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Match student by public_id (Căn cước/ĐD e.g. HS-001), student_code (HS001), or numeric id
  const baseStudent = students.find(s =>
    s.public_id.toLowerCase() === studentId?.toLowerCase() ||
    s.student_code.toLowerCase() === studentId?.toLowerCase() ||
    String(s.id) === String(studentId)
  ) || students[0] || {
    id: 1, public_id: 'STU-001', student_code: 'HS001', first_name: 'Chưa có', last_name: 'Học sinh',
    full_name: 'Chưa có thông tin học sinh', gender: 'nam', date_of_birth: '2013-05-15', address: 'TP. HCM',
    status: 'đang học', class_id: 1, class_name: 'Lớp', group_name: 'Tổ 1', roll_number: 1,
    primary_guardian_name: 'Phụ huynh', primary_guardian_phone: '0901234567'
  };

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(baseStudent.avatar_url);

  const [fullName, setFullName] = useState(baseStudent.full_name);
  const [address, setAddress] = useState(baseStudent.address);
  const [guardianName, setGuardianName] = useState(baseStudent.primary_guardian_name || 'Đang cập nhật');
  const [guardianPhone, setGuardianPhone] = useState(baseStudent.primary_guardian_phone || 'Đang cập nhật');

  // Sync state when baseStudent changes (e.g. via URL navigation)
  useEffect(() => {
    setFullName(baseStudent.full_name);
    setAddress(baseStudent.address);
    setGuardianName(baseStudent.primary_guardian_name || 'Đang cập nhật');
    setGuardianPhone(baseStudent.primary_guardian_phone || 'Đang cập nhật');
  }, [baseStudent]);

  // Load persistent Avatar from cache / DB on mount
  useEffect(() => {
    const cached = localStorage.getItem('thcs_student_avatars');
    if (cached) {
      try {
        const avatarMap = JSON.parse(cached);
        if (avatarMap[baseStudent.id]) {
          setCurrentAvatarUrl(avatarMap[baseStudent.id]);
        }
      } catch (e) {}
    }
  }, [baseStudent.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransferModalOpen(false);
    showToast(`Đã ghi nhận giao dịch chuyển học sinh ${fullName} sang ${targetClass}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    showToast('Cập nhật hồ sơ thông tin học sinh thành công!');
  };

  const student = { ...baseStudent, full_name: fullName, address, avatar_url: currentAvatarUrl };

  // Read actual gradebook scores from localStorage for this student
  const scoresState = (() => {
    try {
      const cached = localStorage.getItem('thcs_gradebook_scores');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  })();

  const studentScores = scoresState[baseStudent.id] || {};

  const academicScores = mockSubjects.map((sub) => {
    const rec = studentScores;
    const tx1 = rec.tx1;
    const tx2 = rec.tx2;
    const gk = rec.gk;
    const ck = rec.ck;

    const validScores: { val: number; weight: number }[] = [];
    if (tx1 !== undefined && tx1 !== null) validScores.push({ val: tx1, weight: 1 });
    if (tx2 !== undefined && tx2 !== null) validScores.push({ val: tx2, weight: 1 });
    if (gk !== undefined && gk !== null) validScores.push({ val: gk, weight: 2 });
    if (ck !== undefined && ck !== null) validScores.push({ val: ck, weight: 3 });

    let dtbStr = '--';
    let rank = 'Chưa có điểm';

    if (validScores.length > 0) {
      const totalWeight = validScores.reduce((sum, item) => sum + item.weight, 0);
      const totalPoints = validScores.reduce((sum, item) => sum + (item.val * item.weight), 0);
      const dtbNum = Number((totalPoints / totalWeight).toFixed(1));
      dtbStr = String(dtbNum);
      rank = dtbNum >= 8.5 ? 'Xuất sắc' : dtbNum >= 7.0 ? 'Tốt' : dtbNum >= 5.0 ? 'Khá' : 'Yếu';
    }

    return {
      id: sub.id,
      subject_name: sub.name,
      subject_code: sub.code,
      tx1: tx1 !== undefined ? tx1 : '--',
      tx2: tx2 !== undefined ? tx2 : '--',
      gk: gk !== undefined ? gk : '--',
      ck: ck !== undefined ? ck : '--',
      dtb: dtbStr,
      rank,
    };
  });

  // Calculate overall GPA
  const validDTBs = academicScores.filter(s => s.dtb !== '--').map(s => Number(s.dtb));
  const overallGPA = validDTBs.length > 0 ? (validDTBs.reduce((a, b) => a + b, 0) / validDTBs.length).toFixed(1) : '--';

  // Read actual conduct events for this student
  const studentConductEvents = (() => {
    try {
      const cached = localStorage.getItem('thcs_conduct_events');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((e: any) => e.student_id === baseStudent.id || e.student_name === baseStudent.full_name);
        }
      }
    } catch (e) {}
    return [];
  })();

  const positivePoints = studentConductEvents.filter((e: any) => e.points > 0).reduce((sum: number, e: any) => sum + e.points, 0);
  const violationPoints = studentConductEvents.filter((e: any) => e.points < 0).reduce((sum: number, e: any) => sum + Math.abs(e.points), 0);
  const totalConductScore = studentConductEvents.length > 0 ? 100 + positivePoints - violationPoints : 100;

  return (
    <div className="space-y-6 pb-12 max-w-full overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-extrabold text-[#6C63FF] hover:underline bg-[#EEECFF] px-3.5 py-2 rounded-xl border border-[#C0BBFD] w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách học sinh
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
            In Hồ Sơ Chân Dung
          </Button>
          <Button size="sm" variant="primary" onClick={() => setIsEditModalOpen(true)} icon={<Edit className="h-4 w-4" />}>
            Chỉnh sửa thông tin
          </Button>
          <Button size="sm" variant="danger" onClick={() => setIsTransferModalOpen(true)}>
            Chuyển Lớp / Bảo Lưu
          </Button>
        </div>
      </div>

      {/* Hero Student Profile Header */}
      <div className="clay-card p-6 flex flex-col md:flex-row items-center gap-6">
        {student.avatar_url ? (
          <img src={student.avatar_url} alt={student.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-[#6C63FF] shadow-lg shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8178FF] text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shrink-0">
            {(student?.first_name || student?.full_name || 'H').charAt(0)}
          </div>
        )}

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-[#18243A] tracking-tight">{student.full_name}</h1>
            <Badge variant="purple">{student.student_code}</Badge>
            <Badge variant="mint">{student.status.toUpperCase()}</Badge>
          </div>

          <div className="text-xs text-[#68758D] font-bold space-x-3">
            <span>Sĩ số lớp: <strong className="text-[#18243A]">{student.class_name}</strong></span>
            <span>Tổ: <strong className="text-[#6C63FF]">{student.group_name || 'Tổ 1'}</strong></span>
            <span>Giới tính: <strong className="text-[#18243A] capitalize">{student.gender}</strong></span>
            <span>Ngày sinh: <strong className="text-[#18243A]">{student.date_of_birth}</strong></span>
          </div>

          <div className="text-xs text-[#68758D] font-semibold pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="flex items-center gap-1">
              Mã định danh (Căn cước/ĐD): <strong className="text-[#6C63FF] font-mono">{student.public_id}</strong>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#6C63FF]" /> Địa chỉ: <strong className="text-[#18243A]">{student.address}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex space-x-2 border-b border-[#E1E6F0] bg-white p-2 rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-[#EEECFF] text-[#6C63FF] shadow-xs' : 'text-[#68758D] hover:text-[#18243A]'}`}
        >
          <User className="h-4 w-4" /> Tổng Quan
        </button>

        <button
          onClick={() => setActiveTab('guardians')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'guardians' ? 'bg-[#EEECFF] text-[#6C63FF] shadow-xs' : 'text-[#68758D] hover:text-[#18243A]'}`}
        >
          <Shield className="h-4 w-4" /> Phụ Huynh & Khẩn Cấp
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'academic' ? 'bg-[#EEECFF] text-[#6C63FF] shadow-xs' : 'text-[#68758D] hover:text-[#18243A]'}`}
        >
          <GraduationCap className="h-4 w-4" /> Điểm Số Học Tập
        </button>

        <button
          onClick={() => setActiveTab('conduct')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'conduct' ? 'bg-[#EEECFF] text-[#6C63FF] shadow-xs' : 'text-[#68758D] hover:text-[#18243A]'}`}
        >
          <Award className="h-4 w-4" /> Rèn Luyện & Thi Đua
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Sơ yếu lý lịch */}
          <div className="clay-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2 border-b border-[#E1E6F0] pb-3">
              <User className="h-5 w-5 text-[#6C63FF]" /> Sơ Yếu Lý Lịch Cá Nhân
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs text-[#68758D]">
              <div>Họ và tên: <strong className="text-[#18243A] block text-sm font-extrabold mt-0.5">{student.full_name}</strong></div>
              <div>Mã học sinh: <strong className="text-[#6C63FF] font-mono block text-sm font-extrabold mt-0.5">{student.student_code}</strong></div>
              <div>Mã định danh (Căn cước/ĐD): <strong className="text-[#6C63FF] font-mono block font-bold mt-0.5">{student.public_id}</strong></div>
              <div>Giới tính: <strong className="text-[#18243A] capitalize block font-bold mt-0.5">{student.gender}</strong></div>
              <div>Ngày tháng năm sinh: <strong className="text-[#18243A] block font-bold mt-0.5">{student.date_of_birth}</strong></div>
              <div>Dân tộc / Tôn giáo: <strong className="text-[#18243A] block font-bold mt-0.5">Kinh / Không</strong></div>
              <div>Lớp học: <strong className="text-[#18243A] block font-bold mt-0.5">{student.class_name} (Tổ: {student.group_name || 'Tổ 1'})</strong></div>
              <div>Trạng thái hồ sơ: <strong className="text-[#0E8360] block font-extrabold mt-0.5 capitalize">{student.status}</strong></div>
            </div>

            <div className="pt-3 border-t border-[#E1E6F0] text-xs text-[#68758D]">
              <div>Quê quán / Nơi ĐKHKTT: <strong className="text-[#18243A] block font-semibold mt-0.5">{student.address}</strong></div>
            </div>
          </div>

          {/* Card 2: Chuyên cần & Sức khỏe */}
          <div className="space-y-6">
            <div className="clay-card p-6 space-y-3">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2 border-b border-[#E1E6F0] pb-3">
                <HeartPulse className="h-5 w-5 text-[#22C997]" /> Tình Trạng Chuyên Cần & Sức Khỏe
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[#E6F9F3] border border-[#A3F0D9]">
                  <div className="text-xs font-bold text-[#0E8360]">Nghỉ có phép</div>
                  <div className="text-2xl font-extrabold text-[#0E8360] mt-1">1 buổi</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#FFEFEF] border border-[#FFC0C3]">
                  <div className="text-xs font-bold text-[#D32F2F]">Vắng không phép</div>
                  <div className="text-2xl font-extrabold text-[#D32F2F] mt-1">1 buổi</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD]">
                  <div className="text-xs font-bold text-[#6C63FF]">Đi muộn</div>
                  <div className="text-2xl font-extrabold text-[#6C63FF] mt-1">0 buổi</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] text-xs text-[#68758D] mt-2">
                <strong>Lưu ý sức khỏe:</strong> Tiền sử dị ứng dị vật, thị lực mắt phải 10/10. Đủ điều kiện tham gia các môn Thể dục thể thao.
              </div>
            </div>

            {/* Phụ huynh liên hệ nhanh */}
            <div className="clay-card p-6 space-y-2">
              <h3 className="text-base font-extrabold text-[#18243A]">Đại Diện Phụ Huynh Liên Hệ</h3>
              <div className="text-xs text-[#68758D] space-y-1">
                <div>Phụ huynh đại diện: <strong className="text-[#18243A] text-sm">{guardianName}</strong></div>
                <div>Số điện thoại đăng ký Zalo: <strong className="text-[#6C63FF] font-mono text-sm">{guardianPhone}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUARDIANS & EMERGENCY CONTACTS */}
      {activeTab === 'guardians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Bố */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#6C63FF]" /> Thông Tin Bố (Cha)
              </h3>
              <Badge variant="purple">Phụ huynh Chính</Badge>
            </div>

            <div className="space-y-2.5 text-xs text-[#68758D]">
              <div className="flex items-center justify-between">
                <span>Họ và tên Bố:</span>
                <strong className="text-[#18243A] text-sm font-extrabold">{guardianName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Năm sinh:</span>
                <strong className="text-[#18243A] font-mono">1982 (44 tuổi)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Nghề nghiệp:</span>
                <strong className="text-[#18243A]">Kỹ sư Xây dựng</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Số điện thoại chính:</span>
                <strong className="text-[#6C63FF] font-mono text-sm flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {guardianPhone}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Email liên lạc:</span>
                <strong className="text-[#18243A] font-mono flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> parent.thanh@gmail.com
                </strong>
              </div>
            </div>
          </div>

          {/* Card Mẹ */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#22C997]" /> Thông Tin Mẹ
              </h3>
              <Badge variant="mint">Khẩn cấp 2</Badge>
            </div>

            <div className="space-y-2.5 text-xs text-[#68758D]">
              <div className="flex items-center justify-between">
                <span>Họ và tên Mẹ:</span>
                <strong className="text-[#18243A] text-sm font-extrabold">Trần Thị Mai</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Năm sinh:</span>
                <strong className="text-[#18243A] font-mono">1985 (41 tuổi)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Nghề nghiệp:</span>
                <strong className="text-[#18243A]">Giáo viên Kế toán</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Số điện thoại:</span>
                <strong className="text-[#22C997] font-mono text-sm flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> 0988654321
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Địa chỉ thường trú:</span>
                <strong className="text-[#18243A]">{student.address}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC GRADES */}
      {activeTab === 'academic' && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#6C63FF]" /> Bảng Điểm Số Học Tập Học Kỳ II (14 Môn Học)
            </h3>
            <Badge variant={overallGPA !== '--' ? 'mint' : 'neutral'}>
              {overallGPA !== '--' ? `Điểm TB Tích lũy: ${overallGPA}` : 'Chưa có điểm tích lũy'}
            </Badge>
          </div>

          <div className="overflow-x-auto border border-[#E1E6F0] rounded-xl">
            <table className="w-full text-left text-xs text-[#18243A]">
              <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                <tr>
                  <th className="p-3">Môn học</th>
                  <th className="p-3 text-center">ĐTX 1</th>
                  <th className="p-3 text-center">ĐTX 2</th>
                  <th className="p-3 text-center">Giữa Kỳ (GK)</th>
                  <th className="p-3 text-center">Cuối Kỳ (CK)</th>
                  <th className="p-3 text-center font-extrabold text-[#6C63FF]">Điểm TB Môn</th>
                  <th className="p-3 text-center">Xếp loại Môn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {academicScores.map(row => (
                  <tr key={row.id} className="hover:bg-[#FAFBFF]">
                    <td className="p-3 font-extrabold text-[#18243A]">{row.subject_name} ({row.subject_code})</td>
                    <td className="p-3 text-center font-mono">{row.tx1}</td>
                    <td className="p-3 text-center font-mono">{row.tx2}</td>
                    <td className="p-3 text-center font-mono text-[#6C63FF] font-extrabold">{row.gk}</td>
                    <td className="p-3 text-center font-mono text-[#22C997] font-extrabold">{row.ck}</td>
                    <td className="p-3 text-center font-mono font-extrabold text-sm text-[#6C63FF]">{row.dtb}</td>
                    <td className="p-3 text-center">
                      <Badge variant={row.rank === 'Xuất sắc' ? 'mint' : row.rank === 'Tốt' ? 'purple' : row.rank === 'Khá' ? 'info' : row.rank === 'Yếu' ? 'danger' : 'neutral'}>
                        {row.rank}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONDUCT & DISCIPLINE */}
      {activeTab === 'conduct' && (
        <div className="space-y-6">
          {/* Conduct Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clay-card-purple p-5 text-center">
              <Trophy className="h-8 w-8 text-[#6C63FF] mx-auto mb-1" />
              <div className="text-xs font-extrabold text-[#68758D]">Tổng điểm Thi đua Rèn luyện</div>
              <div className="text-3xl font-extrabold text-[#6C63FF] mt-1">{totalConductScore} Điểm</div>
              <Badge variant="mint" className="mt-2">Xếp loại: {totalConductScore >= 100 ? 'Tốt' : 'Trung bình'}</Badge>
            </div>

            <div className="clay-card p-5 text-center bg-[#E6F9F3] border-[#A3F0D9]">
              <ThumbsUp className="h-8 w-8 text-[#22C997] mx-auto mb-1" />
              <div className="text-xs font-extrabold text-[#0E8360]">Điểm cộng Thưởng tích cực</div>
              <div className="text-3xl font-extrabold text-[#0E8360] mt-1">+{positivePoints} Điểm</div>
              <p className="text-xs text-[#0E8360] mt-1">Tuyên dương & Học tập tích cực</p>
            </div>

            <div className="clay-card p-5 text-center bg-[#FFEFEF] border-[#FFC0C3]">
              <ThumbsDown className="h-8 w-8 text-[#FF5D68] mx-auto mb-1" />
              <div className="text-xs font-extrabold text-[#D32F2F]">Điểm trừ vi phạm</div>
              <div className="text-3xl font-extrabold text-[#D32F2F] mt-1">-{violationPoints} Điểm</div>
              <p className="text-xs text-[#D32F2F] mt-1">Nhắc nhở & Vi phạm nề nếp</p>
            </div>
          </div>

          {/* Timeline of Conduct Events for this student */}
          <div className="clay-card p-6 space-y-4">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#6C63FF]" /> Nhật Ký Ghi Nhận Điểm Rèn Luyện
            </h3>

            <div className="space-y-3">
              {studentConductEvents.length === 0 && (
                <div className="p-8 text-center space-y-2 border border-[#E1E6F0] rounded-2xl bg-white">
                  <p className="text-xs font-extrabold text-[#0E8360]">
                    ✓ Chưa ghi nhận vi phạm hay khen thưởng rèn luyện nào cho học sinh này.
                  </p>
                </div>
              )}

              {studentConductEvents.map((ev: any) => (
                <div key={ev.id} className="p-4 rounded-2xl border border-[#E1E6F0] bg-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${ev.points > 0 ? 'bg-[#E6F9F3] text-[#22C997]' : 'bg-[#FFEFEF] text-[#FF5D68]'}`}>
                      {ev.points > 0 ? <ThumbsUp className="h-5 w-5" /> : <ThumbsDown className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#18243A] text-xs">{ev.criterion_name || ev.description}</div>
                      <div className="text-xs text-[#68758D] font-semibold">{ev.description}</div>
                      <div className="text-[10px] text-[#68758D] font-mono mt-0.5">{ev.logged_at} | Người ghi: {ev.recorded_by || 'Giáo viên'}</div>
                    </div>
                  </div>
                  <Badge variant={ev.points > 0 ? 'mint' : 'danger'}>
                    {ev.points > 0 ? `+${ev.points}` : `${ev.points}`} Điểm
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Profile */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh Sửa Hồ Sơ: ${student.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveProfile} icon={<Edit className="h-4 w-4" />}>
              Lưu thay đổi hồ sơ
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ và tên học sinh:</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Địa chỉ thường trú:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ tên Phụ huynh:</label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">SĐT Phụ huynh:</label>
            <input
              type="text"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Transfer Class */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Chuyển Lớp / Trạng Thái Học Sinh: ${student.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>Hủy</Button>
            <Button onClick={handleTransfer} variant="danger">
              Xác nhận chuyển lớp
            </Button>
          </>
        }
      >
        <form onSubmit={handleTransfer} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Chọn lớp học đích:</label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
            >
              <option value="Lớp 7A2">Lớp 7A2 (Phòng 202)</option>
              <option value="Lớp 8A1">Lớp 8A1 (Phòng 301)</option>
              <option value="Chuyển trường">Chuyển trường (Khác)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
