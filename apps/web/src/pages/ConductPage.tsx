import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockConductCriteria as initialCriteria } from '../lib/mockData';
import { saveToDb, syncAllFromDb } from '../lib/dbSync';
import type { ConductEvent, TeacherLessonEvaluation, Student } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Plus, Trophy, Medal, Search, Edit, Trash2, Settings, CheckCircle, Users, Award, Star
} from 'lucide-react';

interface CriteriaItem {
  id: number;
  code: string;
  name: string;
  default_points: number;
  category: 'Tích cực' | 'Vi phạm';
}

export const ConductPage: React.FC = () => {
  const { selectedClass, studentsList: students } = useAuth();
  const [events, setEventsState] = useState<ConductEvent[]>([]);
  const [teacherEvaluations, setTeacherEvaluations] = useState<TeacherLessonEvaluation[]>([]);

  useEffect(() => {
    syncAllFromDb().then((data: any) => {
      if (data) {
        if (data.thcs_conduct_events && Array.isArray(data.thcs_conduct_events)) {
          setEventsState(data.thcs_conduct_events);
        }
        if (data.thcs_teacher_evaluations && Array.isArray(data.thcs_teacher_evaluations)) {
          setTeacherEvaluations(data.thcs_teacher_evaluations);
        }
      }
    });
  }, []);

  const setEvents = (newEvents: ConductEvent[]) => {
    setEventsState(newEvents);
    saveToDb('thcs_conduct_events', newEvents);
  };

  const [criteriaList, setCriteriaList] = useState<CriteriaItem[]>(
    initialCriteria as CriteriaItem[]
  );

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'group_leaderboard' | 'log' | 'criteria' | 'teacher_eval'>('leaderboard');


  const [selectedCriterionId, setSelectedCriterionId] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState(1);
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Criteria Add / Edit
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaItem | null>(null);
  const [critCode, setCritCode] = useState('');
  const [critName, setCritName] = useState('');
  const [critPoints, setCritPoints] = useState(5);
  const [critCategory, setCritCategory] = useState<'Tích cực' | 'Vi phạm'>('Tích cực');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const criterion = criteriaList.find(c => c.id === selectedCriterionId);
    const student = students.find(s => s.id === selectedStudentId);

    if (criterion && student) {
      const newEv: ConductEvent = {
        id: events.length + 1,
        student_id: student.id,
        student_name: student.full_name,
        criterion_name: criterion.name,
        event_type: criterion.category === 'Tích cực' ? 'positive' : 'violation',
        logged_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        points: criterion.default_points,
        description: description || criterion.name,
        recorded_by: 'Cô Trần Thị Minh Hương',
      };
      setEvents([newEv, ...events]);
      setDescription('');
      showToast(`Đã ghi nhận điểm rèn luyện cho ${student.full_name} (${criterion.default_points > 0 ? `+${criterion.default_points}` : criterion.default_points}đ)!`);
    }
  };

  // Criteria Management Handlers
  const handleOpenAddCriteria = () => {
    setEditingCriteria(null);
    setCritCode(`CRIT_${Date.now().toString().slice(-4)}`);
    setCritName('');
    setCritPoints(5);
    setCritCategory('Tích cực');
    setIsCriteriaModalOpen(true);
  };

  const handleOpenEditCriteria = (c: CriteriaItem) => {
    setEditingCriteria(c);
    setCritCode(c.code);
    setCritName(c.name);
    setCritPoints(c.default_points);
    setCritCategory(c.category);
    setIsCriteriaModalOpen(true);
  };

  const handleDeleteCriteria = (id: number) => {
    const target = criteriaList.find(c => c.id === id);
    setCriteriaList(prev => prev.filter(c => c.id !== id));
    showToast(`Đã xóa tiêu chí "${target?.name}" khỏi hệ thống!`);
  };

  const handleSaveCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critName.trim()) return;

    const pointsNum = Number(critPoints);
    const adjustedPoints = critCategory === 'Vi phạm' && pointsNum > 0 ? -pointsNum : pointsNum;

    if (editingCriteria) {
      setCriteriaList(prev => prev.map(c => {
        if (c.id === editingCriteria.id) {
          return {
            ...c,
            code: critCode,
            name: critName,
            default_points: adjustedPoints,
            category: critCategory,
          };
        }
        return c;
      }));
      showToast(`Đã cập nhật tiêu chí "${critName}" (${adjustedPoints > 0 ? `+${adjustedPoints}` : adjustedPoints} điểm) thành công!`);
    } else {
      const newCrit: CriteriaItem = {
        id: criteriaList.length + 1,
        code: critCode.toUpperCase(),
        name: critName,
        default_points: adjustedPoints,
        category: critCategory,
      };
      setCriteriaList([...criteriaList, newCrit]);
      showToast(`Đã thêm tiêu chí rèn luyện mới "${critName}" (${adjustedPoints > 0 ? `+${adjustedPoints}` : adjustedPoints} điểm)!`);
    }

    setIsCriteriaModalOpen(false);
  };

  // Calculate Student Leaderboard Rankings
  const leaderboardData = useMemo(() => {
    const studentMap: Record<number, { student: Student; positive: number; violation: number; totalPoints: number }> = {};

    students.forEach(s => {
      studentMap[s.id] = { student: s, positive: 0, violation: 0, totalPoints: 0 };
    });

    events.forEach(ev => {
      if (studentMap[ev.student_id]) {
        if (ev.points > 0) {
          studentMap[ev.student_id].positive += ev.points;
        } else {
          studentMap[ev.student_id].violation += Math.abs(ev.points);
        }
        studentMap[ev.student_id].totalPoints += ev.points;
      }
    });

    return Object.values(studentMap).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [events, students]);

  // Calculate Group/Team Leaderboard Rankings
  const groupLeaderboardData = useMemo(() => {
    const groups: Record<string, { group_name: string; studentCount: number; positive: number; violation: number; totalPoints: number; avgPoints: number }> = {
      'Tổ 1': { group_name: 'Tổ 1', studentCount: 0, positive: 0, violation: 0, totalPoints: 0, avgPoints: 0 },
      'Tổ 2': { group_name: 'Tổ 2', studentCount: 0, positive: 0, violation: 0, totalPoints: 0, avgPoints: 0 },
      'Tổ 3': { group_name: 'Tổ 3', studentCount: 0, positive: 0, violation: 0, totalPoints: 0, avgPoints: 0 },
      'Tổ 4': { group_name: 'Tổ 4', studentCount: 0, positive: 0, violation: 0, totalPoints: 0, avgPoints: 0 },
    };

    students.forEach(s => {
      const gName = s.group_name || 'Tổ 1';
      if (!groups[gName]) {
        groups[gName] = { group_name: gName, studentCount: 0, positive: 0, violation: 0, totalPoints: 0, avgPoints: 0 };
      }
      groups[gName].studentCount += 1;
      groups[gName].totalPoints += 0;
    });

    events.forEach(ev => {
      const student = students.find(s => s.id === ev.student_id);
      const gName = student?.group_name || 'Tổ 1';
      if (groups[gName]) {
        if (ev.points > 0) {
          groups[gName].positive += ev.points;
        } else {
          groups[gName].violation += Math.abs(ev.points);
        }
        groups[gName].totalPoints += ev.points;
      }
    });

    Object.values(groups).forEach(g => {
      g.avgPoints = g.studentCount > 0 ? Number((g.totalPoints / g.studentCount).toFixed(1)) : 0;
    });

    return Object.values(groups).sort((a, b) => b.avgPoints - a.avgPoints);
  }, [events, students]);

  const getConductRating = (points: number, hasEvents: boolean = true) => {
    if (!hasEvents && points === 0) return { label: 'Chưa xếp loại', variant: 'neutral' as const };
    if (points >= 105) return { label: 'Xuất sắc', variant: 'purple' as const };
    if (points >= 95) return { label: 'Tốt', variant: 'mint' as const };
    if (points >= 80) return { label: 'Khá', variant: 'info' as const };
    if (points >= 65) return { label: 'Trung bình', variant: 'warning' as const };
    return { label: 'Yếu', variant: 'danger' as const };
  };

  const filteredLeaderboard = leaderboardData.filter(item =>
    item.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student.student_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Top 3 Podium Items arranged for 3D Podium Layout: [Rank 2 (Silver), Rank 1 (Gold Elevated Center), Rank 3 (Bronze)]
  const top1 = leaderboardData[0];
  const top2 = leaderboardData[1];
  const top3 = leaderboardData[2];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Header - Fixed Single Line Title Layout */}
      <div className="space-y-3 border-b border-[#E1E6F0] pb-4">
        {/* Full Width 100% Title Line */}
        <h1 className="text-2xl sm:text-3xl font-black text-[#18243A] tracking-tight flex items-center gap-2.5 whitespace-nowrap">
          <Trophy className="h-8 w-8 text-[#F6B73C] shrink-0" />
          <span>Bảng Xếp Hạng Rèn Luyện & Thi Đua {selectedClass.name}</span>
        </h1>

        {/* Subtitle Top + Action Buttons Underneath */}
        <div className="flex flex-col gap-3 pt-1">
          <p className="text-xs sm:text-sm text-[#68758D] font-bold">
            Bảng xếp hạng thi đua học sinh & xếp hạng thi đua các Tổ học tập trong lớp
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === 'leaderboard' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('leaderboard')}
              icon={<Trophy className="h-4 w-4" />}
            >
              Xếp Hạng Cá Nhân
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'group_leaderboard' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('group_leaderboard')}
              icon={<Users className="h-4 w-4" />}
            >
              Xếp Hạng Thi Đua Tổ
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'log' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('log')}
              icon={<Plus className="h-4 w-4" />}
            >
              Ghi Nhận Sự Kiện
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'teacher_eval' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('teacher_eval')}
              icon={<Award className="h-4 w-4" />}
            >
              Đánh Giá Tiết Dạy (GVBM)
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'criteria' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('criteria')}
              icon={<Settings className="h-4 w-4" />}
            >
              Quản Lý Tiêu Chí ({criteriaList.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Tab 1: Individual Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* ULTRA PREMIUM TOP 3 PODIUM (Rank 2 Silver | Rank 1 Gold Center Elevated | Rank 3 Bronze) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4">
            
            {/* RANK 2: SILVER (LEFT PODIUM) */}
            {top2 && (
              <div className="order-2 md:order-1 clay-card p-6 text-center flex flex-col items-center justify-between border-2 border-[#CBD5E1] bg-gradient-to-b from-[#F8FAFC] via-white to-[#F1F5F9] shadow-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#94A3B8] via-[#CBD5E1] to-[#94A3B8]"></div>
                
                <div className="flex items-center gap-1 bg-[#F1F5F9] border border-[#CBD5E1] text-[#475569] font-black text-xs px-3 py-1 rounded-full shadow-2xs mb-3">
                  🥈 HẠNG 2 - Á QUÂN
                </div>

                <div className="relative my-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#94A3B8] to-[#CBD5E1] text-[#1E293B] flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white ring-4 ring-[#E2E8F0]">
                    {(top2.student?.first_name || top2.student?.full_name || 'H').charAt(0)}
                  </div>
                  <span className="absolute -top-2 -right-1 text-2xl drop-shadow-md">🥈</span>
                </div>

                <div className="mt-2">
                  <div className="font-black text-[#18243A] text-lg">{top2.student.full_name}</div>
                  <div className="text-xs text-[#68758D] font-extrabold">{top2.student.student_code} • {top2.student.group_name}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#CBD5E1]/60 w-full flex items-center justify-between">
                  <Badge variant={getConductRating(top2.totalPoints, events.length > 0).variant}>
                    Xếp loại: {getConductRating(top2.totalPoints, events.length > 0).label}
                  </Badge>
                  <span className="text-lg font-black text-[#475569] bg-[#F1F5F9] px-3 py-1 rounded-xl border border-[#CBD5E1]">
                    {top2.totalPoints} điểm
                  </span>
                </div>
              </div>
            )}

            {/* RANK 1: GOLD (ELEVATED CENTER PODIUM) */}
            {top1 && (
              <div className="order-1 md:order-2 clay-card p-7 text-center flex flex-col items-center justify-between border-2 border-[#F6B73C] bg-gradient-to-b from-[#FFFDF5] via-white to-[#FFF9EB] shadow-[0_16px_36px_rgba(246,183,60,0.3)] rounded-3xl relative overflow-hidden md:-translate-y-4 group hover:-translate-y-5 transition-transform z-10">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#F6B73C] via-[#FFE082] to-[#F6B73C]"></div>
                
                <div className="flex items-center gap-1.5 bg-[#FFF9EB] border-2 border-[#FFE399] text-[#B47800] font-black text-xs px-4 py-1.5 rounded-full shadow-xs mb-3">
                  👑 🥇 HẠNG 1 - QUÁN QUÂN
                </div>

                <div className="relative my-2">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F6B73C] to-[#FFE082] text-[#5C4000] flex items-center justify-center font-black text-4xl shadow-xl border-4 border-white ring-4 ring-[#FFE399] animate-pulse">
                    {(top1.student?.first_name || top1.student?.full_name || 'H').charAt(0)}
                  </div>
                  <span className="absolute -top-3 -right-2 text-3xl drop-shadow-md">👑</span>
                </div>

                <div className="mt-2">
                  <div className="font-black text-[#18243A] text-xl tracking-tight">{top1.student.full_name}</div>
                  <div className="text-xs text-[#B47800] font-black">{top1.student.student_code} • {top1.student.group_name}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FFE399] w-full flex items-center justify-between">
                  <Badge variant={getConductRating(top1.totalPoints, events.length > 0).variant}>
                    Xếp loại: {getConductRating(top1.totalPoints, events.length > 0).label}
                  </Badge>
                  <span className="text-xl font-black text-[#B47800] bg-[#FFF9EB] px-3.5 py-1 rounded-xl border border-[#FFE399] shadow-2xs">
                    {top1.totalPoints} điểm
                  </span>
                </div>
              </div>
            )}

            {/* RANK 3: BRONZE (RIGHT PODIUM) */}
            {top3 && (
              <div className="order-3 clay-card p-6 text-center flex flex-col items-center justify-between border-2 border-[#E2B997] bg-gradient-to-b from-[#FFF8F3] via-white to-[#FFF5ED] shadow-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#D97706]"></div>
                
                <div className="flex items-center gap-1 bg-[#FFF5ED] border border-[#FED7AA] text-[#D97706] font-black text-xs px-3 py-1 rounded-full shadow-2xs mb-3">
                  🥉 HẠNG 3 - HẠNG BA
                </div>

                <div className="relative my-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center font-black text-3xl shadow-lg border-4 border-white ring-4 ring-[#FED7AA]">
                    {(top3.student?.first_name || top3.student?.full_name || 'H').charAt(0)}
                  </div>
                  <span className="absolute -top-2 -right-1 text-2xl drop-shadow-md">🥉</span>
                </div>

                <div className="mt-2">
                  <div className="font-black text-[#18243A] text-lg">{top3.student.full_name}</div>
                  <div className="text-xs text-[#68758D] font-extrabold">{top3.student.student_code} • {top3.student.group_name}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FED7AA]/60 w-full flex items-center justify-between">
                  <Badge variant={getConductRating(top3.totalPoints, events.length > 0).variant}>
                    Xếp loại: {getConductRating(top3.totalPoints, events.length > 0).label}
                  </Badge>
                  <span className="text-lg font-black text-[#D97706] bg-[#FFF5ED] px-3 py-1 rounded-xl border border-[#FED7AA]">
                    {top3.totalPoints} điểm
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Full Individual Leaderboard Table */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <Medal className="h-5 w-5 text-[#6C63FF]" />
                Bảng Xếp Hạng Cá Nhân Toàn Lớp ({filteredLeaderboard.length} em)
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68758D] h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] py-1.5 pl-9 pr-3 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#E1E6F0] rounded-2xl">
              <table className="w-full text-left text-xs text-[#18243A]">
                <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                  <tr>
                    <th className="p-3 text-center w-16">Thứ hạng</th>
                    <th className="p-3">Mã HS</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Tổ</th>
                    <th className="p-3 text-center">Điểm cộng (+)</th>
                    <th className="p-3 text-center">Điểm trừ (-)</th>
                    <th className="p-3 text-center">Tổng điểm Thi đua</th>
                    <th className="p-3 text-center">Xếp loại Rèn luyện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E6F0]">
                  {filteredLeaderboard.map((item, idx) => {
                    const rating = getConductRating(item.totalPoints, events.length > 0);
                    return (
                      <tr key={item.student.id} className="hover:bg-[#FAFBFF] transition-colors">
                        <td className="p-3 text-center font-black">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="p-3 font-mono font-bold text-[#68758D]">{item.student.student_code}</td>
                        <td className="p-3 font-extrabold text-[#18243A]">{item.student.full_name}</td>
                        <td className="p-3">
                          <Badge variant="purple">{item.student.group_name || 'Tổ 1'}</Badge>
                        </td>
                        <td className="p-3 text-center font-extrabold text-[#0E8360]">+{item.positive}</td>
                        <td className="p-3 text-center font-extrabold text-[#FF5D68]">-{item.violation}</td>
                        <td className="p-3 text-center font-black text-sm text-[#6C63FF]">
                          {item.totalPoints} đ
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={rating.variant}>{rating.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Group/Team Leaderboard */}
      {activeTab === 'group_leaderboard' && (
        <div className="clay-card p-6 space-y-4">
          <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#6C63FF]" />
            Bảng Xếp Hạng Thi Đua Rèn Luyện Theo Tổ Học Tập
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupLeaderboardData.map((group, idx) => (
              <div
                key={group.group_name}
                className={`p-4 rounded-2xl border-2 bg-white flex flex-col justify-between space-y-3 ${
                  idx === 0 ? 'border-[#F6B73C] shadow-md bg-gradient-to-b from-[#FFF9EB] to-white' : 'border-[#E1E6F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-[#18243A]">{group.group_name}</span>
                    <Badge variant={idx === 0 ? 'purple' : 'info'}>Hạng {idx + 1}</Badge>
                  </div>
                  <div className="text-xs text-[#68758D] font-bold">Số thành viên: <strong className="text-[#18243A]">{group.studentCount} em</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#68758D] font-bold">Tổng điểm thi đua:</span>
                    <span className="font-extrabold text-[#18243A]">{group.totalPoints} đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#68758D] font-bold">Điểm trung bình/em:</span>
                    <span className="font-black text-[#6C63FF] text-sm">{group.avgPoints} đ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Log Conduct Event Form */}
      {activeTab === 'log' && (
        <div className="clay-card p-6 space-y-4">
          <h3 className="text-base font-extrabold text-[#18243A]">Ghi Nhận Sự Kiện Tuyên Dương / Vi Phạm</h3>

          <form onSubmit={handleAddEvent} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A] mb-1">Chọn học sinh:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] p-2.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF]"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.student_code} - {s.full_name} ({s.group_name || 'Tổ 1'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A] mb-1">Chọn tiêu chí rèn luyện:</label>
              <select
                value={selectedCriterionId}
                onChange={(e) => setSelectedCriterionId(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] p-2.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF]"
              >
                {criteriaList.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.category}] {c.name} ({c.default_points > 0 ? `+${c.default_points}` : c.default_points} điểm)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A] mb-1">Mô tả sự việc chi tiết (tùy chọn):</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả diễn biến..."
                className="w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] p-2.5 text-xs font-semibold text-[#18243A] focus:border-[#6C63FF]"
              />
            </div>

            <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />}>
              Ghi nhận vào sổ thi đua
            </Button>
          </form>
        </div>
      )}

      {/* Tab 4: Manage Criteria List */}
      {activeTab === 'criteria' && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#18243A]">Danh Sách Tiêu Chí Rèn Luyện & Thi Đua</h3>
            <Button size="sm" variant="mint" onClick={handleOpenAddCriteria} icon={<Plus className="h-4 w-4" />}>
              Thêm Tiêu Chí Mới
            </Button>
          </div>

          <div className="overflow-x-auto border border-[#E1E6F0] rounded-2xl">
            <table className="w-full text-left text-xs text-[#18243A]">
              <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                <tr>
                  <th className="p-3">Mã tiêu chí</th>
                  <th className="p-3">Tên tiêu chí</th>
                  <th className="p-3 text-center">Phân loại</th>
                  <th className="p-3 text-center">Điểm mặc định</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {criteriaList.map(c => (
                  <tr key={c.id} className="hover:bg-[#FAFBFF] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#68758D]">{c.code}</td>
                    <td className="p-3 font-extrabold text-[#18243A]">{c.name}</td>
                    <td className="p-3 text-center">
                      <Badge variant={c.category === 'Tích cực' ? 'mint' : 'danger'}>
                        {c.category}
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-extrabold text-sm">
                      <span className={c.default_points > 0 ? 'text-[#0E8360]' : 'text-[#FF5D68]'}>
                        {c.default_points > 0 ? `+${c.default_points}` : c.default_points}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditCriteria(c)} icon={<Edit className="h-3.5 w-3.5" />}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteCriteria(c.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Subject Teacher Period Evaluations */}
      {activeTab === 'teacher_eval' && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E6F0] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <Star className="h-5 w-5 text-[#F6B73C]" />
                Nhật Ký Đánh Giá Học Sinh Tiết Dạy Của Giáo Viên Bộ Môn ({teacherEvaluations.length} lượt)
              </h3>
              <p className="text-xs text-[#68758D] font-bold mt-0.5">
                Các ghi nhận đánh giá biểu hiện, bài tập & nề nếp của học sinh từ giáo viên các môn học
              </p>
            </div>
            <Badge variant="purple">{teacherEvaluations.length} đánh giá tiết học</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherEvaluations.map(ev => (
              <div
                key={ev.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md transition-all ${
                  ev.evaluation_type === 'praise'
                    ? 'bg-gradient-to-br from-[#F0FAF7] to-[#E6F9F3] border-[#A3F0D9]'
                    : 'bg-gradient-to-br from-[#FFF5F5] to-[#FFEFEF] border-[#FFC0C3]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={ev.evaluation_type === 'praise' ? 'mint' : 'danger'}>
                        {ev.evaluation_type === 'praise' ? 'Tuyên dương' : 'Nhắc nhở'}
                      </Badge>
                      <span className="text-xs font-extrabold text-[#18243A]">{ev.subject_name} · Tiết {ev.period}</span>
                    </div>
                    <div className="font-extrabold text-[#18243A] text-sm mt-1">
                      {ev.student_name}
                    </div>
                    <div className="text-[10px] text-[#68758D] font-mono mt-0.5">Ngày: {ev.eval_date}</div>
                  </div>

                  <div className={`text-base font-black px-3 py-1 rounded-xl border ${
                    ev.points_impact > 0 ? 'bg-[#0E8360] text-white border-[#0E8360]' : 'bg-[#FF5D68] text-white border-[#FF5D68]'
                  }`}>
                    {ev.points_impact > 0 ? `+${ev.points_impact}` : ev.points_impact}đ
                  </div>
                </div>

                <div className="text-xs font-bold text-[#18243A] pt-1 border-t border-black/5">
                  Tiêu chí: <span className={ev.evaluation_type === 'praise' ? 'text-[#0E8360]' : 'text-[#FF5D68]'}>{ev.category_title}</span>
                </div>

                <div className="text-xs text-[#4A5568] bg-white/90 p-2.5 rounded-xl border border-black/5 font-medium leading-relaxed">
                  "{ev.comment}"
                </div>

                <div className="text-[10px] text-[#68758D] font-bold text-right pt-1">
                  Đánh giá bởi: <strong className="text-[#18243A]">{ev.teacher_name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* MODAL CRITERIA ADD / EDIT */}
      <Modal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        title={editingCriteria ? `Chỉnh Sửa Tiêu Chí: ${editingCriteria.name}` : 'Thêm Tiêu Chí Rèn Luyện Mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCriteriaModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveCriteria} icon={<CheckCircle className="h-4 w-4" />}>
              Lưu tiêu chí
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCriteria} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên tiêu chí rèn luyện:</label>
            <input
              type="text"
              required
              value={critName}
              onChange={(e) => setCritName(e.target.value)}
              placeholder="VD: Hào hứng xung phong phát biểu..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Phân loại tiêu chí:</label>
              <select
                value={critCategory}
                onChange={(e) => setCritCategory(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] bg-white focus:border-[#6C63FF] focus:outline-none"
              >
                <option value="Tích cực">Tích cực (Điểm cộng)</option>
                <option value="Vi phạm">Vi phạm (Điểm trừ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Số điểm quy đổi:</label>
              <input
                type="number"
                required
                value={critPoints}
                onChange={(e) => setCritPoints(Number(e.target.value))}
                placeholder="5"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
