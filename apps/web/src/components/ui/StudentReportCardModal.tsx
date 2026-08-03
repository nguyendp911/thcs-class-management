import React, { useRef } from 'react';
import type { Student, ClassItem } from '../../types';
import { Modal } from './Modal';
import { Button } from './Button';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classInfo: ClassItem | null;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  student,
  classInfo,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const sampleGrades = [
    { subject: 'Toán Học', m1: '9.0', m2: '8.5', t1: '8.0', hk: '9.0', tbm: '8.7' },
    { subject: 'Ngữ Văn', m1: '8.0', m2: '8.0', t1: '7.5', hk: '8.5', tbm: '8.1' },
    { subject: 'Tiếng Anh', m1: '9.5', m2: '9.0', t1: '9.5', hk: '9.0', tbm: '9.2' },
    { subject: 'Vật Lý', m1: '8.5', m2: '8.0', t1: '8.5', hk: '8.5', tbm: '8.5' },
    { subject: 'Hóa Học', m1: '9.0', m2: '8.5', t1: '8.0', hk: '9.0', tbm: '8.7' },
    { subject: 'Sinh Học', m1: '8.0', m2: '8.5', t1: '9.0', hk: '8.5', tbm: '8.6' },
    { subject: 'Lịch Sử & Địa Lý', m1: '8.5', m2: '9.0', t1: '8.5', hk: '8.0', tbm: '8.5' },
    { subject: 'GDCD / GDKT-PL', m1: '9.0', m2: '9.0', t1: '9.5', hk: '9.5', tbm: '9.3' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📄 Phiếu Liên Lạc Điện Tử - Học Sinh: ${student.full_name}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={handlePrint} icon={<i className="fa-solid fa-print"></i>}>
            🖨️ In Phiếu Liên Lạc / Xuất PDF
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="p-6 bg-white rounded-2xl border border-[#E1E6F0] space-y-6 print:border-none print:p-0">
        {/* Printable Header */}
        <div className="flex items-center justify-between border-b-2 border-[#18243A] pb-4">
          <div>
            <div className="text-xs font-black text-[#68758D] uppercase tracking-wider">BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div className="text-sm font-black text-[#18243A] uppercase tracking-tight">TRƯỜNG TRUNG HỌC CƠ SỞ CHU VĂN AN</div>
            <div className="text-[11px] font-bold text-[#68758D]">Năm học 2025 - 2026 • Học kỳ I</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-[#6C63FF] uppercase tracking-widest">PHIẾU LIÊN LẠC ĐIỆN TỬ</div>
            <div className="text-[10px] text-[#68758D] font-mono mt-0.5">Mã số HS: {student.student_code || 'HS001'}</div>
          </div>
        </div>

        {/* Student Profile Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAFBFF] p-4 rounded-2xl border border-[#E1E6F0] text-xs font-bold text-[#18243A]">
          <div>Họ và tên: <strong className="text-[#6C63FF] font-black">{student.full_name}</strong></div>
          <div>Lớp: <strong className="text-[#18243A] font-black">{student.class_name || classInfo?.name || 'Lớp 8A1'}</strong></div>
          <div>Ngày sinh: <span className="font-mono">{student.date_of_birth || '2012-05-15'}</span></div>
          <div>Giới tính: <span>{student.gender === 'nữ' ? 'Nữ' : 'Nam'}</span></div>
          <div>GVCN: <span>{classInfo?.homeroom_teacher_name || 'Cô Trần Thị Minh Hương'}</span></div>
          <div>Phụ huynh: <span>{student.primary_guardian_name || 'Phạm Thị Thu Hà'} ({student.primary_guardian_phone || '0901234567'})</span></div>
        </div>

        {/* Grades Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-[#18243A] uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-graduation-cap text-[#6C63FF]"></i> Bảng Điểm Thành Phần & Tổng Kết
          </h4>
          <div className="overflow-x-auto rounded-xl border border-[#E1E6F0]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EEECFF] text-[#18243A] font-extrabold border-b border-[#C0BBFD]">
                <tr>
                  <th className="p-2.5">Môn học</th>
                  <th className="p-2.5 text-center">Miệng / 15p</th>
                  <th className="p-2.5 text-center">1 Tiết</th>
                  <th className="p-2.5 text-center">Thi HK</th>
                  <th className="p-2.5 text-center bg-[#6C63FF] text-white">TBM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0] font-bold text-[#18243A]">
                {sampleGrades.map((g) => (
                  <tr key={g.subject} className="hover:bg-[#FAFBFF]">
                    <td className="p-2.5 font-extrabold">{g.subject}</td>
                    <td className="p-2.5 text-center font-mono text-[#68758D]">{g.m1}, {g.m2}</td>
                    <td className="p-2.5 text-center font-mono text-[#68758D]">{g.t1}</td>
                    <td className="p-2.5 text-center font-mono text-[#18243A]">{g.hk}</td>
                    <td className="p-2.5 text-center font-mono font-black text-[#6C63FF] bg-[#EEECFF]/40">{g.tbm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall Summary & Conduct */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#E6F9F3] border border-[#A3F0D9] space-y-1.5 text-xs font-bold text-[#0E8360]">
            <div className="font-extrabold text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-award text-[#22C997]"></i> Kết quả Tổng kết Học kỳ I:
            </div>
            <div>• Điểm trung bình các môn: <strong className="text-[#0E8360] font-mono text-sm">8.6 (Giỏi)</strong></div>
            <div>• Kết quả Rèn luyện & Hạnh kiểm: <strong className="text-[#0E8360]">TỐT</strong></div>
            <div>• Chuyên cần: <strong className="text-[#0E8360]">Đủ 100% số buổi (Không vắng)</strong></div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] space-y-1.5 text-xs">
            <div className="font-extrabold text-[#18243A] text-sm">✍️ Nhận xét của GVCN:</div>
            <p className="text-[#68758D] font-bold leading-relaxed italic">
              "Em {student.full_name} ngoan ngoãn, gương mẫu, chấp hành tốt nội quy nhà trường. Tư duy học tập thông minh, chủ động xây dựng bài. Gia đình cần tiếp tục động viên em giữ vững phong độ!"
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center pt-4 text-xs font-bold text-[#18243A]">
          <div>
            <div>Ý kiến & Chữ ký Phụ huynh</div>
            <div className="text-[10px] text-[#68758D] font-normal italic mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
            <div className="font-extrabold">{student.primary_guardian_name || 'Phạm Thị Thu Hà'}</div>
          </div>
          <div>
            <div>Giáo viên Chủ nhiệm</div>
            <div className="text-[10px] text-[#68758D] font-normal italic mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
            <div className="font-extrabold">{classInfo?.homeroom_teacher_name || 'Cô Trần Thị Minh Hương'}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
