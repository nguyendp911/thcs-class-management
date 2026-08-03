import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockAnnouncements } from '../lib/mockData';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CalendarCheck, MessageSquare, Plus } from 'lucide-react';

export const ParentPortalPage: React.FC = () => {
  const { selectedClass, studentsList: students } = useAuth();
  const child = students[0] || { full_name: 'Con em học sinh', class_name: selectedClass.name };
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">Cổng Thông Tin Phụ Huynh</span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">Con: {child.full_name} ({selectedClass.name})</h1>
          <p className="text-xs text-slate-600 mt-0.5">Sĩ số lớp: {selectedClass.student_count} học sinh | GVCN: {selectedClass.homeroom_teacher_name}</p>
        </div>

        <Button size="sm" onClick={() => setIsLeaveModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
          Gửi đơn xin nghỉ học cho con
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-brand-500" />
            Tóm tắt Chuyên cần & Học tập của con
          </h3>
          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>Hôm nay:</span>
              <span className="font-bold text-emerald-700">Có mặt</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>ĐTB môn Toán kỳ này:</span>
              <span className="font-bold text-brand-700">8.5 / 10</span>
            </div>
            <div className="flex justify-between">
              <span>Xếp loại rèn luyện:</span>
              <span className="font-bold text-purple-700">Tốt (+5 điểm thi đua)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-500" />
            Thông báo mới nhất từ GVCN
          </h3>
          {mockAnnouncements.map(a => (
            <div key={a.id} className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs">
              <div className="font-bold text-slate-800">{a.title}</div>
              <div className="text-slate-600 mt-1 text-[11px]" dangerouslySetInnerHTML={{ __html: a.body_html }} />
              <div className="mt-2 text-right">
                <Button size="sm" variant="outline" onClick={() => alert('Đã gửi xác nhận đọc thông báo!')}>
                  Đã đọc & Xác nhận tham gia
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Gửi đơn xin nghỉ học"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(false)}>Hủy</Button>
            <Button onClick={() => { alert('Đã gửi đơn xin nghỉ thành công tới GVCN!'); setIsLeaveModalOpen(false); }}>
              Gửi đơn
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Ngày xin nghỉ:</label>
            <input type="date" defaultValue="2026-08-01" className="mt-1 w-full rounded border border-slate-300 p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Lý do nghỉ (bắt buộc):</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do nghỉ học..."
              className="mt-1 w-full rounded border border-slate-300 p-2 text-xs focus:border-brand-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
