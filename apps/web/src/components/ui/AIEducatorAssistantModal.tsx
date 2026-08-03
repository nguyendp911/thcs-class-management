import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { Button } from './Button';

interface AIEducatorAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentName?: string;
}

export const AIEducatorAssistantModal: React.FC<AIEducatorAssistantModalProps> = ({
  isOpen,
  onClose,
  defaultStudentName,
}) => {
  const { selectedClass, studentsList } = useAuth();
  const [activeTab, setActiveTab] = useState<'remarks' | 'quiz'>('remarks');
  const [selectedStudent, setSelectedStudent] = useState(defaultStudentName || (studentsList[0]?.full_name || 'Học sinh'));

  // Remarks Generator State
  const [academicPerformance, setAcademicPerformance] = useState('Giỏi');
  const [conductGrade, setConductGrade] = useState('Tốt');
  const [generatedRemark, setGeneratedRemark] = useState('');
  const [isGeneratingRemark, setIsGeneratingRemark] = useState(false);

  // Quiz Generator State
  const [selectedSubject, setSelectedSubject] = useState('Toán');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(selectedClass?.grade_level || 'Khối 8');
  const [generatedQuiz, setGeneratedQuiz] = useState<Array<{ id: number; question: string; options: string[]; answer: string; explanation: string }>>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Copy Status Toast
  const [copied, setCopied] = useState(false);

  const subjectsList = ['Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý', 'GDCD'];

  const handleGenerateRemark = () => {
    setIsGeneratingRemark(true);
    setTimeout(() => {
      let remark = '';
      if (academicPerformance === 'Giỏi') {
        remark = `Em ${selectedStudent} ngoan ngoãn, lễ phép, có ý thức kỷ luật tốt. Tư duy học tập thông minh, chủ động xây dựng bài. Tiếp thu bài nhanh ở các môn Tự nhiên và Xã hội. Cần tiếp tục duy trì thành tích tốt trong học kỳ tiếp theo!`;
      } else if (academicPerformance === 'Khá') {
        remark = `Em ${selectedStudent} có tinh thần tự học tốt, hăng hái phát biểu xây dựng bài trên lớp. Cần cẩn thận hơn trong các bài kiểm tra trắc nghiệm và phân bổ thời gian làm bài hợp lý để nâng cao kết quả học tập.`;
      } else {
        remark = `Em ${selectedStudent} có cố gắng trong học tập, hoàn thành đầy đủ bài tập về nhà. Cần tập trung lắng nghe giảng bài hơn và nhờ thầy cô hỗ trợ các phần kiến thức còn vướng mắc.`;
      }
      setGeneratedRemark(remark);
      setIsGeneratingRemark(false);
    }, 600);
  };

  const handleGenerateQuiz = () => {
    setIsGeneratingQuiz(true);
    setTimeout(() => {
      let mockQuiz = [];
      if (selectedSubject === 'Toán') {
        mockQuiz = [
          {
            id: 1,
            question: `Cho đa thức P(x) = x² - 4x + 4. Giá trị của P(2) bằng bao nhiêu?`,
            options: ['A. 0', 'B. 2', 'C. 4', 'D. -4'],
            answer: 'A. 0',
            explanation: 'Thay x = 2 vào đa thức: P(2) = 2² - 4(2) + 4 = 4 - 8 + 4 = 0.'
          },
          {
            id: 2,
            question: `Hình bình hành có hai đường chéo vuông góc với nhau là hình gì?`,
            options: ['A. Hình chữ nhật', 'B. Hình thoi', 'C. Hình vuông', 'D. Hình thang cân'],
            answer: 'B. Hình thoi',
            explanation: 'Theo dấu hiệu nhận biết: Hình bình hành có 2 đường chéo vuông góc là hình thoi.'
          },
          {
            id: 3,
            question: `Rút gọn biểu thức (x + 3)² - (x - 3)² thu được kết quả là:`,
            options: ['A. 12x', 'B. 6x', 'C. 18', 'D. 0'],
            answer: 'A. 12x',
            explanation: '(x+3)² - (x-3)² = (x²+6x+9) - (x²-6x+9) = 12x.'
          }
        ];
      } else if (selectedSubject === 'Tiếng Anh') {
        mockQuiz = [
          {
            id: 1,
            question: `Choose the word whose underlined part is pronounced differently:`,
            options: ['A. washed', 'B. stopped', 'C. looked', 'D. played'],
            answer: 'D. played',
            explanation: `'played' có đuôi -ed phát âm là /d/, các từ còn lại phát âm là /t/.`
          },
          {
            id: 2,
            question: `She suggested __________ to the English speaking club every Saturday.`,
            options: ['A. to go', 'B. going', 'C. go', 'D. went'],
            answer: 'B. going',
            explanation: 'Cấu trúc suggest + V-ing: gợi ý làm việc gì đó.'
          }
        ];
      } else {
        mockQuiz = [
          {
            id: 1,
            question: `Tác phẩm "Làng" của tác giả Kim Lân thể hiện tình cảm nổi bật nào?`,
            options: ['A. Tình yêu quê hương gắn liền với tình yêu đất nước', 'B. Tình cảm gia đình sâu nặng', 'C. Tình đồng chí gắn bó', 'D. Tình thầy trò thiêng liêng'],
            answer: 'A. Tình yêu quê hương gắn liền với tình yêu đất nước',
            explanation: 'Nhân vật ông Hai đại diện cho người nông dân Việt Nam có tình yêu làng quê hòa quyện với lòng yêu nước.'
          }
        ];
      }
      setGeneratedQuiz(mockQuiz);
      setIsGeneratingQuiz(false);
    }, 700);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🤖 AI Trợ Lý Giáo Viên & Nhận Xét Học Bạ THCS"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-bold text-[#68758D]">⚡ AI Antigravity powered by Google Deepmind</span>
          <Button variant="outline" onClick={onClose}>Đóng cửa sổ</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-[#E1E6F0] pb-2">
          <button
            onClick={() => setActiveTab('remarks')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'remarks'
                ? 'bg-[#6C63FF] text-white shadow-md'
                : 'bg-[#FAFBFF] text-[#68758D] hover:bg-[#EEECFF]'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i> 1. Sinh Nhận Xét Học Bạ AI
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'quiz'
                ? 'bg-[#6C63FF] text-white shadow-md'
                : 'bg-[#FAFBFF] text-[#68758D] hover:bg-[#EEECFF]'
            }`}
          >
            <i className="fa-solid fa-brain"></i> 2. Sinh Đề Ôn Tập Môn Học AI
          </button>
        </div>

        {/* TAB 1: REPORT REMARKS */}
        {activeTab === 'remarks' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Chọn học sinh:</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  {studentsList.map((s) => (
                    <option key={s.id} value={s.full_name}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Học lực kỳ:</label>
                <select
                  value={academicPerformance}
                  onChange={(e) => setAcademicPerformance(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  <option value="Giỏi">Xuất sắc / Giỏi</option>
                  <option value="Khá">Khá</option>
                  <option value="Trung bình">Đạt / Trung bình</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Rèn luyện:</label>
                <select
                  value={conductGrade}
                  onChange={(e) => setConductGrade(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  <option value="Tốt">Tốt</option>
                  <option value="Khá">Khá</option>
                  <option value="Đạt">Đạt</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateRemark}
              disabled={isGeneratingRemark}
              className="w-full justify-center"
              icon={<i className="fa-solid fa-sparkles text-amber-300"></i>}
            >
              {isGeneratingRemark ? 'Đang tạo câu nhận xét...' : '⚡ Sinh Nhận Xét AI Chuẩn GD&ĐT'}
            </Button>

            {generatedRemark && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAFBFF] to-[#EEECFF]/40 border border-[#C0BBFD] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#6C63FF] flex items-center gap-1.5">
                    <i className="fa-solid fa-[#6C63FF] fa-quote-left"></i> Câu nhận xét đề xuất cho {selectedStudent}:
                  </span>
                  <button
                    onClick={() => handleCopyText(generatedRemark)}
                    className="text-xs font-extrabold text-[#22C997] bg-[#E6F9F3] px-3 py-1 rounded-xl border border-[#A3F0D9] hover:bg-[#A3F0D9] transition-colors cursor-pointer"
                  >
                    {copied ? '✓ Đã sao chép!' : '📋 Sao chép câu nhận xét'}
                  </button>
                </div>
                <p className="text-xs font-bold text-[#18243A] leading-relaxed bg-white p-3 rounded-xl border border-[#E1E6F0] italic">
                  "{generatedRemark}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZ GENERATOR */}
        {activeTab === 'quiz' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Môn học:</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  {subjectsList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Khối lớp:</label>
                <select
                  value={selectedGradeLevel}
                  onChange={(e) => setSelectedGradeLevel(e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  <option value="Khối 6">Khối 6</option>
                  <option value="Khối 7">Khối 7</option>
                  <option value="Khối 8">Khối 8</option>
                  <option value="Khối 9">Khối 9</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full justify-center"
              icon={<i className="fa-solid fa-brain text-purple-300"></i>}
            >
              {isGeneratingQuiz ? 'AI đang biên soạn câu hỏi...' : `🧠 Tạo Bộ Đề Ôn Tập AI (${selectedSubject} - ${selectedGradeLevel})`}
            </Button>

            {generatedQuiz.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {generatedQuiz.map((q) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-[#FAFBFF] border border-[#E1E6F0] space-y-2">
                    <div className="text-xs font-extrabold text-[#18243A]">Câu {q.id}: {q.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-[#475569]">
                      {q.options.map((opt) => (
                        <div key={opt} className={`p-2 rounded-xl border ${opt === q.answer ? 'bg-[#E6F9F3] border-[#22C997] font-extrabold text-[#0E8360]' : 'bg-white border-[#E1E6F0]'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] font-bold text-[#6C63FF] bg-[#EEECFF] p-2 rounded-xl border border-[#C0BBFD]">
                      💡 Lời giải: {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
