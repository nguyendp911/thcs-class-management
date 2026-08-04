import React from 'react';
import { CircleAlert, DatabaseZap, LoaderCircle } from 'lucide-react';
import { ClayIcon } from './ClayIcon';

export const LoadingPanel: React.FC<{ label?: string }> = ({ label = 'Đang đọc dữ liệu MySQL…' }) => (
  <div className="clay-state-panel">
    <ClayIcon icon={LoaderCircle} tone="lavender" size="lg" className="is-spinning" />
    <strong>{label}</strong>
  </div>
);

export const EmptyPanel: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="clay-state-panel">
    <ClayIcon icon={DatabaseZap} tone="sky" size="lg" />
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);

export const ErrorPanel: React.FC<{ message: string }> = ({ message }) => (
  <div className="clay-state-panel clay-state-panel--error">
    <ClayIcon icon={CircleAlert} tone="rose" size="lg" />
    <strong>Không thể đọc dữ liệu</strong>
    <span>{message}</span>
  </div>
);

interface StatePanelProps {
  variant?: 'empty' | 'loading' | 'error';
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const StatePanel: React.FC<StatePanelProps> = ({ variant = 'empty', title, message, action }) => {
  if (variant === 'loading') return <div className="clay-state-panel"><ClayIcon icon={LoaderCircle} tone="lavender" size="lg" className="is-spinning" /><strong>{title}</strong><span>{message}</span>{action}</div>;
  if (variant === 'error') return <div className="clay-state-panel clay-state-panel--error"><ClayIcon icon={CircleAlert} tone="rose" size="lg" /><strong>{title}</strong><span>{message}</span>{action}</div>;
  return <div className="clay-state-panel"><ClayIcon icon={DatabaseZap} tone="sky" size="lg" /><strong>{title}</strong><span>{message}</span>{action}</div>;
};
