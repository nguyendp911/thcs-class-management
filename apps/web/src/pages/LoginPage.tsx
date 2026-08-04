import React, { useEffect, useState } from 'react';
import { Database, LockKeyhole, LogIn, School, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { ClayIcon } from '../components/ui/ClayIcon';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/app/dashboard', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/app/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="clay-login">
      <div className="clay-login__orb clay-login__orb--one" />
      <div className="clay-login__orb clay-login__orb--two" />
      <section className="clay-login__intro">
        <div className="clay-login__logo">
          <School aria-label="EduClass" />
        </div>
        <span className="clay-eyebrow">Hệ thống quản trị lớp học</span>
        <h1>Quản trị lớp học.<br />Dữ liệu tập trung.</h1>
        <p>Theo dõi học sinh, điểm danh, học tập và vận hành lớp trên một hệ thống dữ liệu thống nhất.</p>
        <div className="clay-login__signals">
          <div><ClayIcon icon={Database} tone="mint" /><span><strong>MySQL live</strong><small>Không dữ liệu giả lập</small></span></div>
          <div><ClayIcon icon={ShieldCheck} tone="lavender" /><span><strong>Cookie HttpOnly</strong><small>Session lưu phía server</small></span></div>
        </div>
      </section>

      <form className="clay-login__card" onSubmit={handleSubmit}>
        <ClayIcon icon={LockKeyhole} tone="lavender" size="lg" />
        <div>
          <span className="clay-eyebrow">Chào mừng trở lại</span>
          <h2>Đăng nhập EduClass</h2>
          <p>Thông tin xác thực được kiểm tra trực tiếp với tài khoản MySQL.</p>
        </div>
        <label className="clay-field">
          <span>Tên đăng nhập</span>
          <div className="clay-input-with-icon">
            <UserRound />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </label>
        <label className="clay-field">
          <span>Mật khẩu</span>
          <div className="clay-input-with-icon">
            <LockKeyhole />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
        </label>
        {error && <div className="clay-alert clay-alert--error">{error}</div>}
        <Button
          type="submit"
          size="lg"
          icon={<LogIn />}
          isLoading={submitting}
          disabled={!username.trim() || !password}
        >
          Đăng nhập an toàn
        </Button>
        <small className="clay-login__privacy">
          Trình duyệt chỉ giữ cookie HttpOnly; không lưu phiên hay dữ liệu nghiệp vụ.
        </small>
      </form>
    </main>
  );
};
