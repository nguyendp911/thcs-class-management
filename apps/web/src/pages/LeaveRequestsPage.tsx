import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveToDb, syncAllFromDb } from '../lib/dbSync';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { CheckCircle, XCircle, Plus, FileText } from 'lucide-react';

export const LeaveRequestsPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    syncAllFromDb().then(data => {
      if (data && data.thcs_leave_requests && Array.isArray(data.thcs_leave_requests)) {
        setRequests(data.thcs_leave_requests.filter((r: any) => !['Trần Thị Anh', 'Phạm Minh Đức', 'Nguyễn Văn Minh Anh'].includes(r.student_name)));
      }
    });
  }, []);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create New Leave Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [startsAtInput, setStartsAtInput] = useState('');
  const [endsAtInput, setEndsAtInput] = useState('');
  const [sessionScopeInput, setSessionScopeInput] = useState('cả ngày');
  const [reasonInput, setReasonInput] = useState('');

  const displayName = currentUser?.name ? currentUser.name.replace(/\s*\([^)]*\)/g, '') : 'Học sinh';

  useEffect(() => {
    if (currentRole === 'student' || currentRole === 'parent') {
      setStudentNameInput(displayName);
    }
  }, [currentRole, displayName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveRequests = (updated: any[]) => {
    setRequests(updated);
    saveToDb('thcs_leave_requests', updated);
  };

  const handleApprove = (id: number) => {
    const updated = requests.map((r: any) => r.id === id ? { ...r, status: 'APPROVED', review_note: 'Đã phê duyệt đơn xin nghỉ.' } : r);
    saveRequests(updated);
    showToast('🎉 Đã phê duyệt đơn xin nghỉ học thành công!');
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNote.trim()) {
      alert('Vui lòng nhập lý do từ chối đơn xin nghỉ!');
      return;
    }

    const updated = requests.map((r: any) => r.id === selectedRequest?.id ? { ...r, status: 'REJECTED', review_note: reviewNote } : r);
    saveRequests(updated);
    setIsRejectModalOpen(false);
    setReviewNote('');
    showToast('Đã từ chối đơn xin nghỉ học.');
  };

  const handleCreateLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonInput.trim()) {
      alert('Vui lòng nhập lý do xin nghỉ học.');
      return;
    }

    const newRequest = {
      id: Date.now(),
      student_id: 1,
      student_name: studentNameInput || displayName,
      guardian_name: currentRole === 'parent' ? displayName : 'Học sinh tự nộp / PH xác nhận',
      guardian_phone: '0901234567',
      starts_at: startsAtInput || new Date().toISOString().slice(0, 10),
      ends_at: endsAtInput || startsAtInput || new Date().toISOString().slice(0, 10),
      session_scope: sessionScopeInput,
      reason: reasonInput,
      status: 'PENDING',
      submitted_at: 'Vừa xong',
    };

    const updated = [newRequest, ...requests];
    saveRequests(updated);
    setIsCreateModalOpen(false);
    setReasonInput('');
    showToast('🎉 Đã gửi đơn xin nghỉ học thành công lên Thầy cô chủ nhiệm!');
  };

  const isTeacherOrAdmin = currentRole === 'homeroom_teacher' || currentRole === 'admin' || currentRole === 'superadmin';

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
            <FileText className="h-7 w-7 text-[#6C63FF]" />
            Quản Lý & Nộp Đơn Xin Nghỉ Học
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Gửi đơn xin nghỉ học trực tuyến dành cho Học sinh & Phụ huynh, xem phê duyệt từ Giáo viên chủ nhiệm
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            ➕ Tạo Đơn Xin Nghỉ Học Mới
          </Button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((r: any) => (
          <div key={r.id} className="clay-card p-5 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'APPROVED' ? 'mint' : r.status === 'PENDING' ? 'warning' : 'danger'}>
                  {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                </Badge>
                <span className="font-extrabold text-[#18243A] text-sm">{r.student_name}</span>
                <span className="text-xs text-[#6C63FF] font-bold">({r.session_scope})</span>
              </div>

              <p className="text-xs text-[#18243A] font-semibold leading-relaxed">Lý do nghỉ: {r.reason}</p>

              <div className="text-[11px] text-[#68758D] font-bold flex flex-wrap items-center gap-4 pt-1">
                <span>Thời gian: <strong className="text-[#18243A] font-mono">{r.starts_at}</strong> đến <strong className="text-[#18243A] font-mono">{r.ends_at}</strong></span>
                <span>Người nộp/PH: <strong className="text-[#18243A]">{r.guardian_name}</strong> ({r.guardian_phone})</span>
              </div>

              {r.review_note && (
                <div className="text-[11px] font-bold text-[#6C63FF] bg-[#EEECFF] p-2.5 rounded-xl border border-[#C0BBFD] mt-2">
                  Phản hồi từ Thầy cô: {r.review_note}
                </div>
              )}
            </div>

            {/* Approve / Reject buttons for Teachers/Admin ONLY */}
            {isTeacherOrAdmin && r.status === 'PENDING' && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedRequest(r); setIsRejectModalOpen(true); }}
                  icon={<XCircle className="h-4 w-4 text-[#FF5D68]" />}
                >
                  Từ chối
                </Button>

                <Button
                  size="sm"
                  variant="mint"
                  onClick={() => handleApprove(r.id)}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Phê duyệt đơn
                </Button>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="clay-card p-8 text-center space-y-2 border-[#E1E6F0] bg-white">
            <p className="text-xs font-extrabold text-[#0E8360]">
              ✓ Hiện chưa có đơn xin nghỉ học nào. Nhấn "+ Tạo Đơn Xin Nghỉ Học" để nộp đơn mới.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NEW LEAVE REQUEST MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="📝 Nộp Đơn Xin Nghỉ Học Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button onClick={handleCreateLeaveSubmit} icon={<Plus className="h-4 w-4" />}>
              Gửi đơn xin nghỉ
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateLeaveSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Họ và tên học sinh xin nghỉ:</label>
            <input
              type="text"
              required
              value={studentNameInput}
              onChange={(e) => setStudentNameInput(e.target.value)}
              placeholder="Nhập tên học sinh..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Từ ngày:</label>
              <input
                type="date"
                required
                value={startsAtInput}
                onChange={(e) => setStartsAtInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Đến ngày:</label>
              <input
                type="date"
                required
                value={endsAtInput}
                onChange={(e) => setEndsAtInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Thời gian nghỉ:</label>
            <select
              value={sessionScopeInput}
              onChange={(e) => setSessionScopeInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold text-[#18243A] bg-white focus:border-[#6C63FF] focus:outline-none"
            >
              <option value="cả ngày">Cả ngày</option>
              <option value="buổi sáng">Nửa ngày (Buổi Sáng)</option>
              <option value="buổi chiều">Nửa ngày (Buổi Chiều)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Lý do xin nghỉ học (Chi tiết):</label>
            <textarea
              rows={3}
              required
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="Ghi rõ lý do (ví dụ: Sốt cao, gia đình có việc bận...)"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-semibold text-[#18243A] focus:border-[#6C63FF] focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* REJECT REASON MODAL */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ chối Đơn xin nghỉ học"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Hủy</Button>
            <Button variant="danger" onClick={handleRejectSubmit}>
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <form onSubmit={handleRejectSubmit} className="space-y-3">
          <label className="block text-xs font-extrabold text-[#18243A]">Lý do từ chối (bắt buộc):</label>
          <textarea
            rows={3}
            required
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Nhập lý do phản hồi cho học sinh & phụ huynh..."
            className="w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-semibold focus:border-[#6C63FF] focus:outline-none"
          />
        </form>
      </Modal>
    </div>
  );
};
