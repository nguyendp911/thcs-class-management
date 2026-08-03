import React, { useState, useEffect } from 'react';
import { saveToDb } from '../../lib/dbSync';
import { Modal } from './Modal';
import { Button } from './Button';
import { Plus, Trash2, Edit } from 'lucide-react';

export interface ExamEvent {
  id: number;
  title: string;
  targetDate: string; // YYYY-MM-DD
  badgeColor: string;
  icon: string;
  scope: string;
}

const DEFAULT_EVENTS: ExamEvent[] = [
  {
    id: 1,
    title: 'Thi Khảo Sát Đầu Năm 2026',
    targetDate: '2026-08-25',
    badgeColor: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]',
    icon: 'fa-award text-[#6C63FF]',
    scope: 'Khối 6-9'
  },
  {
    id: 2,
    title: 'Thi Giữa Kỳ I Toàn Trường',
    targetDate: '2026-10-20',
    badgeColor: 'bg-[#FFEFEF] text-[#FF5D68] border-[#FFC0C3]',
    icon: 'fa-graduation-cap text-[#FF5D68]',
    scope: 'Khối 6-9'
  },
  {
    id: 3,
    title: 'Kỷ Niệm Ngày Nhà Giáo VN 20/11',
    targetDate: '2026-11-20',
    badgeColor: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]',
    icon: 'fa-flag text-[#22C997]',
    scope: 'Toàn trường'
  },
  {
    id: 4,
    title: 'Thi Học Kỳ I Năm Học 2026-2027',
    targetDate: '2026-12-25',
    badgeColor: 'bg-[#FFF9EB] text-[#B47800] border-[#FFE399]',
    icon: 'fa-star text-[#F6B73C]',
    scope: 'Khối 6-9'
  }
];

export const ExamCountdownWidget: React.FC = () => {
  const [events, setEvents] = useState<ExamEvent[]>([]);

  // Modal edit / add event state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ExamEvent | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventScope, setEventScope] = useState('Toàn trường');

  // Load events & auto-upgrade past default events
  useEffect(() => {
    try {
      const saved = localStorage.getItem('thcs_exam_countdown_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if all events are past (0 days left)
          const todayStr = new Date().toISOString().split('T')[0];
          const hasFuture = parsed.some((e: ExamEvent) => e.targetDate >= todayStr);
          if (hasFuture) {
            setEvents(parsed);
            return;
          }
        }
      }
    } catch (e) {}

    // Fallback to fresh future default events
    setEvents(DEFAULT_EVENTS);
    saveToDb('thcs_exam_countdown_events', DEFAULT_EVENTS);
  }, []);

  const saveEventsList = (updated: ExamEvent[]) => {
    setEvents(updated);
    saveToDb('thcs_exam_countdown_events', updated);
  };

  // Dynamic remaining days calculation logic
  const getDaysLeftInfo = (targetDateStr: string) => {
    if (!targetDateStr) return { diffDays: 0, label: 'Còn 0 ngày', isPast: false, isToday: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = targetDateStr.split('-').map(Number);
    const target = new Date(year, (month || 1) - 1, day || 1);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { diffDays, label: `Còn ${diffDays} ngày`, isPast: false, isToday: false };
    } else if (diffDays === 0) {
      return { diffDays: 0, label: `🔥 Hôm nay`, isPast: false, isToday: true };
    } else {
      return { diffDays, label: `✅ Đã diễn ra`, isPast: true, isToday: false };
    }
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setEventTitle('');
    // Default target date to 30 days from today
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setEventDate(defaultDate.toISOString().split('T')[0]);
    setEventScope('Toàn trường');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: ExamEvent) => {
    setEditingEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.targetDate);
    setEventScope(ev.scope || 'Toàn trường');
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: number) => {
    const updated = events.filter(e => e.id !== id);
    saveEventsList(updated);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    if (editingEvent) {
      const updated = events.map(ev => 
        ev.id === editingEvent.id 
          ? { ...ev, title: eventTitle, targetDate: eventDate, scope: eventScope }
          : ev
      );
      saveEventsList(updated);
    } else {
      const newEv: ExamEvent = {
        id: Date.now(),
        title: eventTitle,
        targetDate: eventDate,
        badgeColor: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]',
        icon: 'fa-calendar-check text-[#6C63FF]',
        scope: eventScope,
      };
      saveEventsList([...events, newEv]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="clay-card p-4 space-y-3 bg-white border border-[#E1E6F0] rounded-2xl">
      <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-2.5">
        <h2 className="text-sm font-extrabold text-[#18243A] flex items-center gap-1.5">
          <span className="text-base">⏳</span>
          Lịch Thi & Sự Kiện Đếm Ngược
        </h2>
        <button
          onClick={handleOpenAddModal}
          className="px-2.5 py-1 rounded-xl bg-[#EEECFF] hover:bg-[#DED9FF] border border-[#C0BBFD] text-[#6C63FF] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm sự kiện
        </button>
      </div>

      {/* Vertical Card List */}
      <div className="space-y-2.5">
        {events.map((ev) => {
          const daysInfo = getDaysLeftInfo(ev.targetDate);

          return (
            <div
              key={ev.id}
              className={`p-3 rounded-2xl border transition-all group ${
                daysInfo.isToday
                  ? 'bg-[#FFF9EB] border-[#FFE399] shadow-sm'
                  : daysInfo.isPast
                  ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-75'
                  : 'bg-[#FAFBFF] border-[#E1E6F0] hover:border-[#6C63FF]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${ev.badgeColor}`}>
                    <i className={`fa-solid ${ev.icon} text-xs`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-[#18243A] truncate">{ev.title}</div>
                    <div className="text-[10px] text-[#68758D] font-bold truncate flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-white border border-[#E1E6F0] text-[9px] font-extrabold">{ev.scope}</span>
                      <span>•</span>
                      <span className="font-mono text-[#475467]">{ev.targetDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl font-mono whitespace-nowrap border shadow-2xs ${
                      daysInfo.isToday
                        ? 'bg-[#FF5D68] text-white border-[#FF5D68] animate-pulse'
                        : daysInfo.isPast
                        ? 'bg-[#F1F5F9] text-[#64748B] border-[#CBD5E1]'
                        : 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]'
                    }`}
                  >
                    {daysInfo.label}
                  </span>
                  <button
                    onClick={() => handleOpenEditModal(ev)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#6C63FF] hover:bg-[#EEECFF] rounded transition-opacity cursor-pointer"
                    title="Sửa ngày"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#FF5D68] hover:bg-[#FFEFEF] rounded transition-opacity cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? '⚙️ Chỉnh Sửa Ngày Thi / Sự Kiện' : '➕ Thêm Lịch Thi / Sự Kiện Mới'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEvent} icon={<Plus className="h-4 w-4" />}>
              Lưu Sự Kiện
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên Kỳ Thi / Sự Kiện:</label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="VD: Thi Học Kỳ I, Thi Giữa Kỳ, Khai Giảng..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Ngày Diễn Ra Kỳ Thi / Sự Kiện:</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Phạm Vi Áp Dụng:</label>
            <select
              value={eventScope}
              onChange={(e) => setEventScope(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            >
              <option value="Toàn trường">Toàn trường</option>
              <option value="Khối 6-9">Khối 6-9</option>
              <option value="Khối 9">Khối 9</option>
              <option value="Khối 8">Khối 8</option>
              <option value="Đội - Đoàn">Đội - Đoàn</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
