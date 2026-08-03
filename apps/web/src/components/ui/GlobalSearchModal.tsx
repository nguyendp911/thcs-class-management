import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { selectedClass, permittedClasses, studentsList } = useAuth();
  const [query, setQuery] = useState('');
  const classId = selectedClass?.id || 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search modal via custom event or parent prop
          window.dispatchEvent(new Event('open_global_search'));
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Navigation Items
  const navResults = [
    { title: 'Tổng quan Dashboard', path: '/app/dashboard', icon: 'fa-chart-pie text-[#6C63FF]' },
    { title: 'Sơ đồ Chỗ ngồi Lớp học', path: `/app/classes/${classId}/seating-chart`, icon: 'fa-table-cells text-[#22C997]' },
    { title: 'Bảng tin Lớp học (Feed)', path: `/app/classes/${classId}/feed`, icon: 'fa-bolt text-[#F6B73C]' },
    { title: 'Hồ sơ Học sinh', path: `/app/classes/${classId}/students`, icon: 'fa-user-graduate text-[#22C997]' },
    { title: 'Chuyên cần & Điểm danh', path: `/app/classes/${classId}/attendance`, icon: 'fa-clipboard-user text-[#6C63FF]' },
    { title: 'Đơn xin nghỉ học', path: `/app/classes/${classId}/leave-requests`, icon: 'fa-file-signature text-[#FF5D68]' },
    { title: 'Sổ điểm & Học tập', path: `/app/classes/${classId}/gradebook`, icon: 'fa-graduation-cap text-[#6C63FF]' },
    { title: 'Rèn luyện & Thi đua', path: `/app/classes/${classId}/conduct`, icon: 'fa-award text-[#F6B73C]' },
    { title: 'Thời khóa biểu', path: `/app/classes/${classId}/timetable`, icon: 'fa-calendar-days text-[#22C997]' },
    { title: 'Bài tập về nhà', path: `/app/classes/${classId}/assignments`, icon: 'fa-book-bookmark text-[#6C63FF]' },
    { title: 'Sự cố & Kỷ luật', path: `/app/classes/${classId}/incidents`, icon: 'fa-triangle-exclamation text-[#FF5D68]' },
    { title: 'Báo cáo & Xuất file', path: `/app/classes/${classId}/reports`, icon: 'fa-file-export text-[#22C997]' },
    { title: 'Quản trị & Phân quyền', path: '/app/admin', icon: 'fa-shield-halved text-[#B47800]' },
  ].filter(item => !cleanQuery || item.title.toLowerCase().includes(cleanQuery));

  // Student Results
  const studentResults = (studentsList || []).filter(s => 
    !cleanQuery || 
    s.full_name.toLowerCase().includes(cleanQuery) || 
    (s.student_code && s.student_code.toLowerCase().includes(cleanQuery))
  ).slice(0, 5);

  // Class Results
  const classResults = (permittedClasses || []).filter(c =>
    !cleanQuery || c.name.toLowerCase().includes(cleanQuery) || c.room.toLowerCase().includes(cleanQuery)
  );

  const handleSelect = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E1E6F0] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-[#E1E6F0] flex items-center gap-3 bg-[#FAFBFF]">
          <i className="fa-solid fa-magnifying-glass text-[#6C63FF] text-lg shrink-0"></i>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm học sinh, lớp học, đơn xin nghỉ, chức năng... (Ctrl + K)"
            className="w-full bg-transparent text-sm font-extrabold text-[#18243A] placeholder-[#68758D] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-xs font-bold text-[#68758D] hover:bg-[#EEECFF] px-2 py-1 rounded-xl transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1">
          {/* Students Section */}
          {studentResults.length > 0 && (
            <div>
              <div className="text-[10px] font-extrabold text-[#68758D] uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-user-graduate text-[#22C997]"></i> Học sinh ({studentResults.length})
              </div>
              <div className="space-y-1">
                {studentResults.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleSelect(`/app/classes/${classId}/students?search=${encodeURIComponent(st.full_name)}`)}
                    className="p-2.5 rounded-2xl hover:bg-[#EEECFF] border border-transparent hover:border-[#C0BBFD] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22C997] to-[#10B981] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                        {st.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#18243A]">{st.full_name}</div>
                        <div className="text-[10px] text-[#68758D] font-mono">Mã: {st.student_code || 'HS001'} • {st.class_name || selectedClass?.name}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#6C63FF] bg-white px-2 py-1 rounded-lg border border-[#E1E6F0]">Xem hồ sơ →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes Section */}
          {classResults.length > 0 && (
            <div>
              <div className="text-[10px] font-extrabold text-[#68758D] uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-chalkboard text-[#F6B73C]"></i> Lớp học được phân công
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {classResults.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleSelect(`/app/classes/${cls.id}/students`)}
                    className="p-2.5 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] hover:bg-[#EEECFF] hover:border-[#C0BBFD] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-[#18243A]">{cls.name}</div>
                      <div className="text-[10px] text-[#68758D] font-medium">{cls.room} • GV: {cls.homeroom_teacher_name}</div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-[#6C63FF]"></i>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Features Navigation */}
          {navResults.length > 0 && (
            <div>
              <div className="text-[10px] font-extrabold text-[#68758D] uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <i className="fa-solid fa-compass text-[#6C63FF]"></i> Chức năng & Trang ứng dụng
              </div>
              <div className="space-y-1">
                {navResults.map((item) => (
                  <div
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="p-2.5 rounded-2xl hover:bg-[#EEECFF] border border-transparent hover:border-[#C0BBFD] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FAFBFF] border border-[#E1E6F0] flex items-center justify-center shrink-0">
                        <i className={`fa-solid ${item.icon} text-sm`}></i>
                      </div>
                      <span className="text-xs font-extrabold text-[#18243A]">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#68758D] font-mono">Truy cập →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {studentResults.length === 0 && classResults.length === 0 && navResults.length === 0 && (
            <div className="p-8 text-center text-xs font-extrabold text-[#68758D]">
              <i className="fa-solid fa-face-frown text-2xl text-[#C0BBFD] mb-2 block"></i>
              Không tìm thấy kết quả phù hợp với từ khóa "{query}"
            </div>
          )}
        </div>

        {/* Modal Footer Tip */}
        <div className="p-3 bg-[#FAFBFF] border-t border-[#E1E6F0] flex items-center justify-between text-[11px] font-bold text-[#68758D]">
          <span>💡 Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-white border border-[#E1E6F0] rounded-md font-mono text-[10px]">Ctrl + K</kbd> mọi lúc để tìm kiếm</span>
          <span>Bấm ESC để đóng</span>
        </div>
      </div>
    </div>
  );
};
