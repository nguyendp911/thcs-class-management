import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockIncidents as initialIncidents } from '../lib/mockData';
import type { Incident } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const { selectedClass } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Report Incident
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [incidentDate, setIncidentDate] = useState('2026-07-31');
  const [severity, setSeverity] = useState<any>('medium');
  const [location, setLocation] = useState('Sân trường');
  const [studentNamesStr, setStudentNamesStr] = useState('');
  const [description, setDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newInc: Incident = {
      id: incidents.length + 1,
      title,
      incident_date: incidentDate,
      occurred_at: `${incidentDate} 10:15`,
      severity,
      location,
      status: 'OPEN',
      student_names: studentNamesStr.split(',').map(s => s.trim()),
      description,
    };

    setIncidents([newInc, ...incidents]);
    setIsAddModalOpen(false);
    showToast(`Đã báo cáo sự cố "${newInc.title}" thành công!`);

    setTitle('');
    setDescription('');
  };

  const resolveIncident = (id: number) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        showToast('Đã đánh dấu giải quyết xong sự cố!');
        return { ...inc, status: 'RESOLVED' as const };
      }
      return inc;
    }));
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
            <AlertTriangle className="h-7 w-7 text-[#FF5D68]" />
            Báo Cáo Sự Cố & Kỷ Luật {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Ghi nhận các sự cố bất thường, vi phạm nội quy & theo dõi quy trình xử lý kỷ luật
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="danger" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Báo cáo sự cố mới
          </Button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map(inc => (
          <div key={inc.id} className="clay-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={inc.severity === 'high' || inc.severity === 'critical' ? 'danger' : 'warning'}>
                  {inc.severity.toUpperCase()}
                </Badge>
                <h3 className="text-base font-extrabold text-[#18243A]">{inc.title}</h3>
              </div>
              <Badge variant={inc.status === 'RESOLVED' ? 'mint' : 'danger'}>
                {inc.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đang xử lý'}
              </Badge>
            </div>

            <p className="text-xs text-[#68758D] font-medium leading-relaxed">{inc.description}</p>

            <div className="pt-3 border-t border-[#E1E6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div><span className="text-[#68758D] font-bold">Học sinh liên quan:</span> <strong className="text-[#6C63FF]">{inc.student_names.join(', ')}</strong></div>
                <div><span className="text-[#68758D] font-bold">Địa điểm & Ngày xảy ra:</span> <strong className="text-[#18243A]">{inc.location || 'Sân trường'} ({inc.incident_date})</strong></div>
              </div>

              {inc.status !== 'RESOLVED' && (
                <Button size="sm" variant="mint" onClick={() => resolveIncident(inc.id)}>
                  Xác nhận Đã giải quyết
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Report Incident */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Báo Cáo Sự Cố / Vi Phạm Kỷ Luật Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateIncident} variant="danger" icon={<Plus className="h-4 w-4" />}>
              Báo cáo sự cố
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateIncident} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tên tiêu đề sự cố:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Xung đột xô xát nhẹ trong giờ ra chơi"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mức độ nghiêm trọng:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Khẩn cấp (Nghiêm trọng)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Ngày xảy ra:</label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Địa điểm xảy ra:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Sân trường / Phòng 201"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Học sinh liên quan (cách nhau bởi dấu phẩy):</label>
            <input
              type="text"
              value={studentNamesStr}
              onChange={(e) => setStudentNamesStr(e.target.value)}
              placeholder="VD: Nguyễn Văn Minh Anh, Phạm Minh Đạt"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Diễn biến sự việc & Phương án hòa giải:</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết sự việc xảy ra..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
