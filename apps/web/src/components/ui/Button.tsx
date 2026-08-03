import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'mint';
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
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs px-4 py-2 rounded-xl gap-2',
    lg: 'text-sm px-5 py-2.5 rounded-2xl gap-2.5',
  };

  const variantStyles = {
    primary: 'clay-button-purple',
    mint: 'clay-button-mint',
    secondary: 'bg-emerald-100 text-emerald-900 border border-emerald-300/80 hover:bg-emerald-200 font-extrabold shadow-xs',
    outline: 'bg-white/80 backdrop-blur-md text-purple-950 border border-purple-200 hover:bg-purple-50 font-extrabold shadow-xs',
    ghost: 'text-purple-900 hover:bg-purple-100/60 font-extrabold',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-extrabold shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-red-700',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin text-current h-4 w-4">🌀</span>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
