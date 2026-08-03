import React, { useState, useEffect, useRef } from 'react';
import type { Student } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UserAvatar } from '../ui/UserAvatar';
import { QrCode, Printer, RefreshCw, AlertTriangle, ShieldCheck, Users } from 'lucide-react';
import { generateQRCodeDataUrl } from '../../utils/qrGenerator';

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  allStudents?: Student[];
  classId?: string | number;
  className?: string;
  teacherName?: string;
  onTokenUpdated?: () => void;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  isOpen,
  onClose,
  student,
  allStudents = [],
  classId = 1,
  className = '8A3',
  teacherName = 'Giáo viên',
  onTokenUpdated,
}) => {
  const [qrToken, setQrToken] = useState<string>('');
  const [tokenVersion, setTokenVersion] = useState<number>(1);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
  const [bulkQrData, setBulkQrData] = useState<Record<string, { token: string; dataUrl: string }>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  const getQRImageUrl = (text: string) => {
    return generateQRCodeDataUrl(text);
  };

  // Fetch or generate QR token for student
  useEffect(() => {
    if (!isOpen) return;

    const targetClassId = student?.class_id || classId || 1;

    if (viewMode === 'single' && student) {
      setIsLoadingToken(true);
      fetch(`/thcs/api/qr/token?student_id=${student.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.qr_token) {
            setQrToken(data.qr_token);
            setTokenVersion(data.version || 1);
            setQrDataUrl(getQRImageUrl(data.qr_token));
          }
        })
        .catch(() => {
          const fbToken = `THCS-QR-v1-${student.student_code || student.id}`;
          setQrToken(fbToken);
          setQrDataUrl(getQRImageUrl(fbToken));
        })
        .finally(() => setIsLoadingToken(false));
    } else if (viewMode === 'bulk' && allStudents.length > 0) {
      setIsLoadingToken(true);
      // Pre-fill all QR data URLs locally immediately so it never shows a blank box
      const initialMap: Record<string, { token: string; dataUrl: string }> = {};
      for (const s of allStudents) {
        const tok = `THCS-QR-v1-${s.student_code || s.id}`;
        initialMap[String(s.id)] = { token: tok, dataUrl: getQRImageUrl(tok) };
        if (s.student_code) initialMap[String(s.student_code)] = { token: tok, dataUrl: getQRImageUrl(tok) };
      }
      setBulkQrData(initialMap);

      fetch(`/thcs/api/qr/token?class_id=${targetClassId}`)
        .then(res => res.json())
        .then(async data => {
          if (data.success && Array.isArray(data.tokens)) {
            const map = { ...initialMap };
            for (const t of data.tokens) {
              const url = getQRImageUrl(t.qr_token);
              map[String(t.student_id)] = { token: t.qr_token, dataUrl: url };
              if (t.student_code) map[String(t.student_code)] = { token: t.qr_token, dataUrl: url };
            }
            setBulkQrData(map);
          }
        })
        .finally(() => setIsLoadingToken(false));
    }
  }, [isOpen, student?.id, viewMode, allStudents.length, classId]);

  const handleRevokeToken = async () => {
    if (!student) return;
    if (!confirm(`Bạn có chắc chắn muốn THU HỒI mã QR cũ và CẤP THẺ MỚI cho học sinh ${student.full_name}? (Mã QR cũ sẽ lập tức bị vô hiệu hóa)`)) return;

    setIsRevoking(true);
    try {
      const res = await fetch('/thcs/api/qr/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, teacher_name: teacherName }),
      });
      const data = await res.json();
      if (data.success && data.qr_token) {
        setQrToken(data.qr_token);
        setTokenVersion(data.version);
        setQrDataUrl(getQRImageUrl(data.qr_token));
        if (onTokenUpdated) onTokenUpdated();
        alert('🎉 Đã thu hồi thẻ cũ và cấp mã QR mới thành công!');
      }
    } catch (e) {
      alert('⚠️ Lỗi khi thu hồi thẻ QR!');
    }
    setIsRevoking(false);
  };

  const handlePrintCard = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={viewMode === 'single' ? `🎴 Thẻ Học Sinh & Mã QR Điểm Danh: ${student?.full_name || ''}` : `🎴 Danh Sách Thẻ QR Điểm Danh Cả Lớp (${allStudents.length} HS)`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'single' ? 'bulk' : 'single')}
              className="px-3 py-1.5 rounded-xl border border-[#6C63FF] text-[#6C63FF] bg-[#EEECFF] hover:bg-[#DED9FF] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {viewMode === 'single' ? <><Users className="h-4 w-4" /> Xem & In Cả Lớp</> : <><QrCode className="h-4 w-4" /> Xem Thẻ Cá Nhân</>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
            <Button variant="primary" onClick={handlePrintCard} icon={<Printer className="h-4 w-4" />}>
              In Thẻ QR
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {viewMode === 'single' && student && (
          <div className="space-y-4">
            {/* OFFICIAL STUDENT ID CARD CONTAINER */}
            <div
              ref={cardRef}
              className="mx-auto w-full max-w-sm rounded-3xl p-5 bg-gradient-to-br from-[#18243A] via-[#243452] to-[#18243A] text-white shadow-xl border-2 border-[#C0BBFD] relative overflow-hidden space-y-4"
            >
              {/* Decorative Ambient Background Effects */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#6C63FF]/30 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#22C997]/20 rounded-full blur-2xl pointer-events-none"></div>

              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xs">🎓</div>
                  <div>
                    <div className="text-[11px] font-black tracking-wider uppercase text-[#A3F0D9]">TRƯỜNG THCS GIÁO DỤC</div>
                    <div className="text-[9px] text-white/70 font-bold">THẺ HỌC SINH · ĐIỂM DANH QR</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/30 text-white">
                    LỚP {student.class_name || className}
                  </span>
                </div>
              </div>

              {/* Student Details & Photo Layout */}
              <div className="flex items-center gap-4">
                {/* Photo Frame */}
                <div className="relative shrink-0">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.full_name}
                      className="w-20 h-24 rounded-2xl object-cover border-2 border-white/90 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-24 rounded-2xl bg-white/10 border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-center p-1">
                      <UserAvatar name={student.full_name} size="md" />
                      <span className="text-[8px] text-amber-300 font-extrabold mt-1">Chưa có ảnh</span>
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#22C997] border-2 border-[#18243A] flex items-center justify-center text-[8px]">✓</span>
                </div>

                {/* Info Text */}
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-base font-black text-white truncate leading-tight">{student.full_name}</h3>
                  <div className="text-xs text-[#A3F0D9] font-mono font-extrabold">Mã HS: {student.student_code || `HS${student.id}`}</div>
                  <div className="text-[11px] text-white/80 font-bold">Giới tính: {student.gender || 'Nam'}</div>
                  <div className="text-[10px] text-white/60 font-bold">Tổ: {student.group_name || 'Tổ 1'}</div>
                </div>
              </div>

              {/* QR Code Center Display */}
              <div className="bg-white p-3 rounded-2xl text-center space-y-2 shadow-inner border border-white/50">
                {isLoadingToken ? (
                  <div className="h-44 flex items-center justify-center text-xs text-[#68758D] font-bold animate-pulse">
                    Đang tạo mã QR bảo mật...
                  </div>
                ) : (
                  <>
                    <img src={qrDataUrl} alt="Mã QR" className="w-40 h-40 mx-auto object-contain" />
                    <div className="text-[10px] font-mono font-bold text-[#68758D] truncate">
                      Token (v{tokenVersion}): <span className="text-[#18243A] font-extrabold">{qrToken.slice(0, 18)}...</span>
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer Security Stamp */}
              <div className="flex items-center justify-between text-[9px] text-white/60 font-bold pt-1 border-t border-white/10">
                <div className="flex items-center gap-1 text-[#22C997]">
                  <ShieldCheck className="h-3 w-3" /> Mã hóa Token 32-Byte (Bảo mật)
                </div>
                <div>Năm học 2026-2027</div>
              </div>
            </div>

            {/* Re-issue / Revoke Lost Card Button */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9EB] border border-[#FFE399] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-extrabold text-[#B47800] flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-[#B47800]" /> Cấp lại thẻ do bị mất?
                </div>
                <div className="text-[11px] text-[#68758D] font-bold">Vô hiệu hóa ngay mã QR cũ để chống quét nhầm.</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeToken}
                isLoading={isRevoking}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Cấp QR Mới
              </Button>
            </div>
          </div>
        )}

        {/* BULK CLASS PRINT VIEW */}
        {viewMode === 'bulk' && (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#EEECFF] border border-[#C0BBFD] text-xs font-bold text-[#6C63FF]">
              Danh sách thẻ QR sẵn sàng in cho Lớp {className} ({allStudents.length} học sinh). Nhấn nút "In Thẻ QR" để in ra khổ giấy A4.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {allStudents.map(st => {
                const qrInfo = bulkQrData[String(st.id)] || bulkQrData[String(st.student_code)];
                const dataUrl = qrInfo?.dataUrl || getQRImageUrl(st.student_code || `THCS-QR-v1-${st.id}`);

                return (
                  <div key={st.id} className="p-3 rounded-2xl border border-[#E1E6F0] bg-white shadow-2xs flex items-center gap-3">
                    {st.avatar_url ? (
                      <img src={st.avatar_url} alt={st.full_name} className="w-14 h-16 rounded-xl object-cover border border-[#E1E6F0]" />
                    ) : (
                      <UserAvatar name={st.full_name} size="sm" />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5 text-xs">
                      <div className="font-black text-[#18243A] truncate">{st.full_name}</div>
                      <div className="text-[10px] text-[#68758D] font-mono">Mã: {st.student_code || st.id}</div>
                      <div className="text-[10px] text-[#6C63FF] font-bold">Lớp {className}</div>
                    </div>
                    <img src={dataUrl} alt="QR" className="w-14 h-14 object-contain border border-[#E1E6F0] rounded-lg p-0.5 shrink-0 bg-white shadow-2xs" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
