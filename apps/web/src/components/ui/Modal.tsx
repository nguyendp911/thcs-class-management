import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ClayIcon } from './ClayIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="clay-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={'clay-modal clay-modal--' + size}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="clay-modal__header">
          <h2>{title}</h2>
          <button className="clay-icon-button" onClick={onClose} aria-label="Đóng">
            <ClayIcon icon={X} tone="rose" size="sm" />
          </button>
        </header>
        <div className="clay-modal__body">{children}</div>
        {footer && <footer className="clay-modal__footer">{footer}</footer>}
      </section>
    </div>
  );
};
