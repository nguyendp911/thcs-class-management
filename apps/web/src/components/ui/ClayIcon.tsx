import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'lemon';

interface ClayIconProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ClayIcon: React.FC<ClayIconProps> = ({
  icon: Icon,
  tone = 'lavender',
  size = 'md',
  className = '',
}) => (
  <span className={['clay-icon', 'clay-icon--' + tone, 'clay-icon--' + size, className].join(' ')}>
    <Icon aria-hidden="true" />
  </span>
);
