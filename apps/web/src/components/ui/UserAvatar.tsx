import React, { useState } from 'react';
import type { RoleType } from '../../types';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  role?: RoleType | string;
  gender?: 'nam' | 'nữ' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'none';
  className?: string;
  showRoleBadge?: boolean;
}

// Generate gradient background deterministically based on name
const getAvatarGradient = (name: string, role?: string) => {
  if (role === 'superadmin') return 'from-purple-600 via-indigo-600 to-amber-500 text-white';
  if (role === 'admin') return 'from-emerald-600 to-teal-600 text-white';
  if (role === 'homeroom_teacher') return 'from-indigo-600 via-purple-600 to-violet-600 text-white';
  if (role === 'subject_teacher') return 'from-sky-600 via-blue-600 to-indigo-600 text-white';
  if (role === 'parent') return 'from-amber-600 via-orange-600 to-amber-700 text-white';
  if (role === 'student') return 'from-cyan-500 via-sky-600 to-blue-600 text-white';

  const gradients = [
    'from-indigo-500 to-purple-600 text-white',
    'from-blue-500 to-cyan-600 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-rose-500 to-orange-500 text-white',
    'from-violet-500 to-purple-600 text-white',
    'from-amber-500 to-yellow-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) % gradients.length;
  }
  return gradients[Math.abs(hash)];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  role,
  size = 'md',
  status = 'none',
  className = '',
  showRoleBadge = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    xs: 'w-6 h-6 text-[10px] ring-1',
    sm: 'w-8 h-8 text-xs ring-2',
    md: 'w-10 h-10 text-sm ring-2',
    lg: 'w-12 h-12 text-base ring-2',
    xl: 'w-16 h-16 text-xl ring-3',
    '2xl': 'w-20 h-20 text-2xl ring-4',
  };

  const statusSizeMap = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0 right-0',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-4 h-4 bottom-1 right-1',
    '2xl': 'w-5 h-5 bottom-1 right-1',
  };

  const roleIconMap: Record<string, string> = {
    superadmin: 'fa-solid fa-crown text-amber-300',
    admin: 'fa-solid fa-user-shield text-emerald-300',
    homeroom_teacher: 'fa-solid fa-chalkboard-user text-indigo-300',
    subject_teacher: 'fa-solid fa-book-open-reader text-sky-300',
    parent: 'fa-solid fa-users text-amber-300',
    student: 'fa-solid fa-graduation-cap text-cyan-300',
  };

  // Get initial character (e.g. "Nguyen Van Anh" -> "A")
  const cleanName = (name || '').replace(/\s*\([^)]*\)/g, '').trim();
  const nameParts = cleanName.split(' ');
  const initial = nameParts.length > 0 ? nameParts[nameParts.length - 1].charAt(0).toUpperCase() : 'U';

  const gradientClass = getAvatarGradient(cleanName, role);

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-full font-black tracking-tight shadow-md overflow-hidden transition-all duration-200 ring-white/90 ${sizeMap[size]} bg-gradient-to-br ${gradientClass}`}
      >
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={cleanName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="drop-shadow-xs">{initial}</span>
        )}
      </div>

      {/* Online Status Dot */}
      {status !== 'none' && (
        <span
          className={`absolute rounded-full ring-2 ring-white ${statusSizeMap[size]} ${
            status === 'online'
              ? 'bg-emerald-500 animate-pulse'
              : status === 'busy'
              ? 'bg-rose-500'
              : 'bg-slate-400'
          }`}
        ></span>
      )}

      {/* Role Overlay Badge Icon */}
      {showRoleBadge && role && roleIconMap[role] && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900/80 backdrop-blur-xs rounded-full p-1 border border-white/40 shadow-sm flex items-center justify-center text-[9px]">
          <i className={roleIconMap[role]}></i>
        </div>
      )}
    </div>
  );
};
