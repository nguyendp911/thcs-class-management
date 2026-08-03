import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTimetable as initialTimetable, mockLessonLogs as initialLogs } from '../lib/mockData';
import { saveToDb } from '../lib/dbSync';
import type { TimetableEntry, LessonLog, TeacherLessonEvaluation } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Calendar, BookOpen, Edit, Plus, CheckCircle, Clock, Trash2, BookMarked, Award, Star, ThumbsUp, AlertCircle, Phone } from 'lucide-react';


interface CustomSubject {
  id: number;
  code: string;
  name: string;
  teacher_name: string;
  teacher_phone?: string;
  color: string;
}

export const TimetablePage: React.FC = () => {
  const { selectedClass, studentsList: students } = useAuth();
  
  const DEFAULT_SUBJECTS: CustomSubject[] = [
    { id: 1, code: 'TOAN', name: 'Toán học', teacher_name: 'Thầy Lê Hoàng Nam', teacher_phone: '0981234567', color: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]' },
    { id: 2, code: 'VAN', name: 'Ngữ văn', teacher_name: 'Cô Trần Thị Minh Hương', teacher_phone: '0982345678', color: 'bg-[#FFEFEF] text-[#FF5D68] border-[#FFC0C3]' },
    { id: 3, code: 'ENG', name: 'Tiếng Anh', teacher_name: 'Cô Phạm Thị Hoa', teacher_phone: '0983456789', color: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]' },
    { id: 4, code: 'LY', name: 'Vật lý', teacher_name: 'Thầy Vũ Quốc Hùng', teacher_phone: '0984567890', color: 'bg-[#FFF5ED] text-[#D97706] border-[#FED7AA]' },
    { id: 5, code: 'HOA', name: 'Hóa học', teacher_name: 'Cô Nguyễn Thị Lan', teacher_phone: '0985678901', color: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]' },
    { id: 6, code: 'SINH', name: 'Sinh học', teacher_name: 'Thầy Hoàng Văn Hải', teacher_phone: '0986789012', color: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]' },
    { id: 7, code: 'SU', name: 'Lịch sử', teacher_name: 'Cô Đỗ Thị Mai', teacher_phone: '0987890123', color: 'bg-[#FFF9EB] text-[#B47800] border-[#FFE399]' },
    { id: 8, code: 'DIA', name: 'Địa lý', teacher_name: 'Thầy Trịnh Văn Bằng', teacher_phone: '0988901234', color: 'bg-[#FFF9EB] text-[#B47800] border-[#FFE399]' },
    { id: 9, code: 'GDCD', name: 'GDCD', teacher_name: 'Cô Lê Thị Nga', teacher_phone: '0989012345', color: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]' },
    { id: 10, code: 'TIN', name: 'Tin học', teacher_name: 'Thầy Ngô Văn Bảo', teacher_phone: '0971234567', color: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]' },
    { id: 11, code: 'TD', name: 'Thể dục', teacher_name: 'Thầy Bùi Văn Tiến', teacher_phone: '0972345678', color: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]' },
  ];
  const [subjectList, setSubjectList] = useState<CustomSubject[]>(DEFAULT_SUBJECTS);

  const [timetable, setTimetable] = useState<TimetableEntry[]>(initialTimetable);
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'timetable' | 'logs' | 'subjects'>('timetable');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedSlot, setDraggedSlot] = useState<{ day: number; period: number; entry: TimetableEntry } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ day: number; period: number } | null>(null);

  // Modal Edit Timetable Slot
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDay, setEditDay] = useState(2);
  const [editPeriod, setEditPeriod] = useState(1);
  const [editSubjectId, setEditSubjectId] = useState(1);
  const [editTeacherName, setEditTeacherName] = useState('Thầy Lê Hoàng Nam');
  const [editRoom, setEditRoom] = useState('Phòng 201');

  // Modal Add / Edit Subject State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<CustomSubject | null>(null);
  const [subCodeInput, setSubCodeInput] = useState('');
  const [subNameInput, setSubNameInput] = useState('');
  const [subTeacherInput, setSubTeacherInput] = useState('');
  const [subPhoneInput, setSubPhoneInput] = useState('');

  // Modal Add Lesson Log
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logDate, setLogDate] = useState('2026-07-31');
  const [logPeriod, setLogPeriod] = useState(1);
  const [logSubjectId, setLogSubjectId] = useState(1);
  const [logLessonTitle, setLogLessonTitle] = useState('');
  const [logConductNotes, setLogConductNotes] = useState('');
  const [logHomework, setLogHomework] = useState('');

  // Modal Subject Teacher Student Assessment in Period
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalDate, setEvalDate] = useState('2026-07-31');
  const [evalPeriod, setEvalPeriod] = useState(1);
  const [evalSubjectId, setEvalSubjectId] = useState(1);
  const [evalStudentId, setEvalStudentId] = useState(1);
  const [evalType, setEvalType] = useState<'praise' | 'reminder'>('praise');
  const [evalCategoryTitle, setEvalCategoryTitle] = useState('Hăng hái phát biểu xây dựng bài');
  const [evalPoints, setEvalPoints] = useState(2);
  const [evalComment, setEvalComment] = useState('');

  const [teacherEvaluations, setTeacherEvaluations] = useState<TeacherLessonEvaluation[]>([]);

  const saveTeacherEvaluationsState = (newEvals: TeacherLessonEvaluation[]) => {
    setTeacherEvaluations(newEvals);
    saveToDb('thcs_teacher_evaluations', newEvals);
  };

  const handleSaveEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s: any) => s.id === evalStudentId);
    const subject = subjectList.find(s => s.id === evalSubjectId);

    if (student && subject) {
      const points = evalType === 'praise' ? Math.abs(evalPoints) : -Math.abs(evalPoints);
      const newEval: TeacherLessonEvaluation = {
        id: Date.now(),
        class_id: selectedClass?.id || 1,
        eval_date: evalDate,
        period: evalPeriod,
        subject_name: subject.name,
        teacher_name: subject.teacher_name,
        student_id: student.id,
        student_name: student.full_name,
        evaluation_type: evalType,
        category_title: evalCategoryTitle,
        points_impact: points,
        comment: evalComment || evalCategoryTitle,
        created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      const updated = [newEval, ...teacherEvaluations];
      saveTeacherEvaluationsState(updated);
      setIsEvalModalOpen(false);
      setEvalComment('');
      showToast(`GVBM đã ghi nhận đánh giá cho học sinh ${student.full_name} (${points > 0 ? `+${points}` : points} điểm)!`);
    }
  };


  const days = [
    { num: 2, label: 'Thứ 2' },
    { num: 3, label: 'Thứ 3' },
    { num: 4, label: 'Thứ 4' },
    { num: 5, label: 'Thứ 5' },
    { num: 6, label: 'Thứ 6' },
    { num: 7, label: 'Thứ 7' },
  ];

  const periods = [1, 2, 3, 4, 5];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Timetable, Logs & Subjects scoped by selectedClass.id
  useEffect(() => {
    if (!selectedClass || !selectedClass.id) return;
    const classId = selectedClass.id;

    const loadData = async () => {
      // 1. Try reading class-specific timetable from LocalStorage
      try {
        const savedTt = localStorage.getItem(`thcs_timetable_class_${classId}`);
        if (savedTt) {
          setTimetable(JSON.parse(savedTt));
        } else {
          // Generate unique timetable for class if no saved timetable
          const classSpecific = initialTimetable.map(t => ({
            ...t,
            class_id: classId,
          }));
          setTimetable(classSpecific);
        }

        const savedSubs = localStorage.getItem(`thcs_subject_list_class_${classId}`);
        if (savedSubs) {
          setSubjectList(JSON.parse(savedSubs));
        } else {
          setSubjectList(DEFAULT_SUBJECTS);
        }
      } catch (e) {}

      // 2. Fetch from backend API
      try {
        const response = await fetch(`/thcs/api/timetable?class_id=${classId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.timetable && Array.isArray(data.timetable) && data.timetable.length > 0) {
            const mapped = data.timetable.map((t: any) => ({
              ...t,
              day_of_week: Number(t.day_of_week),
              period: Number(t.period),
              subject_id: Number(t.subject_id || 1),
            }));
            setTimetable(mapped);
          }
        }
      } catch (err) {}
    };

    loadData();
  }, [selectedClass?.id]);

  const saveSubjectsState = (updated: CustomSubject[]) => {
    setSubjectList(updated);
    saveToDb(`thcs_subject_list_class_${selectedClass?.id || 0}`, updated);
  };

  const saveTimetableState = async (newTimetable: TimetableEntry[]) => {
    setTimetable(newTimetable);
    saveToDb(`thcs_timetable_class_${selectedClass?.id || 0}`, newTimetable);
    try {
      await fetch('/thcs/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: selectedClass?.id, timetable: newTimetable }),
      });
    } catch (err) {}
  };

  const saveLessonLogsState = async (newLogs: LessonLog[]) => {
    setLessonLogs(newLogs);
    try {
      await fetch('/thcs/api/lesson-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: newLogs }),
      });
    } catch (e) {}
  };

  // SUBJECT CRUD HANDLERS
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubCodeInput(`SUB_${Date.now().toString().slice(-4)}`);
    setSubNameInput('');
    setSubTeacherInput('Giáo viên bộ môn');
    setSubPhoneInput('');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: CustomSubject) => {
    setEditingSubject(sub);
    setSubCodeInput(sub.code);
    setSubNameInput(sub.name);
    setSubTeacherInput(sub.teacher_name);
    setSubPhoneInput(sub.teacher_phone || '');
    setIsSubjectModalOpen(true);
  };

  const handleDeleteSubject = (id: number) => {
    const target = subjectList.find(s => s.id === id);
    if (!target) return;
    if (confirm(`Bạn có chắc chắn muốn xóa môn học "${target.name}"?`)) {
      const updated = subjectList.filter(s => s.id !== id);
      saveSubjectsState(updated);
      showToast(`Đã xóa môn học "${target.name}" thành công!`);
    }
  };

  const handleSaveSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subNameInput.trim()) return;

    if (editingSubject) {
      const updated = subjectList.map(s => {
        if (s.id === editingSubject.id) {
          return {
            ...s,
            code: subCodeInput.toUpperCase(),
            name: subNameInput.trim(),
            teacher_name: subTeacherInput.trim(),
            teacher_phone: subPhoneInput.trim(),
          };
        }
        return s;
      });
      saveSubjectsState(updated);
      showToast(`Đã cập nhật môn học "${subNameInput}" thành công!`);
    } else {
      const newSub: CustomSubject = {
        id: Date.now(),
        code: subCodeInput.toUpperCase(),
        name: subNameInput.trim(),
        teacher_name: subTeacherInput.trim() || 'Giáo viên bộ môn',
        teacher_phone: subPhoneInput.trim(),
        color: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]',
      };
      const updated = [...subjectList, newSub];
      saveSubjectsState(updated);
      showToast(`Đã thêm môn học mới "${newSub.name}" thành công!`);
    }

    setIsSubjectModalOpen(false);
  };

  // EDIT TIMETABLE SLOT HANDLERS
  const handleOpenEditSlot = (day: number, period: number) => {
    const existing = timetable.find(t => t.day_of_week === day && t.period === period);
    setEditDay(day);
    setEditPeriod(period);
    setEditSubjectId(existing ? existing.subject_id || 1 : 1);
    setEditTeacherName(existing ? existing.teacher_name : 'Thầy Lê Hoàng Nam');
    setEditRoom(existing ? existing.room : 'Phòng 201');
    setIsEditModalOpen(true);
  };

  const handleSaveSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSub = subjectList.find(s => s.id === Number(editSubjectId)) || subjectList[0];

    const updated = timetable.filter(t => !(t.day_of_week === editDay && t.period === editPeriod));
    const newEntry: TimetableEntry = {
      id: Date.now(),
      day_of_week: editDay,
      period: editPeriod,
      subject_id: selectedSub.id,
      subject_name: selectedSub.name,
      teacher_name: editTeacherName || selectedSub.teacher_name,
      room: editRoom,
    };

    updated.push(newEntry);
    saveTimetableState(updated);
    setIsEditModalOpen(false);
    showToast(`Đã cập nhật Tiết ${editPeriod} (${days.find(d=>d.num===editDay)?.label}): ${selectedSub.name}`);
  };

  // DRAG & DROP HANDLERS
  const handleDragStart = (day: number, period: number, entry: TimetableEntry) => {
    setDraggedSlot({ day, period, entry });
  };

  const handleDragOver = (e: React.DragEvent, day: number, period: number) => {
    e.preventDefault();
    setDragOverTarget({ day, period });
  };

  const handleDrop = (targetDay: number, targetPeriod: number) => {
    if (!draggedSlot) return;
    const sourceDay = draggedSlot.day;
    const sourcePeriod = draggedSlot.period;

    if (sourceDay === targetDay && sourcePeriod === targetPeriod) {
      setDraggedSlot(null);
      setDragOverTarget(null);
      return;
    }

    const updated = [...timetable];
    const sourceIndex = updated.findIndex(t => t.day_of_week === sourceDay && t.period === sourcePeriod);
    const targetIndex = updated.findIndex(t => t.day_of_week === targetDay && t.period === targetPeriod);

    if (sourceIndex !== -1) {
      updated[sourceIndex] = {
        ...updated[sourceIndex],
        day_of_week: targetDay,
        period: targetPeriod,
      };
    }

    if (targetIndex !== -1) {
      updated[targetIndex] = {
        ...updated[targetIndex],
        day_of_week: sourceDay,
        period: sourcePeriod,
      };
    }

    saveTimetableState(updated);
    setDraggedSlot(null);
    setDragOverTarget(null);
    showToast(`Đã di chuyển môn học sang ${days.find(d=>d.num===targetDay)?.label} - Tiết ${targetPeriod}!`);
  };

  // ADD LESSON LOG HANDLERS
  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logLessonTitle.trim()) return;

    const selectedSub = subjectList.find(s => s.id === Number(logSubjectId)) || subjectList[0];

    const newLog: LessonLog = {
      id: Date.now(),
      class_id: selectedClass.id,
      log_date: logDate,
      period: Number(logPeriod),
      subject_name: selectedSub.name,
      lesson_title: logLessonTitle,
      teacher_name: selectedSub.teacher_name,
      conduct_notes: logConductNotes || 'Lớp trật tự, chuẩn bị bài tốt',
      homework_assigned: logHomework || 'Làm bài tập sách giáo khoa',
    };

    const updated = [newLog, ...lessonLogs];
    saveLessonLogsState(updated);
    setIsLogModalOpen(false);
    setLogLessonTitle('');
    setLogConductNotes('');
    setLogHomework('');
    showToast(`Đã ghi nhận Nhật ký Tiết ${logPeriod} môn ${selectedSub.name}!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#18243A] sm:text-3xl tracking-tight flex items-center gap-2">
            <Calendar className="h-7 w-7 text-[#6C63FF]" />
            Thời Khóa Biểu & Nhật Ký Tiết Học {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Quản lý thời khóa biểu giảng dạy, danh sách môn học & nhật ký theo dõi tiết học (Sổ đầu bài)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {activeTab === 'logs' && (
            <Button size="sm" variant="primary" onClick={() => setIsLogModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Ghi Nhật Ký Tiết Học
            </Button>
          )}
          {activeTab === 'subjects' && (
            <Button size="sm" variant="mint" onClick={handleOpenAddSubject} icon={<Plus className="h-4 w-4" />}>
              Thêm Môn Học Mới
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#E1E6F0] bg-white p-2 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('timetable')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors ${
            activeTab === 'timetable' ? 'bg-[#EEECFF] text-[#6C63FF]' : 'text-[#68758D] hover:bg-[#FAFBFF]'
          }`}
        >
          <Calendar className="h-4 w-4" /> Thời Khóa Biểu {selectedClass.name}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors ${
            activeTab === 'logs' ? 'bg-[#EEECFF] text-[#6C63FF]' : 'text-[#68758D] hover:bg-[#FAFBFF]'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Nhật Ký Tiết Học ({lessonLogs.length} buổi)
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors ${
            activeTab === 'subjects' ? 'bg-[#EEECFF] text-[#6C63FF]' : 'text-[#68758D] hover:bg-[#FAFBFF]'
          }`}
        >
          <BookMarked className="h-4 w-4" /> Quản Lý Danh Sách Môn Học ({subjectList.length})
        </button>
      </div>

      {/* TAB 1: DRAG & DROP TIMETABLE GRID */}
      {activeTab === 'timetable' && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#6C63FF]" />
              Thời Khóa Biểu Giảng Dạy (Kéo - Thả Hoặc Bấm Để Sửa)
            </h3>
            <Badge variant="mint">💡 Mẹo: Kéo ô môn học để đổi tiết nhanh</Badge>
          </div>

          <div className="overflow-x-auto border border-[#E1E6F0] rounded-2xl">
            <table className="w-full text-center text-xs text-[#18243A]">
              <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                <tr>
                  <th className="p-3 w-20">Tiết</th>
                  {days.map(d => (
                    <th key={d.num} className="p-3 font-black text-[#18243A]">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {periods.map(period => (
                  <tr key={period} className="hover:bg-[#FAFBFF]/50 transition-colors">
                    <td className="p-3 font-extrabold bg-[#FAFBFF] text-[#68758D] border-r border-[#E1E6F0]">
                      Tiết {period}
                    </td>

                    {days.map(day => {
                      const entry = timetable.find(t => t.day_of_week === day.num && t.period === period);
                      const isOver = dragOverTarget?.day === day.num && dragOverTarget?.period === period;

                      return (
                        <td
                          key={day.num}
                          onDragOver={(e) => handleDragOver(e, day.num, period)}
                          onDrop={() => handleDrop(day.num, period)}
                          className={`p-2 transition-all ${
                            isOver ? 'bg-[#EEECFF] border-2 border-dashed border-[#6C63FF]' : ''
                          }`}
                        >
                          {entry ? (
                            <div
                              draggable
                              onDragStart={() => handleDragStart(day.num, period, entry)}
                              onClick={() => handleOpenEditSlot(day.num, period)}
                              className="p-3 rounded-2xl border border-[#C0BBFD] bg-gradient-to-br from-[#EEECFF] to-[#E2DFFF] text-[#6C63FF] shadow-xs cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all group"
                            >
                              <div className="font-extrabold text-xs flex items-center justify-between">
                                <span>{entry.subject_name}</span>
                                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="text-[10px] text-[#68758D] font-bold mt-1 truncate">{entry.teacher_name}</div>
                              <div className="text-[9px] text-[#6C63FF] font-mono mt-0.5">{entry.room}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenEditSlot(day.num, period)}
                              className="w-full h-16 rounded-2xl border border-dashed border-[#E1E6F0] bg-[#FAFBFF] hover:bg-[#EEECFF]/40 text-[#68758D] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" /> Trống
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LESSON LOG (SỔ ĐẦU BÀI & ĐÁNH GIÁ GV BỘ MÔN) */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Section 1: Sổ đầu bài nhật ký tiết học */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#6C63FF]" />
                Sổ Đầu Bài & Ghi Nhận Nhật Ký Tiết Học ({lessonLogs.length} buổi)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="mint" onClick={() => setIsEvalModalOpen(true)} icon={<Award className="h-4 w-4" />}>
                  Đánh Giá Học Sinh (GV Bộ Môn)
                </Button>
                <Button size="sm" variant="primary" onClick={() => setIsLogModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
                  Ghi Nhật Ký Tiết Học
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {lessonLogs.map(log => (
                <div key={log.id} className="p-4 rounded-2xl border border-[#E1E6F0] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-[#6C63FF] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple">Tiết {log.period}</Badge>
                      <span className="font-extrabold text-[#18243A] text-sm">{log.subject_name}</span>
                      <span className="text-xs text-[#68758D] font-mono">({log.log_date})</span>
                    </div>
                    <div className="text-xs font-bold text-[#18243A]">Tên bài học: <span className="text-[#6C63FF]">{log.lesson_title}</span></div>
                    <div className="text-xs text-[#68758D] font-medium">Giáo viên: <strong>{log.teacher_name}</strong></div>
                    <div className="text-xs text-[#0E8360] font-semibold bg-[#E6F9F3] p-2 rounded-xl border border-[#A3F0D9] mt-1">
                      Chuyên cần & nề nếp: {log.conduct_notes} | Bài tập về nhà: {log.homework_assigned}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Đánh giá học sinh trong tiết dạy (Dành cho Giáo viên Bộ Môn) */}
          <div className="clay-card p-6 space-y-4 border-[#C0BBFD]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#F6B73C]" />
                  Nhật Ký Đánh Giá Học Sinh Trong Tiết Dạy ({teacherEvaluations.length} lượt)
                </h3>
                <p className="text-xs text-[#68758D] font-medium mt-0.5">
                  Giáo viên bộ môn trực tiếp ghi nhận phát biểu, bài tập xuất sắc hoặc nhắc nhở kỷ luật trong từng tiết học
                </p>
              </div>
              <Button size="sm" variant="mint" onClick={() => setIsEvalModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
                Thêm Đánh Giá
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teacherEvaluations.map(ev => (
                <div
                  key={ev.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 transition-all ${
                    ev.evaluation_type === 'praise'
                      ? 'bg-gradient-to-r from-[#F0FAF7] to-[#E6F9F3] border-[#A3F0D9]'
                      : 'bg-gradient-to-r from-[#FFF5F5] to-[#FFEFEF] border-[#FFC0C3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={ev.evaluation_type === 'praise' ? 'mint' : 'danger'}>
                          {ev.evaluation_type === 'praise' ? 'Tuyên dương' : 'Nhắc nhở'}
                        </Badge>
                        <span className="text-xs font-extrabold text-[#18243A]">{ev.subject_name} · Tiết {ev.period}</span>
                        <span className="text-[10px] text-[#68758D] font-mono">({ev.eval_date})</span>
                      </div>
                      <div className="font-extrabold text-[#18243A] text-sm mt-1">
                        {ev.student_name}
                      </div>
                    </div>
                    <div className={`text-sm font-black px-2.5 py-1 rounded-xl border ${
                      ev.points_impact > 0 ? 'bg-[#0E8360] text-white border-[#0E8360]' : 'bg-[#FF5D68] text-white border-[#FF5D68]'
                    }`}>
                      {ev.points_impact > 0 ? `+${ev.points_impact}` : ev.points_impact}đ
                    </div>
                  </div>

                  <div className="text-xs font-bold text-[#18243A]">
                    Tiêu chí: <span className={ev.evaluation_type === 'praise' ? 'text-[#0E8360]' : 'text-[#FF5D68]'}>{ev.category_title}</span>
                  </div>
                  <div className="text-xs text-[#4A5568] bg-white/80 p-2 rounded-xl border border-black/5 font-medium">
                    "{ev.comment}"
                  </div>
                  <div className="text-[10px] text-[#68758D] font-bold text-right">
                    Ghi nhận bởi: <strong>{ev.teacher_name}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBJECT MANAGEMENT (THÊM, SỬA, XÓA MÔN HỌC) */}
      {activeTab === 'subjects' && (
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-[#6C63FF]" />
              Danh Sách Môn Học Giảng Dạy Trong Trường
            </h3>
            <Button size="sm" variant="mint" onClick={handleOpenAddSubject} icon={<Plus className="h-4 w-4" />}>
              Thêm Môn Học Mới
            </Button>
          </div>

          <div className="overflow-x-auto border border-[#E1E6F0] rounded-2xl">
            <table className="w-full text-left text-xs text-[#18243A]">
              <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
                <tr>
                  <th className="p-3">Mã môn</th>
                  <th className="p-3">Tên môn học</th>
                  <th className="p-3">Giáo viên phụ trách</th>
                  <th className="p-3">Số điện thoại GVBM</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {subjectList.map(sub => (
                  <tr key={sub.id} className="hover:bg-[#FAFBFF] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#6C63FF]">{sub.code}</td>
                    <td className="p-3 font-extrabold text-[#18243A] text-sm">{sub.name}</td>
                    <td className="p-3 font-bold text-[#68758D]">{sub.teacher_name}</td>
                    <td className="p-3 font-mono text-xs font-bold text-[#0E8360]">
                      {sub.teacher_phone ? (
                        <a href={`tel:${sub.teacher_phone}`} className="hover:underline inline-flex items-center gap-1.5 bg-[#E6F9F3] px-2.5 py-1 rounded-xl border border-[#A3F0D9]">
                          <Phone className="h-3 w-3 text-[#0E8360]" />
                          {sub.teacher_phone}
                        </a>
                      ) : (
                        <span className="text-[#68758D] font-normal italic">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEditSubject(sub)} icon={<Edit className="h-3.5 w-3.5" />}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteSubject(sub.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>
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

      {/* MODAL EDIT TIMETABLE SLOT */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Sửa Tiết Học: ${days.find(d=>d.num===editDay)?.label} - Tiết ${editPeriod}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveSlotSubmit} icon={<CheckCircle className="h-4 w-4" />}>Lưu tiết học</Button>
          </>
        }
      >
        <form onSubmit={handleSaveSlotSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Chọn môn học:</label>
            <select
              value={editSubjectId}
              onChange={(e) => {
                const subId = Number(e.target.value);
                setEditSubjectId(subId);
                const sub = subjectList.find(s => s.id === subId);
                if (sub) setEditTeacherName(sub.teacher_name);
              }}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-extrabold text-[#18243A] bg-white focus:border-[#6C63FF]"
            >
              {subjectList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.teacher_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Giáo viên giảng dạy:</label>
            <input
              type="text"
              required
              value={editTeacherName}
              onChange={(e) => setEditTeacherName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Phòng học:</label>
            <input
              type="text"
              required
              value={editRoom}
              onChange={(e) => setEditRoom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-mono font-bold text-[#6C63FF]"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL ADD / EDIT SUBJECT */}
      <Modal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? `Chỉnh Sửa Môn Học: ${editingSubject.name}` : 'Thêm Môn Học Mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSubjectModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveSubjectSubmit} icon={<CheckCircle className="h-4 w-4" />}>Lưu môn học</Button>
          </>
        }
      >
        <form onSubmit={handleSaveSubjectSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mã môn học (VD: TOAN, HOA, KHTN):</label>
            <input
              type="text"
              required
              value={subCodeInput}
              onChange={(e) => setSubCodeInput(e.target.value)}
              placeholder="TOAN"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-mono font-bold uppercase text-[#6C63FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên môn học đầy đủ:</label>
            <input
              type="text"
              required
              value={subNameInput}
              onChange={(e) => setSubNameInput(e.target.value)}
              placeholder="Khoa học tự nhiên..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-extrabold text-[#18243A]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Giáo viên bộ môn phụ trách:</label>
            <input
              type="text"
              required
              value={subTeacherInput}
              onChange={(e) => setSubTeacherInput(e.target.value)}
              placeholder="Thầy Nguyễn Văn A"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Số điện thoại GVBM:</label>
            <input
              type="tel"
              value={subPhoneInput}
              onChange={(e) => setSubPhoneInput(e.target.value)}
              placeholder="0981234567..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-mono font-bold text-[#18243A]"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL ADD LESSON LOG */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Ghi Nhật Ký Tiết Học (Sổ Đầu Bài)"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Hủy</Button>
            <Button onClick={handleAddLogSubmit} icon={<Plus className="h-4 w-4" />}>Lưu nhật ký</Button>
          </>
        }
      >
        <form onSubmit={handleAddLogSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Ngày học:</label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tiết thứ:</label>
              <select
                value={logPeriod}
                onChange={(e) => setLogPeriod(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
              >
                {periods.map(p => <option key={p} value={p}>Tiết {p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Môn học:</label>
            <select
              value={logSubjectId}
              onChange={(e) => setLogSubjectId(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-extrabold text-[#18243A] bg-white"
            >
              {subjectList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.teacher_name})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên bài học / Nội dung giảng dạy:</label>
            <input
              type="text"
              required
              value={logLessonTitle}
              onChange={(e) => setLogLessonTitle(e.target.value)}
              placeholder="VD: Bài 5 - Phương trình bậc hai..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Ghi chú chuyên cần & nề nếp lớp:</label>
            <input
              type="text"
              value={logConductNotes}
              onChange={(e) => setLogConductNotes(e.target.value)}
              placeholder="Lớp trật tự, 100% thuộc bài..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Bài tập về nhà dặn dò:</label>
            <input
              type="text"
              value={logHomework}
              onChange={(e) => setLogHomework(e.target.value)}
              placeholder="Làm bài 1, 2 trang 45 sách giáo khoa..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-medium"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL SUBJECT TEACHER STUDENT EVALUATION */}
      <Modal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        title="Ghi Nhận Đánh Giá Học Sinh Trong Tiết Dạy (GV Bộ Môn)"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEvalModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEvaluationSubmit} icon={<CheckCircle className="h-4 w-4" />}>Lưu đánh giá</Button>
          </>
        }
      >
        <form onSubmit={handleSaveEvaluationSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Ngày dạy:</label>
              <input
                type="date"
                required
                value={evalDate}
                onChange={(e) => setEvalDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tiết dạy:</label>
              <select
                value={evalPeriod}
                onChange={(e) => setEvalPeriod(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold bg-white"
              >
                {periods.map(p => <option key={p} value={p}>Tiết {p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Môn học bộ môn:</label>
              <select
                value={evalSubjectId}
                onChange={(e) => setEvalSubjectId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-extrabold text-[#18243A] bg-white"
              >
                {subjectList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.teacher_name})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Chọn học sinh được đánh giá:</label>
              <select
                value={evalStudentId}
                onChange={(e) => setEvalStudentId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-extrabold text-[#18243A] bg-white"
              >
                {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Loại ghi nhận đánh giá:</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setEvalType('praise');
                  setEvalCategoryTitle('Hăng hái phát biểu xây dựng bài');
                  setEvalPoints(2);
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  evalType === 'praise'
                    ? 'bg-[#E6F9F3] text-[#0E8360] border-[#0E8360] shadow-2xs'
                    : 'bg-white text-[#68758D] border-[#E1E6F0]'
                }`}
              >
                <ThumbsUp className="h-4 w-4 text-[#0E8360]" /> Tuyên dương / Thưởng điểm
              </button>
              <button
                type="button"
                onClick={() => {
                  setEvalType('reminder');
                  setEvalCategoryTitle('Chưa chuẩn bị bài / Nhắc nhở kỷ luật');
                  setEvalPoints(2);
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  evalType === 'reminder'
                    ? 'bg-[#FFEFEF] text-[#FF5D68] border-[#FF5D68] shadow-2xs'
                    : 'bg-white text-[#68758D] border-[#E1E6F0]'
                }`}
              >
                <AlertCircle className="h-4 w-4 text-[#FF5D68]" /> Nhắc nhở / Trừ điểm
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Tiêu chí / Nội dung vắn tắt:</label>
              <input
                type="text"
                required
                value={evalCategoryTitle}
                onChange={(e) => setEvalCategoryTitle(e.target.value)}
                placeholder="VD: Giơ tay phát biểu sôi nổi..."
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Số điểm cộng / trừ (1-5đ):</label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={evalPoints}
                onChange={(e) => setEvalPoints(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nhận xét chi tiết của GV bộ môn:</label>
            <textarea
              rows={3}
              value={evalComment}
              onChange={(e) => setEvalComment(e.target.value)}
              placeholder="Nhập ghi chú chi tiết về biểu hiện của học sinh trong tiết học..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-medium"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

