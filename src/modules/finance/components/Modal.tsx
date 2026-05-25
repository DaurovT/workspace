import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  hideHeader?: boolean;
  noPadding?: boolean;
  bodyStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, width = '500px', hideHeader = false, noPadding = false, bodyStyle, children }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div style={{ position: 'relative', width, maxWidth: '95vw', maxHeight: '95vh', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', ...bodyStyle }}>
        
        {/* Header (optional) */}
        {!hideHeader && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
          <button 
            onClick={onClose}
             style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>
        )}

        {/* Content (Scrollable) */}
        <div style={{ padding: noPadding ? 0 : '24px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
