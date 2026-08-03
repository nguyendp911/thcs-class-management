import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockTasks as initialTasks } from '../lib/mockData';
import type { AssignmentTask } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { BookOpen, Plus, CheckCircle, Clock } from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const { selectedClass } = useAuth();
  const [tasks, setTasks] = useState<AssignmentTask[]>(initialTasks);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Add Task
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<any>('bài tập');
  const [taskPriority, setTaskPriority] = useState<any>('trung bình');
  const [assigneeName, setAssigneeName] = useState('Tất cả học sinh Lớp ' + selectedClass.name);
  const [dueAt, setDueAt] = useState('2026-08-05 17:00');
  const [description, setDescription] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: AssignmentTask = {
      id: tasks.length + 1,
      title: taskTitle,
      task_type: taskType,
      priority: taskPriority,
      assignee_name: assigneeName,
      due_at: dueAt,
      description: description || 'Hoàn thành đúng hạn được giao',
      status: 'pending',
    };

    setTasks([newTask, ...tasks]);
    setIsAddModalOpen(false);
    showToast(`Đã giao nhiệm vụ mới "${newTask.title}" thành công!`);

    setTaskTitle('');
    setDescription('');
  };

  const toggleTaskStatus = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        showToast(`Đã chuyển trạng thái nhiệm vụ thành: ${nextStatus === 'completed' ? 'Đã hoàn thành' : 'Đang xử lý'}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
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
            <BookOpen className="h-7 w-7 text-[#6C63FF]" />
            Bài tập về nhà & Nhiệm vụ {selectedClass.name}
          </h1>
          <p className="text-xs text-[#68758D] font-bold mt-1">
            Quản lý danh sách bài tập, thu phiếu khảo sát, trực nhật và hạn nộp của học sinh
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Giao bài tập / Nhiệm vụ mới
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="clay-card p-5 space-y-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={task.priority === 'cao' ? 'danger' : 'purple'}>
                  {task.task_type.toUpperCase()}
                </Badge>
                <Badge variant={task.priority === 'cao' ? 'danger' : 'warning'}>
                  Ưu tiên {task.priority}
                </Badge>
                {task.status === 'completed' && <Badge variant="mint">Đã hoàn thành</Badge>}
              </div>

              <h3 className={`text-base font-extrabold ${task.status === 'completed' ? 'line-through text-[#68758D]' : 'text-[#18243A]'}`}>
                {task.title}
              </h3>

              <p className="text-xs text-[#68758D] font-semibold">{task.description}</p>
              
              <div className="flex items-center gap-4 text-xs font-bold text-[#68758D] pt-1">
                <span>Phụ trách: <strong className="text-[#6C63FF]">{task.assignee_name}</strong></span>
                <span className="flex items-center gap-1 text-[#FF5D68]">
                  <Clock className="h-3.5 w-3.5" /> Hạn nộp: {task.due_at}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant={task.status === 'completed' ? 'outline' : 'mint'}
              onClick={() => toggleTaskStatus(task.id)}
            >
              {task.status === 'completed' ? 'Đánh dấu chưa xong' : 'Xác nhận Đã hoàn thành'}
            </Button>
          </div>
        ))}
      </div>

      {/* Modal Add Task */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo Bài Tập Về Nhà / Nhiệm Vụ Mới"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button onClick={handleCreateTask} icon={<Plus className="h-4 w-4" />}>
              Giao nhiệm vụ
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Tiêu đề bài tập / nhiệm vụ:</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="VD: Bài tập Đại số 7 - Giải phương trình tiết 42"
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Loại nhiệm vụ:</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
              >
                <option value="bài tập">Bài tập về nhà</option>
                <option value="trực nhật">Trực nhật vệ sinh</option>
                <option value="nộp giấy tờ">Thu nộp giấy tờ</option>
                <option value="thu quỹ">Thu đóng góp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Mức ưu tiên:</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs bg-white font-bold"
              >
                <option value="thấp">Thấp</option>
                <option value="trung bình">Trung bình</option>
                <option value="cao">Cao (Khẩn cấp)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Người / Tổ phụ trách:</label>
              <input
                type="text"
                required
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                placeholder="VD: Tổ 1 / Tất cả học sinh"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[#18243A]">Hạn hoàn thành (Hạn nộp):</label>
              <input
                type="text"
                required
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                placeholder="2026-08-05 17:00"
                className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#18243A]">Mô tả & Hướng dẫn chi tiết:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Làm bài 1, 2, 3 trang 45 SGK. Học sinh nộp bài vào buổi học tiếp theo..."
              className="mt-1 w-full rounded-xl border border-[#E1E6F0] p-2 text-xs"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
