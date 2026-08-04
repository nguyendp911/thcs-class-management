import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Plus, QrCode, RefreshCw, Search, Trash2, Upload, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, uploadBlob } from '../lib/api';
import type { Student } from '../types/app';
import { QrCardModal } from '../components/qr/QrCardModal';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatePanel } from '../components/ui/StatePanel';

type FormState = {
  student_code: string; full_name: string; gender: string; date_of_birth: string;
  group_name: string; primary_guardian_name: string; primary_guardian_phone: string;
  address: string; health_note: string;
};

const blankForm: FormState = { student_code: '', full_name: '', gender: '', date_of_birth: '', group_name: '', primary_guardian_name: '', primary_guardian_phone: '', address: '', health_note: '' };

export const StudentsLivePage: React.FC = () => {
  const { classId } = useParams();
  const { selectedClass, refreshBootstrap } = useAuth();
  const activeClassId = classId || selectedClass?.id || '';
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editing, setEditing] = useState<Student | null>(null);
  const [cardStudent, setCardStudent] = useState<Student | null>(null);
  const [photoStudent, setPhotoStudent] = useState<Student | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!activeClassId) return;
    setIsLoading(true); setError('');
    try {
      const payload = await apiRequest<{ success: true; students: Student[] }>(`/students?class_id=${encodeURIComponent(activeClassId)}`);
      setStudents(payload.students);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được học sinh.'); }
    finally { setIsLoading(false); }
  }, [activeClassId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('vi');
    if (!needle) return students;
    return students.filter((student) => `${student.full_name} ${student.student_code} ${student.primary_guardian_name || ''}`.toLocaleLowerCase('vi').includes(needle));
  }, [search, students]);

  const openCreate = () => { setEditing(null); setForm(blankForm); setError(''); setNotice(''); setIsFormOpen(true); };
  const openEdit = (student: Student) => {
    setEditing(student);
    setIsFormOpen(true);
    setForm({
      student_code: student.student_code || '', full_name: student.full_name || '', gender: student.gender || '',
      date_of_birth: student.date_of_birth || '', group_name: student.group_name || '',
      primary_guardian_name: student.primary_guardian_name || '', primary_guardian_phone: student.primary_guardian_phone || '',
      address: student.address || '', health_note: student.health_note || '',
    });
  };

  const commitList = async (next: Student[], message: string) => {
    setIsSaving(true); setError(''); setNotice('');
    try {
      const payload = await apiRequest<{ success: true; committed: true; students: Student[] }>('/students', {
        method: 'POST', body: { class_id: activeClassId, students: next }, expectCommit: true,
      });
      setStudents(payload.students); setEditing(null); setIsFormOpen(false); setForm(blankForm); setNotice(message); await refreshBootstrap();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu học sinh.'); }
    finally { setIsSaving(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parts = form.full_name.trim().split(/\s+/);
    const record: Student = {
      ...(editing || {} as Student), id: editing?.id || 0,
      public_id: editing?.public_id || '', student_code: form.student_code.trim(), full_name: form.full_name.trim(),
      first_name: parts.at(-1) || '', last_name: parts.slice(0, -1).join(' '), gender: form.gender,
      date_of_birth: form.date_of_birth || null, group_name: form.group_name || null,
      primary_guardian_name: form.primary_guardian_name || null, primary_guardian_phone: form.primary_guardian_phone || null,
      address: form.address || null, health_note: form.health_note || null,
      status: editing?.status || 'đang học', class_id: String(activeClassId), class_name: selectedClass?.name || null,
    };
    const next = editing ? students.map((item) => item.id === editing.id ? record : item) : [...students, record];
    await commitList(next, 'Hồ sơ học sinh đã được lưu sau khi MySQL commit.');
  };

  const remove = async (student: Student) => {
    if (!window.confirm(`Xóa hồ sơ ${student.full_name}?`)) return;
    await commitList(students.filter((item) => item.id !== student.id), 'Đã xóa hồ sơ sau khi MySQL commit.');
  };

  const uploadPhoto = async () => {
    if (!photo || !photoStudent) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      await uploadBlob(photo, photo.name, 'student-avatar', String(photoStudent.id));
      await load(); setPhoto(null); setPhotoStudent(null);
      setNotice('Ảnh học sinh đã được lưu BLOB sau khi MySQL commit.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu ảnh.'); }
    finally { setIsSaving(false); }
  };

  return <div className="clay-page">
    <PageHeader title="Hồ sơ học sinh" description={`Dữ liệu trực tiếp từ MySQL · ${selectedClass?.name || 'Lớp đang chọn'}`} icon={Users} tone="sky"
      action={<Button onClick={openCreate} icon={<Plus size={18} />}>Thêm học sinh</Button>} />
    {notice && <div className="clay-notice clay-notice--success">{notice}</div>}
    {error && <div className="clay-notice clay-notice--error">{error}</div>}
    <section className="clay-toolbar"><label className="clay-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, mã học sinh, phụ huynh…" /></label><Button variant="ghost" size="sm" onClick={load} icon={<RefreshCw size={16} />}>Làm mới</Button></section>
    {isLoading ? <StatePanel variant="loading" title="Đang đọc danh sách" message="Đang truy vấn MySQL trên máy chủ." /> : students.length === 0 ? <StatePanel title="Lớp chưa có học sinh" message="MySQL chưa có hồ sơ học sinh cho lớp này." action={<Button onClick={openCreate} icon={<Plus size={18} />}>Thêm hồ sơ đầu tiên</Button>} /> :
      <section className="student-grid">{filtered.map((student) => <article className="student-clay-card" key={student.id}>
        <button className="student-clay-card__profile" onClick={() => openEdit(student)}>
          {student.avatar_url ? <img src={student.avatar_url} alt={student.full_name} /> : <div className="student-avatar-placeholder">{student.full_name.slice(0, 1).toUpperCase()}</div>}
          <div><span>{student.student_code}</span><h3>{student.full_name}</h3><p>{student.group_name || 'Chưa xếp tổ'} · {student.gender || 'Chưa ghi giới tính'}</p></div>
        </button>
        <dl><div><dt>Phụ huynh</dt><dd>{student.primary_guardian_name || '—'}</dd></div><div><dt>Điện thoại</dt><dd>{student.primary_guardian_phone || '—'}</dd></div></dl>
        <footer><button onClick={() => { setPhotoStudent(student); setPhoto(null); }}><Camera size={16} /> Ảnh</button><button onClick={() => setCardStudent(student)}><QrCode size={16} /> QR</button><button onClick={() => remove(student)}><Trash2 size={16} /> Xóa</button></footer>
      </article>)}</section>}

    <Modal isOpen={isFormOpen} onClose={() => { setEditing(null); setIsFormOpen(false); setForm(blankForm); }} title={editing ? 'Cập nhật học sinh' : 'Thêm học sinh'} size="lg"
      footer={<><Button variant="ghost" onClick={() => { setEditing(null); setIsFormOpen(false); setForm(blankForm); }}>Hủy</Button><Button form="student-form" type="submit" isLoading={isSaving}>Lưu vào MySQL</Button></>}>
      <form id="student-form" className="clay-form-grid" onSubmit={submit}>
        {([['student_code','Mã học sinh','text'],['full_name','Họ và tên','text'],['gender','Giới tính','text'],['date_of_birth','Ngày sinh','date'],['group_name','Tổ','text'],['primary_guardian_name','Họ tên phụ huynh','text'],['primary_guardian_phone','Điện thoại phụ huynh','tel'],['address','Địa chỉ','text']] as const).map(([key,label,type]) => <label className="clay-field" key={key}><span>{label}</span><input type={type} required={key === 'student_code' || key === 'full_name'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}
        <label className="clay-field clay-field--wide"><span>Ghi chú sức khỏe</span><textarea value={form.health_note} onChange={(event) => setForm({ ...form, health_note: event.target.value })} /></label>
      </form>
    </Modal>
    <Modal isOpen={photoStudent !== null} onClose={() => setPhotoStudent(null)} title={`Lưu ảnh BLOB · ${photoStudent?.full_name || ''}`}
      footer={<><Button variant="ghost" onClick={() => setPhotoStudent(null)}>Hủy</Button><Button onClick={uploadPhoto} isLoading={isSaving} disabled={!photo} icon={<Upload size={18} />}>Lưu ảnh vào MySQL</Button></>}>
      <label className="clay-upload"><Camera size={34} /><strong>Chọn ảnh học sinh</strong><span>Ảnh được gửi thẳng lên server và lưu dạng BLOB.</span><input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>
      {photo && <p className="clay-file-name">{photo.name} · {Math.ceil(photo.size / 1024)} KB</p>}
    </Modal>
    <QrCardModal isOpen={cardStudent !== null} onClose={() => setCardStudent(null)} student={cardStudent} className={selectedClass?.name || ''} />
  </div>;
};
