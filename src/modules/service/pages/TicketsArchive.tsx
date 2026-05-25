import React, { useEffect } from 'react';
import { useServiceStore } from '../serviceStore';
import { ArrowLeft } from 'lucide-react';

const TicketsArchive: React.FC = () => {
  const { archiveData, fetchArchiveTickets, setActiveView, isLoading, users } = useServiceStore();

  useEffect(() => {
    fetchArchiveTickets(1, 20);
  }, [fetchArchiveTickets]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= archiveData.pages) {
      fetchArchiveTickets(newPage, 20);
    }
  };

  const getAssigneeName = (id?: string | null) => {
    if (!id) return 'Не назначен';
    return users.find(u => u.id === id)?.name || id;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setActiveView('tickets')}
          style={{ padding: 'var(--space-2)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Архив заявок</h2>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)' }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Проблема</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Категория</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Заявитель</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Исполнитель</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Дата</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && archiveData.tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td>
                </tr>
              ) : archiveData.tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>В архиве нет заявок</td>
                </tr>
              ) : (
                archiveData.tickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>#{t.number}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{t.title}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{t.category}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{t.reporterName || 'Неизвестно'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{getAssigneeName(t.assigneeId)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {archiveData.pages > 1 && (
            <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Всего: {archiveData.total}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={archiveData.currentPage === 1 || isLoading}
                  onClick={() => handlePageChange(archiveData.currentPage - 1)}
                >
                  Пред
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', fontWeight: 500 }}>
                  {archiveData.currentPage} из {archiveData.pages}
                </span>
                <button 
                  className="btn btn-secondary" 
                  disabled={archiveData.currentPage === archiveData.pages || isLoading}
                  onClick={() => handlePageChange(archiveData.currentPage + 1)}
                >
                  След
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsArchive;
