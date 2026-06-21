import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfirm } from '../../context/ConfirmContext';
import { Button } from './Button';
import { AlertTriangle, Info, X } from 'lucide-react';
import './ConfirmModal.css';

export function GlobalConfirmModal() {
  const { confirmState } = useConfirm();
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (confirmState.isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [confirmState.isOpen, shouldRender]);

  if (!shouldRender) return null;

  const { title, message, confirmText, cancelText, variant, onConfirm, onCancel } = confirmState;

  const Icon = variant === 'danger' ? AlertTriangle : Info;
  const iconColor = variant === 'danger' ? 'var(--accent-coral)' : 'var(--accent-emerald)';
  const iconBg = variant === 'danger' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)';
  const iconBorder = variant === 'danger' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)';

  const handleClose = () => {
    if (onCancel) onCancel();
  };

  return createPortal(
    <div className={`confirm-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-close-btn" onClick={handleClose}>
          <X size={18} />
        </button>
        <div className="confirm-modal-content">
          <div className="confirm-modal-icon-wrapper" style={{ color: iconColor, background: iconBg, borderColor: iconBorder }}>
            <Icon size={28} />
          </div>
          <div className="confirm-modal-text">
            <h3>{title}</h3>
            <p>{message}</p>
          </div>
        </div>
        <div className="confirm-modal-footer">
          <Button variant="secondary" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={() => { if (onConfirm) onConfirm(); }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
