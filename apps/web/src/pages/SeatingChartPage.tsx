import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveToDb } from '../lib/dbSync';
import { Button } from '../components/ui/Button';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Table, Sparkles, RefreshCw, Printer } from 'lucide-react';

interface Seat {
  id: string; // e.g. "R1-C1-S1"
  row: number;
  col: number;
  seatNum: number;
  studentId?: number;
  studentName?: string;
  tag?: 'myopia' | 'excellent' | 'pair' | 'focus'; // Cận thị, Giỏi, Đôi bạn cùng tiến, Cần chú ý
}

export const SeatingChartPage: React.FC = () => {
  const { selectedClass, studentsList } = useAuth();
  const classId = selectedClass?.id || 0;
  const className = selectedClass?.name || 'Lớp 8A1';

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize 4 rows x 4 cols x 2 seats = 32 seats
  useEffect(() => {
    const storageKey = `thcs_seating_chart_class_${classId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSeats(JSON.parse(saved));
        return;
      }
    } catch (e) {}

    // Auto-generate seating chart with students
    const initialSeats: Seat[] = [];
    let stIndex = 0;

    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 4; c++) {
        for (let s = 1; s <= 2; s++) {
          const st = studentsList[stIndex];
          initialSeats.push({
            id: `R${r}-C${c}-S${s}`,
            row: r,
            col: c,
            seatNum: s,
            studentId: st?.id,
            studentName: st?.full_name,
            tag: r === 1 ? 'myopia' : stIndex % 5 === 0 ? 'excellent' : undefined,
          });
          stIndex++;
        }
      }
    }
    setSeats(initialSeats);
  }, [classId, studentsList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveSeatingChart = (newSeats: Seat[]) => {
    setSeats(newSeats);
    saveToDb(`thcs_seating_chart_class_${classId}`, newSeats);
  };

  const handleAssignStudent = (seatId: string, studentName: string) => {
    const updated = seats.map(s => s.id === seatId ? { ...s, studentName } : s);
    saveSeatingChart(updated);
    setSelectedSeat(null);
    showToast(`✓ Đã xếp học sinh ${studentName} vào chỗ ngồi!`);
  };

  const handleSetTag = (seatId: string, tag?: 'myopia' | 'excellent' | 'pair' | 'focus') => {
    const updated = seats.map(s => s.id === seatId ? { ...s, tag } : s);
    saveSeatingChart(updated);
    setSelectedSeat(null);
    showToast(`✓ Đã cập nhật nhãn chỗ ngồi!`);
  };

  const handleAutoShuffle = () => {
    const shuffledStudents = [...studentsList].sort(() => Math.random() - 0.5);
    let stIndex = 0;
    const updated = seats.map(s => {
      const st = shuffledStudents[stIndex++];
      return {
        ...s,
        studentId: st?.id,
        studentName: st?.full_name || s.studentName,
      };
    });
    saveSeatingChart(updated);
    showToast('🎲 Đã tự động xáo trộn và xếp vị trí chỗ ngồi ngẫu nhiên!');
  };

  const getTagBadge = (tag?: string) => {
    switch (tag) {
      case 'myopia':
        return <span className="text-[10px] font-bold text-[#0284C7] bg-[#EBF8FF] px-1.5 py-0.5 rounded-md border border-[#BAE6FD] shrink-0">👓 Cận thị</span>;
      case 'excellent':
        return <span className="text-[10px] font-bold text-[#B47800] bg-[#FFF9EB] px-1.5 py-0.5 rounded-md border border-[#FFE399] shrink-0">🌟 Học sinh Giỏi</span>;
      case 'pair':
        return <span className="text-[10px] font-bold text-[#0E8360] bg-[#E6F9F3] px-1.5 py-0.5 rounded-md border border-[#A3F0D9] shrink-0">👥 Đôi bạn cùng tiến</span>;
      case 'focus':
        return <span className="text-[10px] font-bold text-[#D32F2F] bg-[#FFEFEF] px-1.5 py-0.5 rounded-md border border-[#FFC0C3] shrink-0">💬 Cần chú ý</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-xl bg-[#E6F9F3] border border-[#A3F0D9] p-3 text-xs font-bold text-[#0E8360] flex items-center gap-2 shadow-xs animate-in fade-in">
          <Sparkles className="h-4 w-4 text-[#22C997]" />
          {toastMessage}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#18243A] sm:text-3xl tracking-tight flex items-center gap-2">
            <Table className="h-7 w-7 text-[#6C63FF]" />
            Sơ Đồ Chỗ Ngồi Lớp Học 2D ({className})
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Quản lý sơ đồ vị trí chỗ ngồi trực quan, xếp chỗ cho học sinh cận thị và theo dõi cặp đôi học tập
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAutoShuffle} icon={<RefreshCw className="h-4 w-4" />}>
            🎲 Đổi vị trí tự động
          </Button>
          <Button onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
            🖨️ In Sơ Đồ Lớp
          </Button>
        </div>
      </div>

      {/* Blackboard & Teacher Podium Desk (Front of Classroom) */}
      <div className="w-full bg-[#1E293B] text-white p-4 rounded-3xl text-center border-4 border-[#334155] shadow-md flex items-center justify-between px-8">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
          <i className="fa-solid fa-chalkboard-user text-base"></i> Bàn Bục Giảng Giáo Viên
        </div>
        <div className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
          <i className="fa-solid fa-square-poll-vertical text-base"></i> BẢNG ĐEN LỚP HỌC (ĐẦU LỚP)
        </div>
        <div className="text-xs font-bold text-slate-300">Phòng: {selectedClass?.room || 'Phòng 101'}</div>
      </div>

      {/* Seating Layout Grid: 4 Rows x 4 Desks */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map(r => (
          <div key={r} className="space-y-2">
            <div className="text-xs font-extrabold text-[#68758D] flex items-center gap-2">
              <span className="bg-[#EEECFF] text-[#6C63FF] px-2.5 py-0.5 rounded-full border border-[#C0BBFD]">
                HÀNG {r} {r === 1 ? '(Ưu tiên học sinh cận thị 👓)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(c => {
                const deskSeats = seats.filter(s => s.row === r && s.col === c);
                return (
                  <div key={c} className="clay-card p-3 space-y-2 border-[#E1E6F0] bg-[#FAFBFF] hover:border-[#6C63FF] transition-all">
                    <div className="text-[10px] font-extrabold text-[#68758D] flex items-center justify-between border-b border-[#E1E6F0] pb-1">
                      <span>BÀN DÃY {c}</span>
                      <span className="font-mono text-[#6C63FF]">Bàn {r}.{c}</span>
                    </div>

                    {/* 2 Seats per Desk */}
                    <div className="grid grid-cols-2 gap-2">
                      {deskSeats.map(seat => (
                        <div
                          key={seat.id}
                          onClick={() => setSelectedSeat(seat)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                            seat.studentName
                              ? 'bg-white border-[#C0BBFD] hover:bg-[#EEECFF]/60 shadow-2xs'
                              : 'bg-[#F1F5F9] border-dashed border-[#CBD5E1] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <UserAvatar name={seat.studentName || 'Chỗ trống'} size="xs" />
                            {getTagBadge(seat.tag)}
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#18243A] truncate">
                              {seat.studentName || <span className="text-[#94A3B8] font-normal italic">+ Chọn HS</span>}
                            </div>
                            <div className="text-[10px] text-[#68758D] font-mono mt-0.5">Ghế {seat.seatNum}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Seat Modal */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 border border-[#E1E6F0] shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1E6F0] pb-3">
              <h3 className="text-sm font-extrabold text-[#18243A]">
                🪑 Xếp Chỗ Ngồi (Hàng {selectedSeat.row} - Dãy {selectedSeat.col} - Ghế {selectedSeat.seatNum})
              </h3>
              <button onClick={() => setSelectedSeat(null)} className="text-xs font-bold text-[#68758D]">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Chọn học sinh ngồi vị trí này:</label>
                <select
                  value={selectedSeat.studentName || ''}
                  onChange={(e) => handleAssignStudent(selectedSeat.id, e.target.value)}
                  className="w-full rounded-xl border border-[#E1E6F0] p-2.5 text-xs font-bold focus:border-[#6C63FF] focus:outline-none bg-white"
                >
                  <option value="">-- Để chỗ trống --</option>
                  {studentsList.map(st => (
                    <option key={st.id} value={st.full_name}>{st.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#18243A] mb-1">Gán nhãn đặc biệt:</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleSetTag(selectedSeat.id, 'myopia')}>
                    👓 Cận thị
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSetTag(selectedSeat.id, 'excellent')}>
                    🌟 Học sinh Giỏi
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSetTag(selectedSeat.id, 'pair')}>
                    👥 Bạn cùng tiến
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSetTag(selectedSeat.id, 'focus')}>
                    💬 Cần chú ý
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
