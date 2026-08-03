import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockAnnouncements as initialAnnouncements } from '../lib/mockData';
import type { Announcement } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { MessageSquare, Plus, CheckCircle } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { selectedClass } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<any>('bình thường');
  const [content, setContent] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn: Announcement = {
      id: announcements.length + 1,
      title,
      body_html: `<p>${content}</p>`,
      priority,
      author_name: 'Cô Trần Thị Minh Hương',
      published_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read_count: 1,
      ack_count: 1,
      total_recipients: selectedClass.student_count,
    };

    setAnnouncements([newAnn, ...announcements]);
    setIsAddModalOpen(false);
    showToast(`Đã đăng thông báo mới "${newAnn.title}" thành công!`);

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
            Thông báo & Phản hồi {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Đăng thông báo tin nhắn rich-text và theo dõi tỷ lệ học sinh / phụ huynh đã đọc & xác nhận
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Đăng thông báo mới
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="clay-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={ann.priority === 'khẩn cấp' ? 'danger' : 'purple'}>
                  {ann.priority.toUpperCase()}
                </Badge>
                <h3 className="text-base font-extrabold text-[#18243A]">{ann.title}</h3>
              </div>
              <span className="text-xs font-bold text-[#68758D]">{ann.published_at}</span>
            </div>

            <div className="text-xs text-[#68758D] font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: ann.body_html }}></div>

            <div className="pt-3 border-t border-[#E1E6F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#68758D]">Đăng bởi: <strong className="text-[#6C63FF]">{ann.author_name}</strong></span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#68758D]">Đã đọc: <strong className="text-[#18243A]">{ann.read_count}/{ann.total_recipients}</strong></span>
                <span className="font-bold text-[#0E8360] bg-[#E6F9F3] px-2.5 py-1 rounded-full border border-[#A3F0D9]">
                  Đã xác nhận: {ann.ack_count}/{ann.total_recipients}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Announcement */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo Thông Báo Mới Cho Lớp 7A1"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateAnnouncement} icon={<Plus className="h-4 w-4" />}>Đăng thông báo</Button>
          </>
        }
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tiêu đề thông báo:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thông báo Lịch họp Phụ huynh Đầu học kỳ II"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mức độ ưu tiên:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
            >
              <option value="bình thường">Bình thường</option>
              <option value="quan trọng">Quan trọng</option>
              <option value="khẩn cấp">Khẩn cấp (Yêu cầu xác nhận ngay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Nội dung thông báo chi tiết:</label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo gửi đến toàn bộ phụ huynh và học sinh..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
