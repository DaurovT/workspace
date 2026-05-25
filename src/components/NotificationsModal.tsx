import React, { useEffect } from 'react';
import { useStore } from '../store';
import { GlobalNotificationsPage } from './GlobalNotificationsPage';
import { X } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const isGlobalNotificationsOpen = useStore(state => state.isGlobalNotificationsOpen);
      const setGlobalNotificationsOpen = useStore(state => state.setGlobalNotificationsOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGlobalNotificationsOpen) {
        setGlobalNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGlobalNotificationsOpen, setGlobalNotificationsOpen]);

  if (!isGlobalNotificationsOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setGlobalNotificationsOpen(false);
        }
      }}
    >
      <div style={{
        background: 'var(--bg-base)',
        borderRadius: 20,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 1000,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <button 
          onClick={() => setGlobalNotificationsOpen(false)}
          style={{
            position: 'absolute',
            top: 24,
            right: 32,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <X size={20} />
        </button>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <GlobalNotificationsPage />
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
