import React, { useEffect } from 'react';
import { useStore, STATUS_LABELS, PRIORITY_LABELS } from '../../../store';
import type { StatusId, Priority } from '../../../store';
import { X, CheckSquare, Zap, Target } from 'lucide-react';

const STATUSES = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value: value as StatusId, label }));
const PRIORITIES = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value: value as Priority, label }));

export const BulkActionsBar: React.FC = () => {
  const { selectedTaskIds, clearTaskSelection, bulkUpdateTasks } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTaskIds.length > 0) {
        clearTaskSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds.length, clearTaskSelection]);

  if (selectedTaskIds.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 1000,
      animation: 'slideUp 0.2s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 500 }}>
        <CheckSquare size={16} color="var(--color-primary)" />
        Выбрано: {selectedTaskIds.length}
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <select 
            className="form-control select-control" 
            style={{ paddingLeft: 28, height: 32, fontSize: 13, minWidth: 140 }}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateTasks({ status: e.target.value as StatusId });
              }
            }}
          >
            <option value="" disabled>Сменить статус...</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Target size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>

        <div style={{ position: 'relative' }}>
          <select 
            className="form-control select-control" 
            style={{ paddingLeft: 28, height: 32, fontSize: 13, minWidth: 140 }}
            value=""
            onChange={(e) => {
              if (e.target.value) {
                bulkUpdateTasks({ priority: e.target.value as Priority });
              }
            }}
          >
            <option value="" disabled>Сменить приоритет...</option>
            {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <Zap size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

      <button className="btn btn-ghost btn-icon" onClick={clearTaskSelection} title="Снять выделение (Esc)">
        <X size={16} />
      </button>
    </div>
  );
};
