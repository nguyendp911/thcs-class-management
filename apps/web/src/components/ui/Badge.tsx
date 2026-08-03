import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'mint' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'purple',
  children,
  className = '',
}) => {
  const variantStyles = {
    purple: 'bg-[#EEECFF] text-[#6C63FF] border border-[#C0BBFD]',
    mint: 'bg-[#E6F9F3] text-[#0E8360] border border-[#A3F0D9]',
    success: 'bg-[#E6F9F3] text-[#0E8360] border border-[#A3F0D9]',
    warning: 'bg-[#FFF9EB] text-[#B47800] border border-[#FFE399]',
    danger: 'bg-[#FFEFEF] text-[#D32F2F] border border-[#FFC0C3]',
    info: 'bg-[#EBF5FF] text-[#3B82F6] border border-[#D6EBFF]',
    neutral: 'bg-[#F4F6FB] text-[#475569] border border-[#CBD5E1]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold tracking-tight whitespace-nowrap shadow-2xs ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
