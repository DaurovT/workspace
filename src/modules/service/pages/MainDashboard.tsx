import React from 'react';
import { useServiceStore } from '../serviceStore';
import { Wrench, CheckCircle, Clock } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { tickets } = useServiceStore();
  
  const total = tickets.length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const progressPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categories = ['it', 'electric', 'plumbing', 'furniture', 'other'];
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'it': return { label: 'IT', bg: 'var(--primary)', count: tickets.filter(t => t.category === 'it').length };
      case 'electric': return { label: 'Электрика', bg: '#f59e0b', count: tickets.filter(t => t.category === 'electric').length };
      case 'plumbing': return { label: 'Сантехника', bg: '#10b981', count: tickets.filter(t => t.category === 'plumbing').length };
      case 'furniture': return { label: 'Мебель', bg: '#8b5cf6', count: tickets.filter(t => t.category === 'furniture').length };
      default: return { label: 'Другое', bg: '#6b7280', count: tickets.filter(t => t.category === 'other').length };
    }
  };

  const categoryData = categories.map(getCategoryInfo).filter(c => c.count > 0);

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 1200, margin: '0 auto' }}>
      
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Дашборд</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>Общая сводка по активным заявкам Service Desk.</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
            <Wrench size={18} /> <span>Всего заявок</span>
          </div>
          <div className="stat-value" style={{ fontSize: 36 }}>{total}</div>
        </div>

        <div className="stat-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#f59e0b', fontWeight: 600 }}>
            <Clock size={18} /> <span>В работе</span>
          </div>
          <div className="stat-value" style={{ fontSize: 36, color: '#f59e0b' }}>{inProgress}</div>
        </div>

        <div className="stat-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#10b981', fontWeight: 600 }}>
            <CheckCircle size={18} /> <span>Решено</span>
          </div>
          <div className="stat-value" style={{ fontSize: 36, color: '#10b981' }}>{resolved}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Progress Bar Section */}
        <div className="stat-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>Прогресс выполнения</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: progressPercentage === 100 ? '#10b981' : 'var(--text-primary)' }}>
              {progressPercentage}%
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 8 }}>
              {resolved} из {total} заявок
            </span>
          </div>
          
          <div style={{ height: 12, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                background: progressPercentage === 100 ? '#10b981' : 'var(--primary)', 
                width: `${progressPercentage}%`,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="stat-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: 0 }}>Разбивка по категориям</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1, justifyContent: 'center' }}>
            {categoryData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Нет данных</div>
            ) : (
              categoryData.map(cat => (
                <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: 100, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{cat.label}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: cat.bg, width: `${(cat.count / total) * 100}%` }} />
                  </div>
                  <div style={{ width: 30, textAlign: 'right', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{cat.count}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MainDashboard;
