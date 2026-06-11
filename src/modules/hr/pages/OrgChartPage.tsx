import { confirmDialog } from '../../../lib/confirm';
import { toast } from '../../../lib/toast';
import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Plus, Check, X, Users, RefreshCw } from 'lucide-react';
import { useStore } from '../../../store';

const apiFetch = (url: string, opts: RequestInit = {}) =>
  fetch(url, { ...opts, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...opts.headers as any } })
    .then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText); } return r.json(); });

interface OrgPos {
  id: string; code: string | null; name: string; department: string | null;
  section: string | null; level: number; parentId: string | null;
  staffLimit: number | null; note: string | null;
  _count: { employees: number };
  children?: OrgPos[];
}

const SEC_COLORS: Record<string, string> = {
  'Производство': '#8b5cf6', 'Точки питания': '#06b6d4', 'Бухгалтерия': '#f59e0b',
  'HR': '#10b981', 'Управление': '#6366f1', 'Логистика': '#f97316',
  'Склад': '#84cc16', 'Качество': '#ec4899', 'Инженерная служба': '#14b8a6',
  'Закупки': '#eab308', 'Хозяйственная часть': '#94a3b8',
};
const secColor = (s: string | null) => s ? (SEC_COLORS[s] ?? '#64748b') : '#64748b';

function HeadBadge({ cur, lim }: { cur: number; lim: number | null }) {
  const color = lim == null ? 'var(--text-muted)' : cur > lim ? '#ef4444' : cur === lim ? '#f59e0b' : '#22c55e';
  return <span style={{ color, fontSize: 12, whiteSpace: 'nowrap' }}>занято {cur}{lim != null ? ` / ${lim}` : ''}</span>;
}

function AddModal({ parentId, parentName, onClose, onDone }: { parentId: string | null; parentName: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ name: '', department: '', section: '', staffLimit: '1' });
  const [err, setErr] = useState('');
  const save = async () => {
    if (!f.name) { setErr('Название обязательно'); return; }
    try {
      await apiFetch('/api/org-positions', { method: 'POST', body: JSON.stringify({ ...f, staffLimit: Number(f.staffLimit) || 1, parentId }) });
      onDone(); onClose();
    } catch (e: any) { setErr(e.message); }
  };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13 };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, fontWeight: 500 };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 24, width: 380 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Новая должность</h3>
        {parentId && <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>Дочерняя для: {parentName}</p>}
        {[
          { k: 'name', label: 'Название *', ph: 'Повар' },
          { k: 'department', label: 'Отдел', ph: 'Хлебобулочный цех' },
          { k: 'section', label: 'Секция', ph: 'Производство' },
          { k: 'staffLimit', label: 'Лимит штата', ph: '1', type: 'number' },
        ].map(({ k, label, ph, type }) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={lbl}>{label}</label>
            <input type={type || 'text'} value={(f as any)[k]} onChange={e => setF(fv => ({ ...fv, [k]: e.target.value }))} placeholder={ph} style={inp}/>
          </div>
        ))}
        {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>Отмена</button>
          <button onClick={save} style={{ padding: '8px 16px', background: 'var(--color-primary,#6366f1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Создать</button>
        </div>
      </div>
    </div>
  );
}

function OrgNode({ node, depth, isAdmin, onRefresh }: { node: OrgPos; depth: number; isAdmin: boolean; onRefresh: () => void }) {
  const [open, setOpen] = useState(depth < 2);
  const [editLim, setEditLim] = useState(false);
  const [limVal, setLimVal] = useState(String(node.staffLimit ?? 1));
  const [showAdd, setShowAdd] = useState(false);
  const has = node.children && node.children.length > 0;
  const sc = secColor(node.section);
  const cur = node._count.employees;

  const saveLim = async () => {
    try { await apiFetch(`/api/org-positions/${node.id}`, { method: 'PUT', body: JSON.stringify({ staffLimit: Number(limVal) }) }); onRefresh(); setEditLim(false); }
    catch (e: any) { toast.error(e.message); }
  };

  const del = async () => {
    if (!(await confirmDialog({ message: `Удалить «${node.name}»?`, danger: true }))) return;
    try { await apiFetch(`/api/org-positions/${node.id}`, { method: 'DELETE' }); onRefresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
    borderRadius: 8, marginBottom: 2, background: 'var(--bg-panel)',
    border: '1px solid var(--border-subtle)', cursor: 'default',
  };
  const iconBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 5, display: 'flex', alignItems: 'center' };

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div style={row}>
        <button onClick={() => setOpen(v => !v)} style={{ ...iconBtn, width: 16, flexShrink: 0 }}>
          {has ? (open ? <ChevronDown size={13}/> : <ChevronRight size={13}/>) : <span style={{ width: 13 }}/>}
        </button>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            {node.department && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.department}</span>}
            {node.section && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `${sc}22`, color: sc, border: `1px solid ${sc}44` }}>{node.section}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Users size={12} style={{ color: 'var(--text-muted)' }}/>
          {editLim ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cur} /</span>
              <input autoFocus type="number" min={0} value={limVal} onChange={e => setLimVal(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveLim(); if (e.key==='Escape') setEditLim(false); }}
                style={{ width: 48, background: 'var(--bg-canvas)', border: '1px solid var(--color-primary,#6366f1)', borderRadius: 5, padding: '2px 5px', color: 'var(--text-primary)', fontSize: 12 }}/>
              <button onClick={saveLim} style={{ ...iconBtn, color: '#22c55e' }}><Check size={12}/></button>
              <button onClick={() => setEditLim(false)} style={{ ...iconBtn, color: '#ef4444' }}><X size={12}/></button>
            </div>
          ) : (
            <HeadBadge cur={cur} lim={node.staffLimit}/>
          )}
        </div>
        {isAdmin && !editLim && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => { setLimVal(String(node.staffLimit ?? 1)); setEditLim(true); }} title="Изменить лимит" style={iconBtn}><Pencil size={12}/></button>
            <button onClick={() => setShowAdd(true)} title="Добавить дочернюю" style={iconBtn}><Plus size={12}/></button>
            {cur === 0 && <button onClick={del} title="Удалить" style={{ ...iconBtn, color: '#64748b' }}><Trash2 size={12}/></button>}
          </div>
        )}
      </div>
      {open && has && (
        <div style={{ borderLeft: '1px solid var(--border-subtle)', marginLeft: 18, paddingLeft: 4 }}>
          {node.children!.map(ch => <OrgNode key={ch.id} node={ch} depth={depth+1} isAdmin={isAdmin} onRefresh={onRefresh}/>)}
        </div>
      )}
      {showAdd && <AddModal parentId={node.id} parentName={node.name} onClose={() => setShowAdd(false)} onDone={onRefresh}/>}
    </div>
  );
}

function flatten(nodes: OrgPos[]): { total: number; filled: number; limit: number } {
  return nodes.reduce((a, n) => {
    a.total += 1; a.filled += n._count.employees; a.limit += n.staffLimit ?? 0;
    if (n.children?.length) { const s = flatten(n.children); a.total += s.total; a.filled += s.filled; a.limit += s.limit; }
    return a;
  }, { total: 0, filled: 0, limit: 0 });
}

export default function OrgChartPage() {
  const [tree, setTree] = useState<OrgPos[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const currentUserId = useStore(s => s.currentUserId);
  const users = useStore(s => s.users);
  const user = users.find(u => u.id === currentUserId);
  const isAdmin = user?.role === 'admin' || user?.role === 'owner' || (user?.role as string) === 'cfo';

  const load = useCallback(async () => {
    setLoading(true);
    try { setTree(await apiFetch('/api/org-positions/tree')); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = flatten(tree);
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 };

  return (
    <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto', fontFamily: 'var(--font-family,Inter,sans-serif)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Структура предприятия</h2>
          {!loading && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {stats.total} должностей · занято {stats.filled} / лимит {stats.limit}
          </p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && <button onClick={() => setShowAdd(true)} style={{ ...btnBase, background: 'var(--color-primary,#6366f1)', color: '#fff' }}><Plus size={15}/>Добавить</button>}
          <button onClick={load} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20, padding: '10px 14px', background: 'var(--bg-panel)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
        {Object.entries(SEC_COLORS).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>Загрузка структуры...</div>}

      {!loading && tree.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <Users size={32} style={{ opacity: 0.3, marginBottom: 10 }}/><br/>Структура пуста
        </div>
      )}

      {!loading && tree.map(n => <OrgNode key={n.id} node={n} depth={0} isAdmin={isAdmin} onRefresh={load}/>)}

      {showAdd && <AddModal parentId={null} parentName="" onClose={() => setShowAdd(false)} onDone={load}/>}
    </div>
  );
}
