import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={['clay-button', 'clay-button--' + variant, 'clay-button--' + size, className].join(' ')}
  >
    {isLoading ? <span className="clay-spinner" aria-label="Đang xử lý" /> : icon}
    <span>{children}</span>
  </button>
);
