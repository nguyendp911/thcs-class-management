import React, { useCallback, useEffect, useState } from 'react';
import { Database, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { User } from '../types/app';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatePanel } from '../components/ui/StatePanel';

export const AdminLivePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const payload = await apiRequest<{ success: true; users: User[] }>('/users');
      setUsers(payload.users);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được tài khoản.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <div className="clay-page">
    <PageHeader title="Quản trị hệ thống" description="Tài khoản và trạng thái đọc trực tiếp từ MySQL" icon={ShieldCheck} tone="lavender" action={<Button variant="ghost" onClick={load} icon={<RefreshCw size={17} />}>Làm mới</Button>} />
    <section className="security-grid">
      <article className="clay-card security-card"><ShieldCheck /><div><strong>Session phía server</strong><span>MySQL + cookie HttpOnly, Secure, SameSite</span></div></article>
      <article className="clay-card security-card"><Database /><div><strong>Tệp trong database</strong><span>Ảnh, QR và tệp đính kèm lưu BLOB</span></div></article>
      <article className="clay-card security-card"><Users /><div><strong>{users.length}</strong><span>Tài khoản đang có trong MySQL</span></div></article>
    </section>
    {error && <div className="clay-notice clay-notice--error">{error}</div>}
    {isLoading ? <StatePanel variant="loading" title="Đang đọc tài khoản" message="Đang truy vấn MySQL trên máy chủ." /> : users.length === 0 ? <StatePanel title="Chưa có tài khoản" message="MySQL không trả về bản ghi tài khoản nào." /> :
      <section className="clay-card clay-table-card"><div className="clay-card__heading"><div><span className="clay-eyebrow">MySQL live</span><h2>Danh sách tài khoản</h2></div></div><div className="clay-table-wrap"><table className="clay-table"><thead><tr><th>Họ tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.username}</td><td>{user.role}</td><td><span className="clay-badge">{user.status}</span></td></tr>)}</tbody></table></div></section>}
  </div>;
};
