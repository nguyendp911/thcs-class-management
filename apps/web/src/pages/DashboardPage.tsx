import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpenCheck,
  ChartNoAxesCombined,
  CircleAlert,
  Clock3,
  DatabaseZap,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserRoundX,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import type { DashboardPayload } from '../types/app';
import { Button } from '../components/ui/Button';
import { ClayIcon } from '../components/ui/ClayIcon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui/StatePanel';

const moduleLabels: Record<string, string> = {
  announcements: 'Thông báo',
  assignments: 'Công việc',
  conduct: 'Thi đua',
  incidents: 'Sự vụ',
  'leave-requests': 'Đơn nghỉ',
  gradebook: 'Bảng điểm',
  timetable: 'Thời khóa biểu',
  'lesson-logs': 'Sổ đầu bài',
  posts: 'Bảng tin',
  'seating-chart': 'Sơ đồ chỗ ngồi',
  reports: 'Báo cáo',
};

const chartColors = ['#9b8cff', '#60d9b2', '#ffb68a', '#74bdf8'];

export const DashboardPage: React.FC = () => {
  const { selectedClass } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!selectedClass) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<DashboardPayload & { success: true }>(
        '/dashboard?class_id=' + encodeURIComponent(String(selectedClass.id)),
      );
      setData(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Học sinh', value: data.kpis.students, icon: Users, tone: 'sky' },
      { label: 'Có mặt hôm nay', value: data.kpis.present_today, icon: UserCheck, tone: 'mint' },
      { label: 'Đi muộn', value: data.kpis.late_today, icon: Clock3, tone: 'lemon' },
      { label: 'Vắng', value: data.kpis.absent_today, icon: UserRoundX, tone: 'rose' },
      {
        label: 'Điểm trung bình',
        value: data.kpis.average_score === null ? '—' : data.kpis.average_score,
        icon: GraduationCap,
        tone: 'lavender',
      },
      { label: 'Việc đang mở', value: data.kpis.pending_assignments, icon: BookOpenCheck, tone: 'peach' },
      { label: 'Sự vụ mở', value: data.kpis.open_incidents, icon: ShieldAlert, tone: 'rose' },
      { label: 'Đơn chờ duyệt', value: data.kpis.pending_leaves, icon: CircleAlert, tone: 'lemon' },
    ] as const;
  }, [data]);

  return (
    <div className="clay-page">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow="Tổng hợp toàn bộ module"
        title={selectedClass ? 'Dashboard ' + selectedClass.name : 'Dashboard lớp'}
        description="KPI, biểu đồ và danh sách được tổng hợp trực tiếp từ MySQL trên host."
        action={
          <Button variant="secondary" icon={<RefreshCw />} onClick={loadDashboard} isLoading={loading}>
            Làm mới
          </Button>
        }
      />

      {!selectedClass && (
        <EmptyPanel title="Chưa có lớp trong MySQL" description="Tạo lớp trong cơ sở dữ liệu để bắt đầu." />
      )}
      {loading && !data && <LoadingPanel />}
      {error && <ErrorPanel message={error} />}

      {data && (
        <>
          <section className="clay-kpi-grid">
            {kpis.map((item) => (
              <article className="clay-kpi-card" key={item.label}>
                <ClayIcon icon={item.icon} tone={item.tone} size="lg" />
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="clay-dashboard-grid">
            <article className="clay-panel clay-panel--wide">
              <div className="clay-panel__heading">
                <div><ClayIcon icon={Activity} tone="mint" /><span><strong>Điểm danh 7 ngày</strong><small>Phiên đã lưu trong MySQL</small></span></div>
              </div>
              {data.attendance_trend.length > 0 ? (
                <div className="clay-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.attendance_trend} barGap={4}>
                      <CartesianGrid strokeDasharray="5 8" stroke="#ddd8f1" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#6d6685', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6d6685', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 18, border: 'none', boxShadow: '0 16px 30px rgba(94,74,121,.15)' }} />
                      <Bar dataKey="present" name="Có mặt" fill="#60d9b2" radius={[9, 9, 3, 3]} />
                      <Bar dataKey="late" name="Muộn" fill="#f7c96d" radius={[9, 9, 3, 3]} />
                      <Bar dataKey="absent" name="Vắng" fill="#ff91a3" radius={[9, 9, 3, 3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="Chưa có phiên điểm danh" description="Biểu đồ sẽ xuất hiện sau khi dữ liệu được commit." />
              )}
            </article>

            <article className="clay-panel">
              <div className="clay-panel__heading">
                <div><ClayIcon icon={GraduationCap} tone="lavender" /><span><strong>Phân bố điểm</strong><small>Dữ liệu bảng điểm</small></span></div>
              </div>
              {data.grade_distribution.some((item) => item.count > 0) ? (
                <div className="clay-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.grade_distribution} dataKey="count" nameKey="label" innerRadius={58} outerRadius={94} paddingAngle={5}>
                        {data.grade_distribution.map((item, index) => (
                          <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 18, border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyPanel title="Chưa có điểm" description="Không tạo số liệu thay thế khi MySQL chưa có dữ liệu." />
              )}
            </article>
          </section>

          <section className="clay-dashboard-grid">
            <article className="clay-panel clay-panel--wide">
              <div className="clay-panel__heading">
                <div><ClayIcon icon={DatabaseZap} tone="sky" /><span><strong>Độ phủ module</strong><small>Số bản ghi hiện có theo module</small></span></div>
              </div>
              <div className="clay-module-grid">
                {Object.entries(data.module_counts).map(([key, count]) => (
                  <div className="clay-module-chip" key={key}>
                    <span>{moduleLabels[key] || key}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="clay-panel">
              <div className="clay-panel__heading">
                <div><ClayIcon icon={ChartNoAxesCombined} tone="peach" /><span><strong>Hoạt động gần đây</strong><small>Nhật ký transaction</small></span></div>
              </div>
              {data.recent_activity.length > 0 ? (
                <div className="clay-timeline">
                  {data.recent_activity.map((item) => (
                    <div key={item.id}>
                      <span />
                      <div><strong>{item.action_type}</strong><p>{item.description}</p><small>{item.created_at}</small></div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel title="Chưa có nhật ký" description="Không có hoạt động được ghi cho lớp này." />
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
};
