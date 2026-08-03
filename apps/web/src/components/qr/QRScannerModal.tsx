import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UserAvatar } from '../ui/UserAvatar';
import {
  Camera, SwitchCamera, Zap, ZapOff, CheckCircle2, Clock, XCircle, AlertTriangle,
  Search, ShieldCheck, Keyboard, RefreshCw
} from 'lucide-react';
// @ts-ignore
import jsQR from 'jsqr';

interface ScannedStudentInfo {
  student_id: string | number;
  student_code: string;
  full_name: string;
  gender: string;
  class_name: string;
  avatar_url?: string;
  has_photo: boolean;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | number;
  classNameTitle?: string;
  sessionId?: number;
  teacherName?: string;
  onAttendanceConfirmed?: (studentId: string | number, status: 'PRESENT' | 'LATE' | 'REJECTED') => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  classId,
  classNameTitle = '8A3',
  sessionId = 0,
  teacherName = 'Giáo viên',
  onAttendanceConfirmed,
}) => {
  // Camera & Scanner State
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');

  // Scanned Student & Verification Modal State
  const [scannedResult, setScannedResult] = useState<{
    student: ScannedStudentInfo;
    scan_time: string;
    already_scanned: boolean;
    existing_status?: string | null;
    scanned_time?: string | null;
    rawToken: string;
  } | null>(null);

  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Audio Beep Sound Effect
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Clean up and stop camera stream
  const stopCameraStream = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start WebRTC Camera stream
  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e) {
        // Fallback for simple webcams / built-in laptop cameras
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: false,
        });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch flashlight capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }

      // Start scanning loop
      setIsScanningActive(true);
      requestAnimationFrame(scanCanvasFrame);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('🔒 Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền Camera trong cài đặt trình duyệt.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('📷 Không tìm thấy thiết bị Camera trên máy này.');
      } else {
        setCameraError('⚠️ Không thể khởi động Camera. Bạn có thể sử dụng phương thức nhập thủ công ở bên dưới.');
      }
    }
  };

  // Canvas Frame QR Code Decoder Loop
  const scanCanvasFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanCanvasFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx && isScanningActive && !scannedResult) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        handleQRDetected(code.data);
        return;
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanCanvasFrame);
  };

  useEffect(() => {
    if (isOpen && scannerMode === 'camera') {
      startCameraStream();
    } else {
      stopCameraStream();
    }
    return () => stopCameraStream();
  }, [isOpen, facingMode, scannerMode]);

  // Toggle Torch Light
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && torchSupported) {
      try {
        const nextState = !isTorchOn;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {}
    }
  };

  // QR Code Detected Event (PAUSES scanner and fetches student profile)
  const handleQRDetected = async (rawToken: string) => {
    setIsScanningActive(false); // Immediate pause scanner loop
    playBeepSound();
    setStatusMessage(null);

    // Call backend API to lookup student profile (DOES NOT AUTO SAVE ATTENDANCE!)
    try {
      const res = await fetch('/thcs/api/qr/scan-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: rawToken,
          class_id: classId,
          session_id: sessionId,
          teacher_name: teacherName,
        }),
      });

      const data = await res.json();

      if (data.success && data.student) {
        setScannedResult({
          student: data.student,
          scan_time: data.scan_time || new Date().toLocaleTimeString('vi-VN'),
          already_scanned: !!data.already_scanned,
          existing_status: data.existing_status,
          scanned_time: data.scanned_time,
          rawToken,
        });
      } else {
        // Error from API (revoked, wrong class, invalid QR)
        setStatusMessage({ text: data.message || 'Mã QR không hợp lệ!', type: 'error' });
        setTimeout(() => {
          setIsScanningActive(true);
          animFrameIdRef.current = requestAnimationFrame(scanCanvasFrame);
        }, 2500);
      }
    } catch (e) {
      setStatusMessage({ text: '⚠️ Lỗi kết nối máy chủ khi kiểm tra QR!', type: 'error' });
      setTimeout(() => {
        setIsScanningActive(true);
        animFrameIdRef.current = requestAnimationFrame(scanCanvasFrame);
      }, 2500);
    }
  };

  // Handle Manual Input Search
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleQRDetected(manualCodeInput.trim());
  };

  // TEACHER CONFIRMS ATTENDANCE ACTION
  const handleConfirmAttendance = async (status: 'PRESENT' | 'LATE' | 'REJECTED') => {
    if (!scannedResult) return;
    setIsConfirming(true);

    try {
      const res = await fetch('/thcs/api/qr/confirm-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: scannedResult.student.student_id,
          class_id: classId,
          status,
          teacher_name: teacherName,
          method: scannerMode === 'camera' ? 'QR_CAMERA' : 'MANUAL_ENTRY',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onAttendanceConfirmed) {
          onAttendanceConfirmed(scannedResult.student.student_id, status);
        }
        setStatusMessage({
          text: status === 'REJECTED' ? '❌ Đã từ chối điểm danh.' : `🎉 ${data.message}`,
          type: status === 'REJECTED' ? 'warning' : 'success',
        });
      } else {
        setStatusMessage({ text: `⚠️ ${data.message}`, type: 'error' });
      }
    } catch (e) {
      setStatusMessage({ text: '⚠️ Lỗi ghi nhận điểm danh!', type: 'error' });
    }

    setIsConfirming(false);
    setScannedResult(null); // Close student verification card modal
    setManualCodeInput('');

    // Automatically resume scanner for next student
    setTimeout(() => {
      setIsScanningActive(true);
      if (scannerMode === 'camera') {
        animFrameIdRef.current = requestAnimationFrame(scanCanvasFrame);
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCameraStream();
        onClose();
      }}
      title={`📷 Camera Quét QR & Đối Chiếu Hồ Sơ Lớp ${classNameTitle}`}
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="text-[#68758D] font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#22C997]" /> Giáo viên trực tiếp đối chiếu & xác nhận
          </div>
          <Button variant="outline" onClick={onClose}>Đóng Camera</Button>
        </div>
      }
    >
      <div className="space-y-4 py-1">

        {/* Mode Selector Tabs (Camera vs Manual Code Input) */}
        <div className="flex items-center gap-1.5 bg-[#FAFBFF] p-1 rounded-2xl border border-[#E1E6F0] text-xs font-bold">
          <button
            onClick={() => setScannerMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scannerMode === 'camera' ? 'bg-[#6C63FF] text-white shadow-xs font-black' : 'text-[#68758D] hover:bg-[#EEECFF]'
            }`}
          >
            <Camera className="h-4 w-4" /> Camera Quét Mã QR
          </button>
          <button
            onClick={() => setScannerMode('manual')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scannerMode === 'manual' ? 'bg-[#6C63FF] text-white shadow-xs font-black' : 'text-[#68758D] hover:bg-[#EEECFF]'
            }`}
          >
            <Keyboard className="h-4 w-4" /> Nhập Mã Thủ Công
          </button>
        </div>

        {/* Global Toast / Notification Bar */}
        {statusMessage && (
          <div className={`p-3 rounded-2xl border text-xs font-extrabold flex items-center justify-between animate-in fade-in ${
            statusMessage.type === 'success' ? 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]' :
            statusMessage.type === 'error' ? 'bg-[#FFEFEF] text-[#D32F2F] border-[#FFC0C3]' :
            'bg-[#FFF9EB] text-[#B47800] border-[#FFE399]'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="p-0.5 hover:opacity-70">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* CAMERA VIEWPORT SECTION */}
        {scannerMode === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-6 rounded-3xl bg-[#FFEFEF] border border-[#FFC0C3] text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-[#D32F2F] mx-auto" />
                <div className="text-sm font-extrabold text-[#D32F2F]">{cameraError}</div>
                <p className="text-xs text-[#68758D]">Bạn có thể bấm nút "Nhập Mã Thủ Công" ở trên để tiếp tục điểm danh mà không cần Camera.</p>
                <Button size="sm" variant="outline" onClick={() => startCameraStream()} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Thử lại Camera
                </Button>
              </div>
            ) : (
              <div className="relative mx-auto w-full max-w-sm h-72 rounded-3xl bg-black overflow-hidden shadow-xl border-2 border-[#6C63FF]">
                {/* Hidden canvas for decoding */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video Stream Element */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Scanner Target Guide Overlay */}
                <div className="absolute inset-0 border-[3px] border-[#22C997]/60 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-[#22C997] shadow-[0_0_12px_#22C997] animate-pulse"></div>
                  <div className="absolute top-2 left-2 text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                    Đặt mã QR vào khung
                  </div>
                </div>

                {/* Camera Top Control Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-2xl border text-white transition-all cursor-pointer backdrop-blur-md ${
                        isTorchOn ? 'bg-amber-500 border-amber-300' : 'bg-black/40 border-white/30 hover:bg-black/60'
                      }`}
                      title="Bật/Tắt Đèn Flash"
                    >
                      {isTorchOn ? <Zap className="h-4 w-4 fill-current" /> : <ZapOff className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="p-2 rounded-2xl bg-black/40 border border-white/30 text-white hover:bg-black/60 transition-all cursor-pointer backdrop-blur-md"
                    title="Đổi Camera Trước/Sau"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANUAL CODE INPUT SECTION */}
        {scannerMode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="p-4 rounded-3xl bg-[#FAFBFF] border border-[#E1E6F0] space-y-3">
            <label className="block text-xs font-extrabold text-[#18243A]">
              Nhập Mã QR hoặc Mã Học Sinh (VD: THCS-QR-v1-... hoặc HS202501):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="Nhập hoặc dán mã QR..."
                className="flex-1 rounded-2xl border border-[#E1E6F0] p-3 text-xs font-extrabold text-[#18243A] focus:outline-none focus:border-[#6C63FF]"
              />
              <Button type="submit" variant="primary" icon={<Search className="h-4 w-4" />}>
                Tra Cứu
              </Button>
            </div>
          </form>
        )}

        {/* MANDATORY STUDENT PHOTO VERIFICATION CARD MODAL */}
        {scannedResult && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 md:p-6 shadow-2xl border-2 border-[#6C63FF] space-y-4 max-h-[90vh] overflow-y-auto">
              
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[#EEECFF] text-[#6C63FF] text-xs font-black">🔍 ĐỐI CHIẾU HỒ SƠ</span>
                  <span className="text-xs font-black text-[#18243A]">Lớp {scannedResult.student.class_name}</span>
                </div>
                <button
                  onClick={() => {
                    setScannedResult(null);
                    setIsScanningActive(true);
                  }}
                  className="text-xs text-[#68758D] font-bold hover:underline cursor-pointer"
                >
                  Bỏ qua ✕
                </button>
              </div>

              {/* DUPLICATE SCAN WARNING IF ALREADY CHECKED IN */}
              {scannedResult.already_scanned && (
                <div className="p-3 rounded-2xl bg-[#FFF9EB] border border-[#FFE399] text-xs font-extrabold text-[#B47800] flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    Học sinh này đã điểm danh lúc <strong>{scannedResult.scanned_time || 'Đầu giờ'}</strong> (Trạng thái: <strong>{scannedResult.existing_status}</strong>). Bạn có thể bấm xác nhận lại nếu muốn đổi kết quả.
                  </span>
                </div>
              )}

              {/* MISSING PHOTO ALERT WARNING */}
              {!scannedResult.student.has_photo && (
                <div className="p-3 rounded-2xl bg-[#FFEFEF] border border-[#FFC0C3] text-xs font-extrabold text-[#D32F2F] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>⚠️ Học sinh chưa có ảnh đối chiếu – giáo viên cần kiểm tra trực tiếp!</span>
                </div>
              )}

              {/* LARGE STUDENT PROFILE PHOTO & NAME DISPLAY */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-32 h-40 rounded-3xl overflow-hidden border-4 border-[#6C63FF] shadow-lg bg-[#FAFBFF] relative flex items-center justify-center">
                  {scannedResult.student.avatar_url ? (
                    <img
                      src={scannedResult.student.avatar_url}
                      alt={scannedResult.student.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <UserAvatar name={scannedResult.student.full_name} size="lg" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-[#6C63FF] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    {scannedResult.student.gender}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#18243A] tracking-tight">{scannedResult.student.full_name}</h2>
                  <div className="text-xs font-mono font-extrabold text-[#6C63FF] mt-0.5">
                    Mã HS: {scannedResult.student.student_code || scannedResult.student.student_id} · {scannedResult.student.class_name}
                  </div>
                  <div className="text-[10px] text-[#68758D] font-bold mt-1">
                    ⏰ Thời gian quét: <span className="font-mono text-[#18243A]">{scannedResult.scan_time}</span>
                  </div>
                </div>
              </div>

              {/* THREE LARGE ACTION BUTTONS FOR TEACHER CONFIRMATION */}
              <div className="space-y-2 pt-2 border-t border-[#E1E6F0]">
                <div className="text-[11px] text-[#68758D] font-extrabold text-center">
                  Vui lòng đối chiếu học sinh thực tế với ảnh hồ sơ ở trên và chọn kết quả:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Button 1: Confirm Present (Green) */}
                  <button
                    disabled={isConfirming}
                    onClick={() => handleConfirmAttendance('PRESENT')}
                    className="py-3 px-3 rounded-2xl bg-[#0E8360] hover:bg-[#0A6B4E] text-white text-xs font-black shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Xác Nhận Có Mặt
                  </button>

                  {/* Button 2: Confirm Late (Orange) */}
                  <button
                    disabled={isConfirming}
                    onClick={() => handleConfirmAttendance('LATE')}
                    className="py-3 px-3 rounded-2xl bg-[#B47800] hover:bg-[#966400] text-white text-xs font-black shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Clock className="h-4 w-4" />
                    Xác Nhận Đi Muộn
                  </button>

                  {/* Button 3: Reject (Red) */}
                  <button
                    disabled={isConfirming}
                    onClick={() => handleConfirmAttendance('REJECTED')}
                    className="py-3 px-3 rounded-2xl bg-[#FFEFEF] hover:bg-[#FFD6D8] border border-[#FFC0C3] text-[#D32F2F] text-xs font-black shadow-2xs hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Từ Chối
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
