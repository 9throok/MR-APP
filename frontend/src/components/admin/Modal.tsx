import { useEffect, type ReactNode, type MouseEvent } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'narrow' | 'default' | 'wide';
}

/**
 * Centered modal with overlay click-through-close, ESC key, scroll lock, and
 * a built-in close button. Replaces the per-page hand-rolled
 * `position: fixed` overlays.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'default',
}: ModalProps) {
  // ESC + scroll lock
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const widthClass = width === 'wide' ? 'modal-wide' : width === 'narrow' ? 'modal-narrow' : '';

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" onClick={onOverlayClick}>
      <div className={`admin-modal ${widthClass}`.trim()}>
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title">{title}</h3>
            {subtitle && <div className="admin-modal-subtitle">{subtitle}</div>}
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {footer && <div className="admin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
