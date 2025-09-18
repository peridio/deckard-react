import React, { useCallback, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Button } from '../inputs';
import './Modal.styles.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown, closeOnEscape]);

  if (!isOpen) return null;

  const modalClasses = ['modal', `modal-${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClasses}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="xs"
              className="modal-close"
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()}`}
            >
              <FaTimes />
            </Button>
          )}
        </div>

        <div className="modal-content">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
