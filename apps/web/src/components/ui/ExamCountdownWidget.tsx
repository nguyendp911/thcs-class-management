import React, { useState } from 'react';

interface ExamEvent {
  id: number;
  title: string;
  targetDate: string; // YYYY-MM-DD
  badgeColor: string;
  icon: string;
  scope: string;
}

export const ExamCountdownWidget: React.FC = () => {
  const [events] = useState<ExamEvent[]>([
    {
      id: 1,
      title: 'Thi Học Kỳ II Toàn Trường',
      targetDate: '2026-05-18',
      badgeColor: 'bg-[#FFEFEF] text-[#FF5D68] border-[#FFC0C3]',
      icon: 'fa-graduation-cap text-[#FF5D68]',
      scope: 'Học sinh Khối 6-9'
    },
    {
      id: 2,
      title: 'Thi Tuyển Sinh Vào Lớp 10 THPT',
      targetDate: '2026-06-05',
      badgeColor: 'bg-[#EEECFF] text-[#6C63FF] border-[#C0BBFD]',
      icon: 'fa-award text-[#6C63FF]',
      scope: 'Học sinh Khối 9'
    },
    {
      id: 3,
      title: 'Kỷ Niệm Ngày Thành Lập Đoàn 26/3',
      targetDate: '2026-03-26',
      badgeColor: 'bg-[#E6F9F3] text-[#0E8360] border-[#A3F0D9]',
      icon: 'fa-flag text-[#22C997]',
      scope: 'Hoạt động Đội - Đoàn'
    }
  ]);

  const calculateDaysLeft = (targetDateStr: string) => {
    const today = new Date();
    const target = new Date(targetDateStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="clay-card p-5 space-y-4 border-[#E1E6F0] bg-[#FAFBFF]">
      <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-[#6C63FF] fa-hourglass-half text-base text-[#6C63FF]"></i>
          <h3 className="text-xs font-extrabold text-[#18243A] uppercase tracking-wider">
            Lịch Thi & Sự Kiện Đếm Ngược
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#68758D] bg-white px-2 py-0.5 rounded-full border border-[#E1E6F0]">
          Học kỳ II (2025 - 2026)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {events.map((ev) => {
          const daysLeft = calculateDaysLeft(ev.targetDate);
          return (
            <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-[#E1E6F0] shadow-2xs space-y-2 flex flex-col justify-between hover:border-[#6C63FF] transition-all">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${ev.badgeColor}`}>
                  {ev.scope}
                </span>
                <i className={`fa-solid ${ev.icon} text-sm`}></i>
              </div>

              <div>
                <div className="text-xs font-extrabold text-[#18243A] line-clamp-1">{ev.title}</div>
                <div className="text-[10px] text-[#68758D] font-mono mt-0.5">Ngày: {ev.targetDate}</div>
              </div>

              <div className="pt-1 border-t border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#68758D]">Còn lại:</span>
                <span className="text-sm font-black text-[#6C63FF] font-mono">{daysLeft} Ngày</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
