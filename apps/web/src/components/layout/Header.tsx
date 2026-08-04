import React from 'react';
import { ChevronDown, Database, LogOut, School } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClayIcon } from '../ui/ClayIcon';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { classesList, selectedClass, setSelectedClass, currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="clay-header">
      <div className="clay-header__context">
        <ClayIcon icon={School} tone="lavender" />
        <div>
          <span>Không gian lớp học</span>
          <div className="clay-select-wrap">
            <select
              value={selectedClass?.id || ''}
              onChange={(event) => {
                const found = classesList.find((item) => String(item.id) === event.target.value);
                if (found) setSelectedClass(found);
              }}
              aria-label="Chọn lớp"
            >
              {classesList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="clay-header__actions">
        <div className="clay-live-badge">
          <ClayIcon icon={Database} tone="mint" size="sm" />
          <span>MySQL trực tiếp</span>
        </div>
        <div className="clay-user-chip">
          <span className="clay-user-chip__avatar">
            {currentUser?.avatar_url ? <img src={currentUser.avatar_url} alt="" /> : currentUser?.name.slice(0, 1)}
          </span>
          <span>
            <strong>{currentUser?.name}</strong>
            <small>{currentUser?.role}</small>
          </span>
        </div>
        <button className="clay-icon-button" onClick={handleLogout} aria-label="Đăng xuất">
          <ClayIcon icon={LogOut} tone="rose" size="sm" />
        </button>
      </div>
    </header>
  );
};
