import React, { useState } from 'react';
import { useStore } from '../../../store';
import { Filter, Star, Zap, Save, Plus, List, LayoutGrid, BarChart2, Users } from 'lucide-react';

const ICONS: Record<string, React.FC<any>> = {
  filter: Filter,
  star: Star,
  zap: Zap,
};

const ViewsTabBar: React.FC = () => {
  const {
    savedViews, activeSavedViewId, setActiveSavedViewId,
    projectTab, setProjectTab, filterAssignee, filterPriority, filterStatus, kanbanGroupBy, setKanbanGroupBy,
    saveView, updateSavedView, deleteSavedView
  } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Check if current settings differ from the saved view
  let isDirty = false;
  if (activeSavedViewId !== 'default') {
    const view = savedViews.find(v => v.id === activeSavedViewId);
    if (view) {
      if (
        view.layout !== projectTab ||
        view.filterAssignee !== filterAssignee ||
        view.filterPriority !== filterPriority ||
        view.filterStatus !== filterStatus ||
        view.kanbanGroupBy !== kanbanGroupBy
      ) {
        isDirty = true;
      }
    }
  } else {
    // If we are on default view, it's dirty if any filter is applied
    if (filterAssignee || filterPriority || filterStatus || kanbanGroupBy !== 'none') {
      isDirty = true;
    }
  }

  const handleSaveAsNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;
    saveView({
      name: newViewName.trim(),
      icon: 'star',
      layout: projectTab,
      filterAssignee,
      filterPriority,
      filterStatus,
      kanbanGroupBy,
    });
    setIsCreating(false);
    setNewViewName('');
  };

  const handleSaveChanges = () => {
    if (activeSavedViewId !== 'default') {
      updateSavedView(activeSavedViewId, {
        layout: projectTab,
        filterAssignee,
        filterPriority,
        filterStatus,
        kanbanGroupBy,
      });
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '8px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Default View Tab */}
        <button
          className={`btn btn-sm ${activeSavedViewId === 'default' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSavedViewId('default')}
        >
          Общий вид {activeSavedViewId === 'default' && isDirty && '*'}
        </button>

        {/* Custom Saved Views */}
        {savedViews.map(view => {
          const Icon = ICONS[view.icon] || Filter;
          const isActive = activeSavedViewId === view.id;
          return (
            <div key={view.id} style={{ display: 'flex', alignItems: 'center', background: isActive ? 'var(--bg-active)' : 'transparent', borderRadius: 'var(--radius-md)' }}>
              <button
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: isActive ? 'var(--radius-md) 0 0 var(--radius-md)' : undefined }}
                onClick={() => setActiveSavedViewId(view.id)}
              >
                <Icon size={12} style={{ marginRight: 4 }} />
                {view.name} {isActive && isDirty && '*'}
              </button>
              {isActive && (
                <button
                  className="btn btn-sm btn-primary"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0', padding: '4px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => deleteSavedView(view.id)}
                  title="Удалить вид"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Controls */}
      {isDirty && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {activeSavedViewId !== 'default' && (
            <button className="btn btn-sm btn-secondary" onClick={handleSaveChanges}>
              <Save size={12} /> Сохранить
            </button>
          )}

          {isCreating ? (
            <form onSubmit={handleSaveAsNew} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                autoFocus
                type="text"
                className="form-control"
                style={{ height: 24, fontSize: 11, padding: '0 8px', width: 140 }}
                placeholder="Имя вида..."
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                onBlur={() => setIsCreating(false)}
              />
            </form>
          ) : (
            <button className="btn btn-sm btn-secondary" onClick={() => setIsCreating(true)}>
              <Plus size={12} /> Сохранить как
            </button>
          )}
        </div>
      )}

      {!isDirty && <div style={{ marginLeft: 'auto' }} />}

      {/* Grouping, Gantt Portal & Layout Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Portal target for specific view toolbars (like Gantt) */}
        <div id="view-toolbar-portal" style={{ display: 'flex', alignItems: 'center' }} />
        
        {projectTab === 'kanban' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '2px 8px' }}>
            <Users size={12} color="var(--text-muted)" />
            <select
              className="form-control"
              style={{ border: 'none', background: 'transparent', fontSize: 11, padding: '2px 6px', color: 'var(--text-primary)', height: 'auto', fontWeight: 500, cursor: 'pointer', outline: 'none' }}
              value={kanbanGroupBy}
              onChange={e => setKanbanGroupBy(e.target.value as 'none' | 'assignee')}
            >
              <option value="none">Без группировки</option>
              <option value="assignee">По исполнителям</option>
            </select>
          </div>
        )}
        <div className="view-switcher">
          {[
            { id: 'list', label: 'Список', Icon: List },
            { id: 'kanban', label: 'Канбан', Icon: LayoutGrid },
            { id: 'gantt', label: 'Гант', Icon: BarChart2 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`view-tab ${projectTab === id ? 'active' : ''}`}
              onClick={() => setProjectTab(id as 'list' | 'kanban' | 'gantt')}
            >
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewsTabBar;
