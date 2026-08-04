import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CheckCircle2, Keyboard, RotateCcw, ScanLine } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ScannedStudent { student_id: string; student_code: string; full_name: string }
interface Props { isOpen: boolean; onClose: () => void; classId: string; sessionDate: string; sessionType: string; onCommitted: () => void }

export const QrScanModal: React.FC<Props> = ({ isOpen, onClose, classId, sessionDate, sessionType, onCommitted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manual, setManual] = useState('');
  const [student, setStudent] = useState<ScannedStudent | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const lookup = useCallback(async (raw: string) => {
    if (busyRef.current || !raw.trim()) return;
    busyRef.current = true; setIsBusy(true); setError(''); setNotice('');
    try {
      const payload = await apiRequest<{ success: true; student: ScannedStudent }>('/qr/scan-lookup', {
        method: 'POST', body: { qr_token: raw.trim(), class_id: classId }, expectCommit: false,
      });
      setStudent(payload.student); stopCamera();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'QR không hợp lệ hoặc không thuộc lớp này.');
    } finally { busyRef.current = false; setIsBusy(false); }
  }, [classId, stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (video && canvas && video.readyState >= 2 && !busyRef.current) {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = context?.getImageData(0, 0, canvas.width, canvas.height);
      if (image) {
        const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
        if (result?.data) { lookup(result.data); return; }
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }, [lookup]);

  const startCamera = useCallback(async () => {
    stopCamera(); setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); frameRef.current = requestAnimationFrame(scanFrame); }
    } catch { setError('Không mở được camera. Hãy cấp quyền hoặc chuyển sang nhập token.'); }
  }, [scanFrame, stopCamera]);

  useEffect(() => {
    if (isOpen && mode === 'camera' && !student) startCamera(); else stopCamera();
    return stopCamera;
  }, [isOpen, mode, student, startCamera, stopCamera]);

  const confirm = async (status: 'PRESENT' | 'LATE') => {
    if (!student) return;
    setIsBusy(true); setError('');
    try {
      await apiRequest('/qr/confirm-attendance', { method: 'POST', body: { student_id: student.student_id, class_id: classId, session_date: sessionDate, session_type: sessionType, status }, expectCommit: true });
      setNotice(`Đã điểm danh ${student.full_name} sau khi MySQL commit.`); onCommitted();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xác nhận điểm danh.'); }
    finally { setIsBusy(false); }
  };

  const reset = () => { setStudent(null); setManual(''); setNotice(''); setError(''); busyRef.current = false; };

  return <Modal isOpen={isOpen} onClose={onClose} title="Quét QR điểm danh" size="lg" footer={<Button variant="ghost" onClick={onClose}>Đóng</Button>}>
    <div className="qr-scanner">
      <div className="clay-segmented"><button className={mode === 'camera' ? 'is-active' : ''} onClick={() => { reset(); setMode('camera'); }}><Camera size={17} /> Camera</button><button className={mode === 'manual' ? 'is-active' : ''} onClick={() => { reset(); setMode('manual'); }}><Keyboard size={17} /> Nhập token</button></div>
      {!student && mode === 'camera' && <div className="qr-camera"><video ref={videoRef} playsInline muted /><canvas ref={canvasRef} hidden /><div className="qr-camera__guide"><ScanLine /></div></div>}
      {!student && mode === 'manual' && <form className="qr-manual" onSubmit={(event) => { event.preventDefault(); lookup(manual); }}><label className="clay-field"><span>Token đầy đủ trong QR</span><input value={manual} onChange={(event) => setManual(event.target.value)} autoFocus /></label><Button type="submit" isLoading={isBusy}>Kiểm tra</Button></form>}
      {student && <section className="qr-result"><CheckCircle2 size={38} /><div><span>QR hợp lệ</span><h3>{student.full_name}</h3><p>{student.student_code}</p></div>{!notice && <div className="qr-result__actions"><Button onClick={() => confirm('PRESENT')} isLoading={isBusy}>Có mặt</Button><Button variant="secondary" onClick={() => confirm('LATE')} isLoading={isBusy}>Đi muộn</Button></div>}</section>}
      {notice && <div className="clay-notice clay-notice--success">{notice}<Button variant="ghost" size="sm" onClick={reset} icon={<RotateCcw size={16} />}>Quét tiếp</Button></div>}
      {error && <div className="clay-notice clay-notice--error">{error}</div>}
    </div>
  </Modal>;
};
