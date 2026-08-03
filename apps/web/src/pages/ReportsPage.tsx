import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Download, FileSpreadsheet, CheckCircle, FileText, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper function to remove Vietnamese diacritics for clean PDF font rendering
function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const ReportsPage: React.FC = () => {
  const { selectedClass, selectedSchoolYear, selectedSemester, studentsList: students } = useAuth();
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reportList = [
    { code: 'CLASS_ROSTER', name: 'Báo cáo Danh sách Sĩ số Lớp', desc: `Danh sách ${students.length} học sinh, mã HS, ngày sinh, tổ`, format: ['Excel', 'PDF'] },
    { code: 'CONTACT_LIST', name: 'Thông tin Danh bạ Liên hệ Phụ huynh', desc: 'Danh bạ phụ huynh chính, SĐT, địa chỉ khẩn cấp', format: ['Excel'] },
    { code: 'ATTENDANCE_SUMMARY', name: 'Báo cáo Tổng hợp Chuyên cần', desc: 'Thống kê tổng hợp số buổi vắng có phép, không phép, đi muộn', format: ['Excel', 'PDF'] },
    { code: 'LEAVE_REQUESTS', name: 'Báo cáo Lịch sử Đơn xin nghỉ', desc: 'Lịch sử xin nghỉ và trạng thái phê duyệt của GVCN', format: ['Excel', 'PDF'] },
    { code: 'GRADEBOOK', name: 'Báo cáo Sổ điểm Học kỳ II', desc: 'Ma trận điểm môn học, trung bình thường xuyên, giữa kỳ, cuối kỳ', format: ['Excel', 'PDF'] },
    { code: 'CONDUCT_SUMMARY', name: 'Báo cáo Thi đua & Xếp loại Rèn luyện', desc: 'Tổng hợp điểm thưởng, vi phạm và xếp loại thi đua', format: ['Excel', 'PDF'] },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportExcel = (reportName: string) => {
    setExportingReport(reportName);
    setTimeout(() => {
      // Full UTF-8 Vietnamese accents for Excel spreadsheets
      const data = students.map((s, idx) => ({
        'STT': idx + 1,
        'Mã Học Sinh': s.student_code,
        'Họ và Tên': s.full_name,
        'Giới Tính': s.gender,
        'Ngày Sinh': s.date_of_birth,
        'Tổ': s.group_name || '',
        'Phụ Huynh Liên Hệ': s.primary_guardian_name || '',
        'Số Điện Thoại': s.primary_guardian_phone || '',
        'Trạng Thái': s.status,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach');
      XLSX.writeFile(wb, `${removeVietnameseTones(reportName)}_Lop_${selectedClass.name}.xlsx`);

      setExportingReport(null);
      showToast(`Đã xuất thành công tệp Excel: ${reportName}`);
    }, 400);
  };

  const handleExportPDF = (reportName: string) => {
    setExportingReport(reportName);
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Clean non-accented text for PDF engine to prevent garbled characters
      const cleanSchoolTitle = removeVietnameseTones(`TRUONG THCS QUAN LY - BAO CAO LOP ${selectedClass.name}`);
      const cleanSubTitle = removeVietnameseTones(`Nam hoc: ${selectedSchoolYear.name} | ${selectedSemester.name}`);
      const cleanReportTitle = removeVietnameseTones(`Ten bao cao: ${reportName}`);

      doc.setFontSize(14);
      doc.text(cleanSchoolTitle, 14, 15);
      doc.setFontSize(10);
      doc.text(cleanSubTitle, 14, 22);
      doc.text(cleanReportTitle, 14, 28);

      const tableData = students.map((s, idx) => [
        idx + 1,
        s.student_code,
        removeVietnameseTones(s.full_name),
        removeVietnameseTones(s.gender),
        s.date_of_birth,
        removeVietnameseTones(s.group_name || ''),
        s.primary_guardian_phone || '',
      ]);

      autoTable(doc, {
        startY: 34,
        head: [['STT', 'Ma HS', 'Ho va Ten', 'Gioi Tinh', 'Ngay Sinh', 'To', 'SDT']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [108, 99, 255] }
      });

      doc.save(`${removeVietnameseTones(reportName)}_Lop_${selectedClass.name}.pdf`);
      setExportingReport(null);
      showToast(`Đã xuất thành công tệp PDF sạch font: ${reportName}`);
    }, 400);
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
            <FileText className="h-7 w-7 text-[#6C63FF]" />
            Báo Cáo & Xuất File Dữ Liệu {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Xuất dữ liệu chuẩn Excel / PDF (sạch font chữ, không bị lỗi kí tự) cho năm học {selectedSchoolYear.name} - {selectedSemester.name}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
            In báo cáo trực tiếp (Full Font Tiếng Việt)
          </Button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportList.map(report => (
          <div key={report.code} className="clay-card p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#EEECFF] flex items-center justify-center text-[#6C63FF] border border-[#C0BBFD]">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <Badge variant="purple">{report.format.join(' & ')}</Badge>
              </div>

              <h3 className="text-base font-extrabold text-[#18243A]">{report.name}</h3>
              <p className="text-xs text-[#68758D] font-medium mt-1 leading-relaxed">{report.desc}</p>
            </div>

            <div className="pt-3 border-t border-[#E1E6F0] flex items-center gap-2">
              {report.format.includes('Excel') && (
                <Button
                  size="sm"
                  variant="mint"
                  className="flex-1"
                  disabled={exportingReport === report.name}
                  onClick={() => handleExportExcel(report.name)}
                  icon={<Download className="h-4 w-4" />}
                >
                  Xuất Excel (UTF-8)
                </Button>
              )}

              {report.format.includes('PDF') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={exportingReport === report.name}
                  onClick={() => handleExportPDF(report.name)}
                  icon={<Download className="h-4 w-4" />}
                >
                  Xuất PDF (Sạch Font)
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
