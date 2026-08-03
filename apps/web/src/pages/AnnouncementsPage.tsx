import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveToDb } from '../lib/dbSync';
import { mockAnnouncements as initialAnnouncements } from '../lib/mockData';
import type { Announcement } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { MessageSquare, Plus, CheckCircle } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { selectedClass, currentUser } = useAuth();
  const classId = selectedClass?.id || 0;
  const className = selectedClass?.name || 'Lớp học';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'bình thường' | 'quan trọng' | 'khẩn cấp'>('khẩn cấp');
  const [content, setContent] = useState('');

  // Load announcements for currently selected class
  useEffect(() => {
    const key = `thcs_announcements_class_${classId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setAnnouncements(JSON.parse(saved));
        return;
      }
    } catch (e) {}

    // Fallback default announcements scoped to class
    const defaults = initialAnnouncements.map(a => ({
      ...a,
      title: a.title.replace(/Lớp \d+A\d+/, className),
    }));
    setAnnouncements(defaults);
  }, [classId, className]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: Announcement = {
      id: Date.now(),
      title,
      body_html: `<p>${content}</p>`,
      priority,
      author_name: currentUser?.name || selectedClass.homeroom_teacher_name || 'GVCN',
      published_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read_count: 1,
      ack_count: 1,
      total_recipients: selectedClass.student_count || 45,
    };

    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);

    // Save persistently to LocalStorage & MySQL Database
    saveToDb(`thcs_announcements_class_${classId}`, updated);
    window.dispatchEvent(new CustomEvent('thcs_announcement_created', { detail: { classId, announcement: newAnn } }));

    setIsAddModalOpen(false);
    showToast(`✓ Đã tạo và phát thông báo mới "${newAnn.title}" cho ${className} thành công!`);

    setTitle('');
    setContent('');
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
            <MessageSquare className="h-7 w-7 text-[#6C63FF]" />
            Thông báo & Phản hồi ({className})
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Đăng thông báo chính thức của {className} và theo dõi tỷ lệ học sinh / phụ huynh đã đọc & xác nhận
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
            📢 Đăng thông báo mới cho {className}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="clay-card p-6 space-y-3 border-[#E1E6F0] bg-white hover:border-[#6C63FF] transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant={ann.priority === 'khẩn cấp' ? 'danger' : ann.priority === 'quan trọng' ? 'purple' : 'info'}>
                  {(ann.priority || 'bình thường').toUpperCase()}
                </Badge>
                <h3 className="text-base font-extrabold text-[#18243A]">{ann.title}</h3>
              </div>
              <span className="text-xs font-bold text-[#68758D] font-mono">{ann.published_at}</span>
            </div>

            <div className="text-xs text-[#18243A] font-medium leading-relaxed bg-[#FAFBFF] p-3 rounded-xl border border-[#E1E6F0]" dangerouslySetInnerHTML={{ __html: ann.body_html }}></div>

            <div className="pt-3 border-t border-[#E1E6F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#68758D]">
                Đăng bởi: <strong className="text-[#6C63FF] font-extrabold">{ann.author_name}</strong> • <span className="text-[#0E8360] font-semibold">Công khai {className}</span>
              </span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#68758D]">Đã đọc: <strong className="text-[#18243A] font-mono">{ann.read_count}/{ann.total_recipients}</strong></span>
                <span className="font-bold text-[#0E8360] bg-[#E6F9F3] px-2.5 py-1 rounded-full border border-[#A3F0D9] font-mono">
                  Đã xác nhận: {ann.ack_count}/{ann.total_recipients}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`📢 Tạo Thông Báo Mới Cho ${className}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateAnnouncement} icon={<Plus className="h-4 w-4" />}>
              Phát Thông Báo Cho {className}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Lớp phát hành thông báo:</label>
            <input
              type="text"
              disabled
              value={`${className} (Sĩ số: ${selectedClass.student_count || 45} học sinh)`}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] bg-[#FAFBFF] p-2.5 text-xs font-black text-[#6C63FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tiêu đề thông báo:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo (VD: Nhắc nhở nộp lệ phí ôn tập, Lịch họp PHHS...)"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mức độ ưu tiên:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
            >
              <option value="khẩn cấp">🚨 Khẩn cấp (Hiện nổi bật trên Trang Tổng Quan)</option>
              <option value="quan trọng">⭐ Quan trọng</option>
              <option value="bình thường">ℹ️ Thông thường</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nội dung chi tiết thông báo:</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo đầy đủ cho phụ huynh và học sinh..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
