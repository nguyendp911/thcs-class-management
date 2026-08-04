import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ClayIcon } from './ClayIcon';

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'lemon';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  eyebrow,
  title,
  description,
  action,
  tone = 'lavender',
}) => (
  <header className="clay-page-header">
    <div className="clay-page-header__main">
      <ClayIcon icon={icon} tone={tone} size="lg" />
      <div>
        {eyebrow && <span className="clay-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
    {action && <div className="clay-page-header__action">{action}</div>}
  </header>
);
