import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AttendanceStatus } from '../types';
import { saveToDb } from '../lib/dbSync';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Lock, Unlock, Save, Search, CheckCircle, RefreshCw } from 'lucide-react';

import { removeVietnameseTones } from '../utils/accountUtils';
import { logActivity } from '../utils/logger';
import { QRScannerModal } from '../components/qr/QRScannerModal';
import { StudentIDCardModal } from '../components/qr/StudentIDCardModal';
import { UserAvatar } from '../components/ui/UserAvatar';
import { QrCode, Camera, Shuffle } from 'lucide-react';

const API_BASE = '/thcs/api/attendance';

export const AttendancePage: React.FC = () => {
  const { selectedClass, studentsList, currentUser, currentRole } = useAuth();
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<'morning' | 'afternoon'>('morning');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [records, setRecords] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  // QR Code & Camera Verification Modals State
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isQRCardModalOpen, setIsQRCardModalOpen] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<any | null>(null);
  const [isRandomAuditOpen, setIsRandomAuditOpen] = useState(false);
  const [randomAuditStudents, setRandomAuditStudents] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load attendance from MySQL when session changes
  const loadFromDB = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use POST with action=load to avoid query string routing issues
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'load',
          class_id: selectedClass?.id || 0,
          session_date: sessionDate,
          session_type: sessionType,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.records?.length > 0) {
          setRecords(json.data.records);
          setIsLocked(!!json.data.is_locked);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      // DB not reachable: fallback to studentsList
    }
    // Fallback to fresh session from studentsList
    const freshRecords = studentsList.map((s) => ({
      student_id: s.id,
      student_code: s.student_code,
      student_name: s.full_name,
      status: 'NOT_YET' as AttendanceStatus,
      note: '',
    }));
    setRecords(freshRecords);
    setIsLocked(false);
    setIsLoading(false);
  }, [selectedClass?.id || 0, sessionDate, sessionType, studentsList]);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  useEffect(() => {
    setIsLoading(false);
  }, [records]);

  const updateStatus = (studentId: number, status: AttendanceStatus) => {
    if (isLocked) return;
    setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    if (isLocked) return;
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleQRConfirmed = (studentId: string | number, status: 'PRESENT' | 'LATE' | 'REJECTED') => {
    if (status === 'REJECTED') return;
    setRecords(prev => prev.map(r => String(r.student_id) === String(studentId) ? {
      ...r,
      status: status === 'PRESENT' ? 'PRESENT' : 'LATE',
      method: 'QR_CAMERA',
      scanned_at: new Date().toLocaleTimeString('vi-VN'),
    } : r));
  };

  const handleOpenStudentCard = (studentRecord: any) => {
    const fullStudent = studentsList.find(s => String(s.id) === String(studentRecord.student_id)) || {
      id: studentRecord.student_id,
      full_name: studentRecord.student_name,
      student_code: studentRecord.student_code || `HS2025${studentRecord.student_id}`,
      class_id: selectedClass?.id,
      class_name: selectedClass?.name,
    };
    setSelectedStudentForCard(fullStudent as any);
    setIsQRCardModalOpen(true);
  };

  const handleTriggerRandomAudit = () => {
    const presentStudents = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE');
    if (presentStudents.length === 0) {
      showToast('⚠️ Chưa có học sinh nào được ghi nhận có mặt để kiểm tra ngẫu nhiên.');
      return;
    }
    const shuffled = [...presentStudents].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffled.length, Math.floor(Math.random() * 3) + 3);
    setRandomAuditStudents(shuffled.slice(0, count));
    setIsRandomAuditOpen(true);
  };

  const handleSaveAttendance = async (lockAfterSave = false) => {
    setIsSaving(true);
    const finalLocked = lockAfterSave ? true : isLocked;

    saveToDb(`thcs_today_attendance_${selectedClass?.id || 0}`, records);

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass?.id || 0,
          session_date: sessionDate,
          session_type: sessionType,
          is_locked: finalLocked,
          records: records,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (lockAfterSave) setIsLocked(true);
          setIsLockModalOpen(false);
          logActivity(
            currentUser?.name || 'Giáo viên',
            currentRole,
            'ĐIỂM DANH',
            `Lưu điểm danh ngày ${sessionDate} (${sessionType === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}) - Sĩ số ${records.length} học sinh`,
            String(selectedClass?.id || '')
          );
          showToast(`🎉 Đã lưu điểm danh ngày ${sessionDate} (${sessionType === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}) trực tiếp vào MySQL Database!`);
        } else {
          showToast('⚠️ Lỗi khi lưu: ' + (json.message || 'Không xác định'));
        }
      } else {
        showToast('⚠️ Lỗi kết nối tới máy chủ MySQL!');
      }
    } catch (e) {
      showToast('⚠️ Lỗi kết nối tới máy chủ MySQL!');
    }

    setIsSaving(false);
  };

  const filteredRecords = (records || []).filter(r => {
    if (!r) return false;
    const cleanSearch = removeVietnameseTones((searchTerm || '').trim().toLowerCase());
    if (!cleanSearch) return true;

    const nameNorm = removeVietnameseTones((r.student_name || '').toLowerCase());
    const codeNorm = removeVietnameseTones((r.student_code || `hs2025${r.student_id}` || '').toLowerCase());

    return nameNorm.includes(cleanSearch) || codeNorm.includes(cleanSearch);
  });

  const counts = {
    notYet:    records.filter(r => r.status === 'NOT_YET').length,
    present:   records.filter(r => r.status === 'PRESENT').length,
    excused:   records.filter(r => r.status === 'EXCUSED_ABSENCE').length,
    unexcused: records.filter(r => r.status === 'UNEXCUSED_ABSENCE').length,
    late:      records.filter(r => r.status === 'LATE').length,
    earlyLeave:records.filter(r => r.status === 'EARLY_LEAVE').length,
    truancy:   records.filter(r => r.status === 'TRUANCY').length,
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3.5 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-lg">
          <CheckCircle className="h-4 w-4 text-[#22C997] flex-shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
            Điểm danh {selectedClass.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Dữ liệu được lưu trực tiếp vào cơ sở dữ liệu MySQL. Mặc định toàn bộ <strong>Chưa điểm danh</strong> — hãy xác nhận trạng thái từng học sinh.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* Camera QR Scanning Hub Buttons */}
          <button
            type="button"
            onClick={() => setIsQRScannerOpen(true)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#5A50E6] text-white text-xs font-black shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Camera className="h-4 w-4" />
            Mở Camera Quét QR & Đối Chiếu Ảnh
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStudentForCard(null);
              setIsQRCardModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-[#E6F9F3] hover:bg-[#C9F2E5] border border-[#A3F0D9] text-[#0E8360] text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="h-4 w-4 text-[#0E8360]" />
            Thẻ QR & In Thẻ Học Sinh
          </button>

          <button
            type="button"
            onClick={handleTriggerRandomAudit}
            className="px-3.5 py-2 rounded-2xl bg-[#FFF9EB] hover:bg-[#FFE8B3] border border-[#FFE399] text-[#B47800] text-xs font-black shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="h-4 w-4 text-[#B47800]" />
            Kiểm Tra Ngẫu Nhiên (3-5 HS)
          </button>

          {isLocked ? (
            <Button variant="danger" size="sm"
              onClick={() => handleSaveAttendance(false).then(() => setIsLocked(false))}
              icon={<Unlock className="h-4 w-4" />}>
              Mở khóa buổi điểm danh
            </Button>
          ) : (
            <Button variant="outline" size="sm"
              onClick={() => setIsLockModalOpen(true)}
              icon={<Lock className="h-4 w-4" />}>
              Khóa buổi điểm danh
            </Button>
          )}
          <Button size="sm" variant="primary"
            onClick={() => handleSaveAttendance(false)}
            disabled={isSaving || isLoading}
            icon={isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            {isSaving ? 'Đang lưu...' : 'Lưu buổi điểm danh'}
          </Button>
        </div>
      </div>

      {/* Filters + Stats Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-brand-500"
          />
          <select
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as 'morning' | 'afternoon')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-brand-500"
          >
            <option value="morning">Buổi Sáng</option>
            <option value="afternoon">Buổi Chiều</option>
          </select>

          {/* Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên hoặc mã HS..."
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-2 text-xs font-bold text-slate-800 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {counts.notYet > 0 && <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 animate-pulse">⏳ Chưa điểm danh: {counts.notYet}</span>}
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Có mặt: {counts.present}</span>
          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">Vắng có phép: {counts.excused}</span>
          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">Vắng KP: {counts.unexcused}</span>
          <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">Đi muộn: {counts.late}</span>
          <span className="text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">Xin về: {counts.earlyLeave}</span>
          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">Cúp tiết: {counts.truancy}</span>
        </div>
      </div>

      {/* Bulk actions */}
      {!isLocked && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700">Đánh dấu hàng loạt:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => setAllStatus('NOT_YET' as AttendanceStatus)}>Đặt lại Chưa điểm danh</Button>
            <Button size="sm" variant="secondary" onClick={() => setAllStatus('PRESENT')}>Tất cả Có mặt</Button>
            <Button size="sm" variant="outline" onClick={() => setAllStatus('EXCUSED_ABSENCE')}>Tất cả Vắng phép</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> Đang tải dữ liệu điểm danh từ cơ sở dữ liệu...
        </div>
      )}

      {/* MOBILE Card Layout */}
      <div className="block sm:hidden rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredRecords.map((r, idx) => (
          <div key={r.student_id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>#{idx + 1} · {`HS2025${String(r.student_id).padStart(3, '0')}`}</span>
                  <button
                    onClick={() => handleOpenStudentCard(r)}
                    className="text-[10px] text-[#6C63FF] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="h-3 w-3" /> Thẻ QR
                  </button>
                </div>
                <div className="font-extrabold text-slate-900 text-sm leading-tight mt-0.5">{r.student_name}</div>
              </div>
              <div className={`flex-shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                r.status === 'NOT_YET' ? 'bg-slate-100 text-slate-600 border-slate-300 animate-pulse' :
                r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                r.status === 'EXCUSED_ABSENCE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                r.status === 'UNEXCUSED_ABSENCE' ? 'bg-red-50 text-red-700 border-red-200' :
                r.status === 'LATE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                r.status === 'EARLY_LEAVE' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                r.status === 'TRUANCY' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {r.status === 'NOT_YET' ? '⏳ Chưa điểm danh' :
                 r.status === 'PRESENT' ? '✓ Có mặt' :
                 r.status === 'EXCUSED_ABSENCE' ? 'Vắng có phép' :
                 r.status === 'UNEXCUSED_ABSENCE' ? 'Vắng KP' :
                 r.status === 'LATE' ? 'Đi muộn' :
                 r.status === 'EARLY_LEAVE' ? 'Xin về' :
                 r.status === 'TRUANCY' ? 'Cúp tiết' : 'Miễn phép'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {([
                ['NOT_YET', '⏳ Chưa ĐD', 'bg-slate-500'],
                ['PRESENT', '✓ Có mặt', 'bg-emerald-600'],
                ['EXCUSED_ABSENCE', 'Vắng phép', 'bg-amber-600'],
                ['UNEXCUSED_ABSENCE', 'Vắng KP', 'bg-red-600'],
                ['LATE', 'Đi muộn', 'bg-purple-600'],
                ['EARLY_LEAVE', 'Xin về', 'bg-sky-600'],
                ['TRUANCY', 'Cúp tiết', 'bg-rose-600'],
              ] as [AttendanceStatus, string, string][]).map(([s, label, activeClass]) => (
                <button key={s} disabled={isLocked}
                  onClick={() => updateStatus(r.student_id, s)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${r.status === s ? `${activeClass} text-white shadow-sm` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {r.status === 'LATE' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-slate-500 w-20 flex-shrink-0">Phút muộn</span>
                  <input type="number" defaultValue={r.minutes_late || 15} disabled={isLocked}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-center font-bold text-purple-700" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-500 w-20 flex-shrink-0">Ghi chú</span>
                <input type="text" defaultValue={r.note || ''} disabled={isLocked}
                  placeholder="Nhập ghi chú..." className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP Table Layout */}
      <div className="hidden sm:block rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3 w-28">Mã HS</th>
                <th className="p-3 min-w-[160px]">Họ và tên</th>
                <th className="p-3 min-w-[380px]">Trạng thái điểm danh</th>
                <th className="p-3 w-24 text-center">Phút muộn</th>
                <th className="p-3 min-w-[180px]">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r, idx) => (
                <tr key={r.student_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-semibold text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-slate-500">{`HS2025${String(r.student_id).padStart(3, '0')}`}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">{r.student_name}</span>
                      <div className="flex items-center gap-1">
                        {r.method === 'QR_CAMERA' && (
                          <span className="text-[9px] font-black bg-[#EEECFF] text-[#6C63FF] px-1.5 py-0.5 rounded border border-[#C0BBFD]">
                            📷 Quét QR
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenStudentCard(r)}
                          className="text-[10px] text-[#6C63FF] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                          title="Xem & In Thẻ QR Học Sinh"
                        >
                          <QrCode className="h-3 w-3" /> Thẻ QR
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([
                        ['NOT_YET', '⏳ Chưa điểm danh', 'bg-slate-500'],
                        ['PRESENT', 'Có mặt', 'bg-emerald-600'],
                        ['EXCUSED_ABSENCE', 'Vắng có phép', 'bg-amber-600'],
                        ['UNEXCUSED_ABSENCE', 'Vắng KP', 'bg-red-600'],
                        ['LATE', 'Đi muộn', 'bg-purple-600'],
                        ['EARLY_LEAVE', 'Xin về', 'bg-sky-600'],
                        ['TRUANCY', 'Cúp tiết', 'bg-rose-600'],
                      ] as [AttendanceStatus, string, string][]).map(([s, label, activeClass]) => (
                        <button key={s} disabled={isLocked}
                          onClick={() => updateStatus(r.student_id, s)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${r.status === s ? `${activeClass} text-white shadow-sm` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 text-center">
                    {r.status === 'LATE' && (
                      <input type="number" defaultValue={r.minutes_late || 15} disabled={isLocked}
                        className="w-16 rounded border border-slate-300 p-1 text-xs text-center font-bold" />
                    )}
                  </td>
                  <td className="p-2.5">
                    <input type="text" defaultValue={r.note || ''} disabled={isLocked}
                      placeholder="Ghi chú lý do..." className="w-full rounded border border-slate-200 p-1 text-xs text-slate-700" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      <Modal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        title="Xác nhận Khóa buổi điểm danh"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsLockModalOpen(false)}>Hủy</Button>
            <Button variant="danger" onClick={() => handleSaveAttendance(true)} disabled={isSaving}
              icon={isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}>
              {isSaving ? 'Đang lưu...' : 'Khóa & Lưu vào CSDL'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Sau khi khóa, buổi điểm danh sẽ được lưu vĩnh viễn vào cơ sở dữ liệu MySQL và không thể chỉnh sửa nếu không mở khóa bằng tài khoản có quyền.
        </p>
      </Modal>

      {/* 1. Camera QR Scanner & Photo Verification Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        classId={selectedClass.id}
        classNameTitle={selectedClass.name}
        teacherName={currentUser?.name || 'Giáo viên'}
        onAttendanceConfirmed={handleQRConfirmed}
      />

      {/* 2. Student QR ID Card & Print Modal */}
      <StudentIDCardModal
        isOpen={isQRCardModalOpen}
        onClose={() => setIsQRCardModalOpen(false)}
        student={selectedStudentForCard}
        allStudents={studentsList as any}
        className={selectedClass.name}
        teacherName={currentUser?.name || 'Giáo viên'}
      />

      {/* 3. Random Audit Verification Check Modal */}
      <Modal
        isOpen={isRandomAuditOpen}
        onClose={() => setIsRandomAuditOpen(false)}
        title={`🎲 Đối Chiếu Ngẫu Nhiên (${randomAuditStudents.length} Học Sinh Đã Có Mặt)`}
        footer={<Button variant="primary" onClick={() => setIsRandomAuditOpen(false)}>Hoàn Tất Đối Chiếu</Button>}
      >
        <div className="space-y-4 py-1">
          <div className="p-3.5 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] text-xs font-bold text-[#6C63FF]">
            Hệ thống chọn ngẫu nhiên <strong>{randomAuditStudents.length} học sinh</strong> đã được ghi nhận có mặt. Vui lòng đối chiếu trực tiếp hình ảnh với các học sinh đang ngồi trong lớp.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {randomAuditStudents.map(st => (
              <div key={st.student_id} className="p-3 rounded-2xl border border-[#E1E6F0] bg-white text-center space-y-2 shadow-2xs">
                <div className="w-20 h-24 rounded-2xl mx-auto overflow-hidden bg-[#FAFBFF] border-2 border-[#6C63FF] relative">
                  {st.avatar_url ? (
                    <img src={st.avatar_url} alt={st.student_name} className="w-full h-full object-cover" />
                  ) : (
                    <UserAvatar name={st.student_name} size="md" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-[#18243A] truncate">{st.student_name}</div>
                  <div className="text-[10px] text-[#0E8360] font-black mt-0.5">✓ {st.status === 'PRESENT' ? 'Có mặt' : 'Đi muộn'}</div>
                  {st.scanned_at && <div className="text-[9px] text-[#68758D] font-mono mt-0.5">🕒 {st.scanned_at}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

    </div>
  );
};
