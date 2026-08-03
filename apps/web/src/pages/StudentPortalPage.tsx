import React from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTasks } from '../lib/mockData';
import { Badge } from '../components/ui/Badge';
import { BookOpen, CheckSquare } from 'lucide-react';

export const StudentPortalPage: React.FC = () => {
  const { selectedClass, studentsList: students } = useAuth();
  const student = students[0] || { full_name: 'Học sinh cá nhân', class_name: selectedClass.name, group_name: 'Tổ 1', student_code: 'HS001' };

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-6 shadow-xs">
        <span className="text-[10px] font-extrabold uppercase text-sky-700 tracking-wider">Cổng Thông Tin Học Sinh</span>
        <h1 className="text-xl font-extrabold text-slate-900 mt-1">Xin chào, {student.full_name}!</h1>
        <p className="text-xs text-slate-600 mt-0.5">Lớp: {selectedClass.name} | {student.group_name || 'Tổ 1'} | Mã HS: {student.student_code}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-brand-500" />
            Nhiệm vụ được giao
          </h3>
          {mockTasks.map(t => (
            <div key={t.id} className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{t.title}</span>
                <Badge variant="info">{t.status}</Badge>
              </div>
              <p className="text-slate-600 text-[11px]">{t.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-500" />
            Thời khóa biểu hôm nay (Thứ 6)
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span>Tiết 1: <strong>Toán học</strong></span>
              <span className="text-slate-400">Phòng 201</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span>Tiết 2: <strong>Ngữ văn</strong></span>
              <span className="text-slate-400">Phòng 201</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span>Tiết 3: <strong>Tiếng Anh</strong></span>
              <span className="text-slate-400">Phòng 201</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
