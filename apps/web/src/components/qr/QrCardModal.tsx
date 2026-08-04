import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import type { QrToken, Student } from '../../types/app';
import { apiRequest, uploadBlob } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props { isOpen: boolean; onClose: () => void; student: Student | null; className: string }

export const QrCardModal: React.FC<Props> = ({ isOpen, onClose, student, className }) => {
  const [qr, setQr] = useState<QrToken | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const materializeQr = useCallback(async (token: QrToken) => {
    if (token.qr_url) return setQrUrl(token.qr_url);
    const dataUrl = await QRCode.toDataURL(token.qr_token, {
      errorCorrectionLevel: 'H', margin: 4, width: 640,
      color: { dark: '#17213a', light: '#ffffff' },
    });
    const blob = await fetch(dataUrl).then((response) => response.blob());
    const uploaded = await uploadBlob(blob, `qr-${token.student_code}.png`, 'qr', token.student_id);
    setQrUrl(uploaded.url);
  }, []);

  const loadQr = useCallback(async () => {
    if (!student) return;
    setIsLoading(true); setError(''); setNotice(''); setQrUrl('');
    try {
      const payload = await apiRequest<{ success: true; committed: true; tokens: QrToken[] }>('/qr/token', {
        method: 'POST', body: { student_id: student.id }, expectCommit: true,
      });
      const token = payload.tokens[0];
      if (!token) throw new Error('Máy chủ không trả về mã QR.');
      setQr(token);
      await materializeQr(token);
      setNotice('Mã QR và ảnh BLOB đã commit vào MySQL.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo mã QR.');
    } finally { setIsLoading(false); }
  }, [materializeQr, student]);

  useEffect(() => {
    if (isOpen && student) loadQr();
    if (!isOpen) { setQr(null); setQrUrl(''); setError(''); setNotice(''); }
  }, [isOpen, student, loadQr]);

  const renew = async () => {
    if (!student || !window.confirm('Thu hồi mã cũ và cấp QR mới? Mã cũ sẽ mất hiệu lực.')) return;
    setIsLoading(true); setError(''); setNotice(''); setQrUrl('');
    try {
      const payload = await apiRequest<{ success: true; committed: true; qr_token: string; version: number }>('/qr/revoke', {
        method: 'POST', body: { student_id: student.id }, expectCommit: true,
      });
      const next: QrToken = {
        student_id: String(student.id), student_code: student.student_code,
        student_name: student.full_name, class_id: student.class_id,
        qr_token: payload.qr_token, version: payload.version,
      };
      setQr(next); await materializeQr(next);
      setNotice('QR mới và ảnh BLOB đã commit vào MySQL.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cấp lại QR.');
    } finally { setIsLoading(false); }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Thẻ học sinh & QR" size="lg"
    footer={<><Button variant="ghost" onClick={onClose}>Đóng</Button><Button onClick={() => window.print()} icon={<Printer size={18} />}>In thẻ</Button></>}>
    {student && <div className="student-card-shell">
      <section className="student-id-card">
        <header><div className="student-id-card__school"><span><QrCode size={19} /></span><div><strong>EDUCLASS THCS</strong><small>THẺ HỌC SINH · QR ĐIỂM DANH</small></div></div><b>{className}</b></header>
        <div className="student-id-card__person">
          {student.avatar_url ? <img src={student.avatar_url} alt={student.full_name} /> : <div className="student-photo-empty">Chưa có ảnh</div>}
          <div><h3>{student.full_name}</h3><p>Mã học sinh: <strong>{student.student_code}</strong></p><p>{student.gender || '—'} · {student.group_name || 'Chưa xếp tổ'}</p></div>
        </div>
        <div className="student-id-card__qr">{isLoading ? <div className="qr-placeholder"><span className="clay-spinner" /></div> : qrUrl ? <img src={qrUrl} alt={`QR của ${student.full_name}`} /> : <div className="qr-placeholder">Chưa có QR</div>}{qr && <small>Phiên bản {qr.version} · QR chuẩn, sửa lỗi H</small>}</div>
        <footer><ShieldCheck size={15} /> Token xác thực từ MySQL · ảnh QR lưu BLOB</footer>
      </section>
      {notice && <div className="clay-notice clay-notice--success">{notice}</div>}
      {error && <div className="clay-notice clay-notice--error">{error}</div>}
      <Button variant="secondary" onClick={renew} isLoading={isLoading} icon={<RefreshCw size={18} />}>Thu hồi & cấp QR mới</Button>
    </div>}
  </Modal>;
};
