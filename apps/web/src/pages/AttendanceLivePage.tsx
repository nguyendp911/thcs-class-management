import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, QrCode, RefreshCw, Save, UserX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { AttendanceRecord, Student } from '../types/app';
import { QrScanModal } from '../components/qr/QrScanModal';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatePanel } from '../components/ui/StatePanel';

const statuses = [
  { value: 'PRESENT', label: 'Có mặt', icon: Check },
  { value: 'LATE', label: 'Đi muộn', icon: Clock3 },
  { value: 'EXCUSED_ABSENCE', label: 'Vắng phép', icon: CalendarDays },
  { value: 'UNEXCUSED_ABSENCE', label: 'Vắng', icon: UserX },
] as const;

export const AttendanceLivePage: React.FC = () => {
  const { classId } = useParams();
  const { selectedClass } = useAuth();
  const activeClassId = String(classId || selectedClass?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('morning');
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!activeClassId) return;
    setIsLoading(true); setError('');
    try {
      const [studentPayload, attendancePayload] = await Promise.all([
        apiRequest<{ success: true; students: Student[] }>(`/students?class_id=${encodeURIComponent(activeClassId)}`),
        apiRequest<{ success: true; session: { id: number; is_locked: number } | null; records: AttendanceRecord[] }>(`/attendance?class_id=${encodeURIComponent(activeClassId)}&session_date=${encodeURIComponent(date)}&session_type=${encodeURIComponent(type)}`),
      ]);
      setStudents(studentPayload.students);
      setRecords(Object.fromEntries(attendancePayload.records.map((record) => [String(record.student_id), record])));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được dữ liệu điểm danh.'); }
    finally { setIsLoading(false); }
  }, [activeClassId, date, type]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => Object.values(records).reduce((result, record) => {
    result[record.status] = (result[record.status] || 0) + 1; return result;
  }, {} as Record<string, number>), [records]);

  const setStatus = (student: Student, status: AttendanceRecord['status']) => {
    setNotice('');
    setRecords((current) => ({ ...current, [String(student.id)]: { ...current[String(student.id)], student_id: String(student.id), student_name: student.full_name, status, method: 'MANUAL' } }));
  };

  const markAllPresent = () => {
    setNotice('');
    setRecords(Object.fromEntries(students.map((student) => [String(student.id), { student_id: String(student.id), student_name: student.full_name, status: 'PRESENT', method: 'MANUAL' }])));
  };

  const save = async () => {
    const missing = students.filter((student) => !records[String(student.id)]);
    if (missing.length) { setError(`Còn ${missing.length} học sinh chưa chọn trạng thái.`); return; }
    setIsSaving(true); setError(''); setNotice('');
    try {
      await apiRequest('/attendance', { method: 'POST', body: { class_id: activeClassId, session_date: date, session_type: type, records: students.map((student) => records[String(student.id)]) }, expectCommit: true });
      setNotice('Phiên điểm danh đã được lưu sau khi transaction MySQL commit.');
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu điểm danh.'); }
    finally { setIsSaving(false); }
  };

  return <div className="clay-page">
    <PageHeader title="Điểm danh & QR" description={`Dữ liệu trực tiếp từ MySQL · ${selectedClass?.name || 'Lớp đang chọn'}`} icon={QrCode} tone="mint"
      action={<Button onClick={() => setScannerOpen(true)} icon={<QrCode size={18} />}>Quét QR</Button>} />
    {notice && <div className="clay-notice clay-notice--success">{notice}</div>}
    {error && <div className="clay-notice clay-notice--error">{error}</div>}
    <section className="attendance-controls clay-card">
      <label className="clay-field"><span>Ngày</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="clay-field"><span>Buổi</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="morning">Buổi sáng</option><option value="afternoon">Buổi chiều</option></select></label>
      <Button variant="ghost" onClick={load} icon={<RefreshCw size={17} />}>Tải lại</Button>
      <Button variant="secondary" onClick={markAllPresent} icon={<Check size={17} />}>Tất cả có mặt</Button>
      <Button onClick={save} isLoading={isSaving} icon={<Save size={17} />}>Lưu phiên</Button>
    </section>
    <section className="attendance-summary">
      {statuses.map(({ value, label, icon: Icon }) => <article className={`attendance-kpi attendance-kpi--${value.toLowerCase()}`} key={value}><Icon /><div><strong>{counts[value] || 0}</strong><span>{label}</span></div></article>)}
      <article className="attendance-kpi"><div><strong>{students.length - Object.keys(records).length}</strong><span>Chưa chọn</span></div></article>
    </section>
    {isLoading ? <StatePanel variant="loading" title="Đang đọc điểm danh" message="Dữ liệu đang được truy vấn từ MySQL." /> : students.length === 0 ? <StatePanel title="Chưa có học sinh" message="Hãy thêm hồ sơ học sinh trước khi điểm danh." /> :
      <section className="clay-card clay-table-card"><div className="clay-table-wrap"><table className="clay-table attendance-table"><thead><tr><th>Học sinh</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{students.map((student) => {
        const current = records[String(student.id)];
        return <tr key={student.id}><td><div className="attendance-student"><span>{student.full_name.slice(0, 1)}</span><div><strong>{student.full_name}</strong><small>{student.student_code}</small></div></div></td><td><div className="attendance-statuses">{statuses.map((status) => { const StatusIcon = status.icon; return <button className={current?.status === status.value ? 'is-active' : ''} key={status.value} onClick={() => setStatus(student, status.value)}><StatusIcon size={15} />{status.label}</button>; })}</div></td><td><input className="clay-inline-input" value={current?.note || ''} placeholder="Ghi chú…" onChange={(event) => setRecords((list) => ({ ...list, [String(student.id)]: { ...(current || { student_id: String(student.id), student_name: student.full_name, status: 'NOT_YET' }), note: event.target.value } }))} /></td></tr>;
      })}</tbody></table></div></section>}
    <QrScanModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} classId={activeClassId} sessionDate={date} sessionType={type} onCommitted={load} />
  </div>;
};
