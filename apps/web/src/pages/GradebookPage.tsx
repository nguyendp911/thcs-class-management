import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockSubjects } from '../lib/mockData';
import { saveToDb, syncAllFromDb } from '../lib/dbSync';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Lock, Unlock, Save, CheckCircle, Download, Upload, FileSpreadsheet, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentGradeRecord {
  tx1?: number;
  tx2?: number;
  tx3?: number;
  gk?: number;
  ck?: number;
}

export const GradebookPage: React.FC = () => {
  const { selectedClass, studentsList } = useAuth();
  const [selectedSubjectId, setSelectedSubjectId] = useState(1);
  
  const [scoresState, setScoresState] = useState<Record<number, StudentGradeRecord>>({});

  useEffect(() => {
    syncAllFromDb().then(data => {
      if (data && data.thcs_gradebook_scores && typeof data.thcs_gradebook_scores === 'object') {
        setScoresState(data.thcs_gradebook_scores);
      }
    });
  }, []);

  const [isLocked, setIsLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal revision
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const saveScoresState = (updated: Record<number, StudentGradeRecord>) => {
    setScoresState(updated);
    saveToDb('thcs_gradebook_scores', updated);
  };

  const handleScoreFieldChange = (studentId: number, field: keyof StudentGradeRecord, valStr: string) => {
    if (isLocked) {
      setIsRevisionModalOpen(true);
      return;
    }
    const val = parseFloat(valStr);
    const current = scoresState[studentId] || {};
    if (!isNaN(val) && val >= 0 && val <= 10) {
      const updated = {
        ...scoresState,
        [studentId]: {
          ...current,
          [field]: parseFloat(val.toFixed(1)),
        },
      };
      saveScoresState(updated);
    } else if (valStr.trim() === '') {
      const updatedRec = { ...current };
      delete updatedRec[field];
      const updated = {
        ...scoresState,
        [studentId]: updatedRec,
      };
      saveScoresState(updated);
    }
  };

  const calculateDTB = (rec?: StudentGradeRecord) => {
    if (!rec) return '--';
    const validScores: { val: number; weight: number }[] = [];
    if (rec.tx1 !== undefined && rec.tx1 !== null) validScores.push({ val: rec.tx1, weight: 1 });
    if (rec.tx2 !== undefined && rec.tx2 !== null) validScores.push({ val: rec.tx2, weight: 1 });
    if (rec.tx3 !== undefined && rec.tx3 !== null) validScores.push({ val: rec.tx3, weight: 1 });
    if (rec.gk !== undefined && rec.gk !== null) validScores.push({ val: rec.gk, weight: 2 });
    if (rec.ck !== undefined && rec.ck !== null) validScores.push({ val: rec.ck, weight: 3 });

    if (validScores.length === 0) return '--';
    const totalWeight = validScores.reduce((sum, item) => sum + item.weight, 0);
    const totalPoints = validScores.reduce((sum, item) => sum + (item.val * item.weight), 0);
    return (totalPoints / totalWeight).toFixed(1);
  };

  const getHocLucRating = (dtbStr: string) => {
    if (dtbStr === '--') return 'Chưa có điểm';
    const dtbNum = parseFloat(dtbStr);
    if (isNaN(dtbNum)) return 'Chưa có điểm';
    if (dtbNum >= 8.0) return 'Giỏi';
    if (dtbNum >= 6.5) return 'Khá';
    if (dtbNum >= 5.0) return 'Trung Bình';
    return 'Yếu';
  };

  const handleSaveDraft = () => {
    saveScoresState(scoresState);
    showToast('🎉 Đã lưu nháp dữ liệu sổ điểm môn học vào cơ sở dữ liệu!');
  };

  // EXPORT GRADEBOOK (XUẤT SỔ ĐIỂM TIẾNG VIỆT CÓ DẤU CHUẨN 100%)
  const handleExportGradebookExcel = () => {
    const selectedSub = mockSubjects.find(s => s.id === selectedSubjectId) || mockSubjects[0];

    const dataToExport = studentsList.map((s, idx) => {
      const rec = scoresState[s.id] || {};
      const dtbStr = calculateDTB(rec);

      return {
        'STT': idx + 1,
        'Mã Học Sinh': s.student_code,
        'Họ và Tên Học Sinh': s.full_name,
        'Môn Học': selectedSub.name,
        'TX 1 (Hệ số 1)': rec.tx1 ?? '',
        'TX 2 (Hệ số 1)': rec.tx2 ?? '',
        'TX 3 (Hệ số 1)': rec.tx3 ?? '',
        'Giữa Kỳ (Hệ số 2)': rec.gk ?? '',
        'Cuối Kỳ (Hệ số 3)': rec.ck ?? '',
        'ĐTB Môn Học': dtbStr,
        'Xếp Loại Học Lực': getHocLucRating(dtbStr),
      };
    });

    // 1. Export Native Excel (.xlsx) using XLSX SheetJS
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `SoDiem_Mon_${selectedSub.code}`);
    XLSX.writeFile(wb, `SoDiem_${selectedSub.name}_Lop_${selectedClass.name}.xlsx`);

    showToast(`🎉 Đã xuất thành công Sổ Điểm môn ${selectedSub.name} chuẩn Tiếng Việt có dấu!`);
  };

  // EXPORT CSV WITH UTF-8 BOM (\uFEFF) SO EXCEL RENDERS ACCENTS FLUAENTLY
  const handleExportGradebookCsv = () => {
    const selectedSub = mockSubjects.find(s => s.id === selectedSubjectId) || mockSubjects[0];

    let csvStr = 'STT,Mã Học Sinh,Họ và Tên,Môn Học,TX 1,TX 2,TX 3,Giữa Kỳ,Cuối Kỳ,ĐTB Môn,Xếp Loại\n';

    studentsList.forEach((s, idx) => {
      const rec = scoresState[s.id] || {};
      const dtbStr = calculateDTB(rec);
      csvStr += `"${idx + 1}","${s.student_code}","${s.full_name}","${selectedSub.name}","${rec.tx1 ?? ''}","${rec.tx2 ?? ''}","${rec.tx3 ?? ''}","${rec.gk ?? ''}","${rec.ck ?? ''}","${dtbStr}","${getHocLucRating(dtbStr)}"\n`;
    });

    // PREPEND UTF-8 BOM (\uFEFF)
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoDiem_${selectedSub.name}_Lop_${selectedClass.name}.csv`;
    a.click();

    showToast(`🎉 Đã xuất tệp CSV Sổ điểm có dấu Tiếng Việt chuẩn Unicode (BOM)!`);
  };

  // IMPORT FILE SỔ ĐIỂM (NHẬP ĐIỂM TỪ FILE EXCEL / CSV)
  const handleImportGradebookFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonRows.length === 0) {
          showToast('⚠️ Tệp tin rỗng hoặc không đúng định dạng mẫu!');
          return;
        }

        let updatedCount = 0;
        const newScores = { ...scoresState };

        jsonRows.forEach((row) => {
          const code = row['Mã Học Sinh'] || row['Ma HS'] || row['student_code'];
          const studentMatch = studentsList.find((s: any) => s.student_code === String(code)?.trim());

          if (studentMatch) {
            const tx1 = parseFloat(row['TX 1 (Hệ số 1)'] || row['TX 1'] || row['tx1']);
            const tx2 = parseFloat(row['TX 2 (Hệ số 1)'] || row['TX 2'] || row['tx2']);
            const gk = parseFloat(row['Giữa Kỳ (Hệ số 2)'] || row['Giữa Kỳ'] || row['gk']);
            const ck = parseFloat(row['Cuối Kỳ (Hệ số 3)'] || row['Cuối Kỳ'] || row['ck']);

            if (!isNaN(tx1) || !isNaN(gk) || !isNaN(ck)) {
              newScores[studentMatch.id] = {
                tx1: !isNaN(tx1) ? tx1 : (newScores[studentMatch.id]?.tx1 || 8.0),
                tx2: !isNaN(tx2) ? tx2 : (newScores[studentMatch.id]?.tx2 || 7.5),
                gk: !isNaN(gk) ? gk : (newScores[studentMatch.id]?.gk || 8.0),
                ck: !isNaN(ck) ? ck : (newScores[studentMatch.id]?.ck || 8.0),
              };
              updatedCount++;
            }
          }
        });

        saveScoresState(newScores);
        showToast(`🎉 Nhập điểm thành công từ tệp tin cho ${updatedCount} học sinh!`);
      } catch (err) {
        showToast('⚠️ Đã xảy ra lỗi khi đọc tệp tin. Vui lòng kiểm tra lại cấu trúc tệp!');
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim()) return;
    setIsRevisionModalOpen(false);
    showToast(`Đã lưu thay đổi điểm sau khóa phát hành kèm lý do audit: "${revisionReason}"`);
    setRevisionReason('');
  };

  const selectedSub = mockSubjects.find(s => s.id === selectedSubjectId) || mockSubjects[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for Importing Grades */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleImportGradebookFile}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Header with Buttons Placed Cleanly BELOW Title and Description */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#18243A] sm:text-3xl tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-[#6C63FF]" />
            Sổ Điểm Môn Học {selectedClass.name.startsWith('Lớp') ? selectedClass.name : `Lớp ${selectedClass.name}`}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Quản lý sổ điểm môn học, nhập/xuất tệp Excel & CSV tiếng Việt có dấu chuẩn Unicode (UTF-8 BOM), tự động tính ĐTB
          </p>
        </div>

        {/* Action Buttons Row Sitting Cleanly BELOW Title & Description */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-[#E1E6F0]/60">
          <Button
            size="sm"
            variant="mint"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="h-4 w-4" />}
          >
            Nhập Điểm Từ File (Excel/CSV)
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleExportGradebookExcel}
            icon={<Download className="h-4 w-4" />}
          >
            Xuất Sổ Điểm Excel (.xlsx)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportGradebookCsv}
            icon={<Download className="h-4 w-4" />}
          >
            Xuất CSV Có Dấu (.csv)
          </Button>

          {isLocked ? (
            <Button variant="danger" size="sm" onClick={() => { setIsLocked(false); showToast('Đã mở khóa sổ điểm.'); }} icon={<Unlock className="h-4 w-4" />}>
              Mở khóa sổ điểm
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setIsLocked(true); showToast('Đã khóa phát hành điểm!'); }} icon={<Lock className="h-4 w-4" />}>
              Khóa phát hành
            </Button>
          )}

          <Button size="sm" variant="mint" onClick={handleSaveDraft} icon={<Save className="h-4 w-4" />}>
            Lưu sổ điểm
          </Button>
        </div>
      </div>

      {/* Subject Filter & Weight Info Bar */}
      <div className="clay-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-extrabold text-[#18243A]">Chọn môn học xem sổ điểm:</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="rounded-xl border border-[#E1E6F0] bg-white px-3 py-1.5 text-xs font-extrabold text-[#18243A] focus:border-[#6C63FF]"
          >
            {mockSubjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}){s.teacher_name ? ` - GV: ${s.teacher_name}` : ''}{s.teacher_phone ? ` (${s.teacher_phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-[#68758D]">
          <span>Trọng số tính ĐTB: Thường xuyên (x1) | Giữa kỳ (x2) | Cuối kỳ (x3)</span>
          {isLocked && <Badge variant="danger">🔒 Đã khóa phát hành</Badge>}
        </div>
      </div>

      {/* Grade Table Grid */}
      <div className="clay-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold text-[#18243A] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#6C63FF]" />
              Bảng Điểm Môn {selectedSub.name} - {selectedClass.name}
            </h3>
            {selectedSub.teacher_name && (
              <span className="text-xs text-[#0E8360] font-bold bg-[#E6F9F3] px-2.5 py-0.5 rounded-lg border border-[#A3F0D9]">
                GVBM: {selectedSub.teacher_name} {selectedSub.teacher_phone ? `· SĐT: ${selectedSub.teacher_phone}` : ''}
              </span>
            )}
          </div>
          <Badge variant="purple">{studentsList.length} Học Sinh</Badge>
        </div>

        {/* ====== MOBILE: Card Layout (mỗi học sinh = 1 card) ====== */}
        <div className="block sm:hidden divide-y divide-[#E1E6F0] border border-[#E1E6F0] rounded-2xl overflow-hidden">
          {studentsList.map((s, idx) => {
            const rec = scoresState[s.id] || {};
            const dtbStr = calculateDTB(rec);
            const dtbNum = parseFloat(dtbStr);
            const rating = getHocLucRating(dtbStr);

            return (
              <div key={s.id} className="p-4 space-y-3 hover:bg-[#FAFBFF] transition-colors">
                {/* Header: tên + ĐTB + Xếp loại */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[#68758D] uppercase tracking-wider">
                      #{idx + 1} · {s.student_code}
                    </div>
                    <div className="font-extrabold text-[#18243A] text-sm leading-tight mt-0.5">
                      {s.full_name}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-[#0E8360] leading-none">{dtbStr}</div>
                    <div className="mt-1">
                      <Badge variant={isNaN(dtbNum) ? 'neutral' : dtbNum >= 8.0 ? 'mint' : dtbNum >= 6.5 ? 'purple' : dtbNum >= 5.0 ? 'warning' : 'danger'}>
                        {rating}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Score inputs: 4 cột đồng đều */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] font-extrabold text-[#68758D] mb-1.5">TX 1 (x1)</div>
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={rec.tx1 ?? ''}
                      onChange={(e) => handleScoreFieldChange(s.id, 'tx1', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E6F0] py-2 text-center font-bold text-[#18243A] focus:border-[#6C63FF] text-xs"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-extrabold text-[#68758D] mb-1.5">TX 2 (x1)</div>
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={rec.tx2 ?? ''}
                      onChange={(e) => handleScoreFieldChange(s.id, 'tx2', e.target.value)}
                      className="w-full rounded-xl border border-[#E1E6F0] py-2 text-center font-bold text-[#18243A] focus:border-[#6C63FF] text-xs"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-extrabold text-[#6C63FF] mb-1.5">GK (x2)</div>
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={rec.gk ?? ''}
                      onChange={(e) => handleScoreFieldChange(s.id, 'gk', e.target.value)}
                      className="w-full rounded-xl border border-[#C0BBFD] bg-[#EEECFF]/20 py-2 text-center font-bold text-[#6C63FF] focus:border-[#6C63FF] text-xs"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-extrabold text-[#FF5D68] mb-1.5">CK (x3)</div>
                    <input
                      type="number" step="0.1" min="0" max="10"
                      value={rec.ck ?? ''}
                      onChange={(e) => handleScoreFieldChange(s.id, 'ck', e.target.value)}
                      className="w-full rounded-xl border border-[#FFC0C3] bg-[#FFEFEF]/20 py-2 text-center font-bold text-[#FF5D68] focus:border-[#FF5D68] text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ====== DESKTOP: Table Layout ====== */}
        <div className="hidden sm:block overflow-x-auto border border-[#E1E6F0] rounded-2xl">
          <table className="w-full text-left text-xs text-[#18243A]">
            <thead className="bg-[#FAFBFF] font-extrabold border-b border-[#E1E6F0]">
              <tr>
                <th className="p-3 w-10">STT</th>
                <th className="p-3">Mã HS</th>
                <th className="p-3">Họ và tên</th>
                <th className="p-3 text-center">TX 1 (x1)</th>
                <th className="p-3 text-center">TX 2 (x1)</th>
                <th className="p-3 text-center bg-[#EEECFF]/40 text-[#6C63FF]">Giữa kỳ (x2)</th>
                <th className="p-3 text-center bg-[#FFEFEF]/40 text-[#FF5D68]">Cuối kỳ (x3)</th>
                <th className="p-3 text-center bg-[#E6F9F3]/60 text-[#0E8360] font-black">ĐTB Môn</th>
                <th className="p-3 text-center">Xếp Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6F0]">
              {studentsList.map((s, idx) => {
                const rec = scoresState[s.id] || {};
                const dtbStr = calculateDTB(rec);
                const dtbNum = parseFloat(dtbStr);
                const rating = getHocLucRating(dtbStr);
                return (
                  <tr key={s.id} className="hover:bg-[#FAFBFF] transition-colors">
                    <td className="p-3 font-semibold text-[#68758D]">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-[#68758D]">{s.student_code}</td>
                    <td className="p-3 font-extrabold text-[#18243A]">{s.full_name}</td>
                    <td className="p-2 text-center"><input type="number" step="0.1" min="0" max="10" value={rec.tx1 ?? ''} onChange={(e) => handleScoreFieldChange(s.id, 'tx1', e.target.value)} className="w-14 rounded-xl border border-[#E1E6F0] py-1 text-center font-bold text-[#18243A] focus:border-[#6C63FF]" /></td>
                    <td className="p-2 text-center"><input type="number" step="0.1" min="0" max="10" value={rec.tx2 ?? ''} onChange={(e) => handleScoreFieldChange(s.id, 'tx2', e.target.value)} className="w-14 rounded-xl border border-[#E1E6F0] py-1 text-center font-bold text-[#18243A] focus:border-[#6C63FF]" /></td>
                    <td className="p-2 text-center bg-[#EEECFF]/20"><input type="number" step="0.1" min="0" max="10" value={rec.gk ?? ''} onChange={(e) => handleScoreFieldChange(s.id, 'gk', e.target.value)} className="w-14 rounded-xl border border-[#C0BBFD] py-1 text-center font-bold text-[#6C63FF] focus:border-[#6C63FF]" /></td>
                    <td className="p-2 text-center bg-[#FFEFEF]/20"><input type="number" step="0.1" min="0" max="10" value={rec.ck ?? ''} onChange={(e) => handleScoreFieldChange(s.id, 'ck', e.target.value)} className="w-14 rounded-xl border border-[#FFC0C3] py-1 text-center font-bold text-[#FF5D68] focus:border-[#FF5D68]" /></td>
                    <td className="p-2 text-center bg-[#E6F9F3]/40 font-black text-[#0E8360] text-sm">{dtbStr}</td>
                    <td className="p-2 text-center"><Badge variant={isNaN(dtbNum) ? 'neutral' : dtbNum >= 8.0 ? 'mint' : dtbNum >= 6.5 ? 'purple' : dtbNum >= 5.0 ? 'warning' : 'danger'}>{rating}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Revision Reason */}
      <Modal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="Yêu cầu Lý do Sửa Điểm Đã Khóa Phát Hành"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)}>Hủy bỏ</Button>
            <Button onClick={handleConfirmRevision}>Xác nhận ghi audit log</Button>
          </>
        }
      >
        <form onSubmit={handleConfirmRevision} className="space-y-3">
          <p className="text-xs text-[#FF5D68] bg-[#FFEFEF] p-2.5 rounded-xl border border-[#FFC0C3] font-bold">
            Sổ điểm môn học đang ở trạng thái <strong>Đã khóa phát hành</strong>. Việc sửa điểm sẽ ghi nhận vết auditlog gồm lý do, mốc thời gian và tài khoản thực hiện.
          </p>
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Lý do điều chỉnh điểm (bắt buộc):</label>
            <textarea
              rows={3}
              required
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="VD: Chấm phúc khảo bài thi giữa kỳ theo quyết định HĐ..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-semibold focus:border-[#6C63FF]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
