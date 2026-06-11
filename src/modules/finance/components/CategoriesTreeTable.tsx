import { translateToUz } from '../../../lib/translate';
import React, { useState, useMemo, useCallback } from 'react';
import { useFinanceStore } from '../financeStore';
import type { Category } from '../financeStore';
import {
  ChevronRight, ChevronDown, Plus,
  Folder, FolderOpen, FileText, Pencil, Trash2, FolderPlus, X, GripVertical
} from 'lucide-react';
import {
  ROOT_GROUPS, ROOT_GROUP_BY_TYPE,
  ACTIVITY_LABELS, TYPE_LABELS
} from '../config/categoryGroups';
import { useTranslation } from 'react-i18next';

interface DragState {
  draggedId: string;
  overId: string | null;
  overIsGroup: boolean;
  overType: string | null;
}

interface TreeNode {
  id: string; item?: Category; label: string; type: string;
  children: TreeNode[]; isRoot?: boolean;
}

/* ─── Shared th style ─── */
const th: React.CSSProperties = {
  padding: '9px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
  whiteSpace: 'nowrap', userSelect: 'none', textAlign: 'left',
};

/* ─── Count ALL descendants recursively ─── */
function countDescendants(node: TreeNode): number {
  return node.children.reduce((s, c) => s + 1 + countDescendants(c), 0);
}

/* ─── Find a node anywhere in the tree (any depth) ─── */
function findNode(id: string, nodes: TreeNode[]): TreeNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return undefined;
}

/* ─── Collect all descendant IDs (cycle-safe parent selection) ─── */
function collectDescendantIds(node: TreeNode): Set<string> {
  const ids = new Set<string>();
  const walk = (n: TreeNode) => n.children.forEach(c => { ids.add(c.id); walk(c); });
  walk(node);
  return ids;
}

/* ──────────────────────────────────
   CATEGORY FORM MODAL
   Full form: name + type + parent + activity
────────────────────────────────── */
interface ModalProps {
  mode: 'create' | 'edit';
  initial?: Partial<Category>;
  defaultType?: string;
  defaultParentId?: string;
  rootNodes: TreeNode[];
  categories: Category[];
  onSave: (data: Omit<Category, 'id'>) => void;
  onClose: () => void;
}

const CategoryModal: React.FC<ModalProps> = ({
  mode, initial, defaultType, defaultParentId, rootNodes, categories, onSave, onClose
}) => {
  const { t } = useTranslation();
    const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? defaultType ?? 'expense');
  const [activity, setActivity] = useState(initial?.activity ?? '');
  const [parentId, setParentId] = useState(initial?.parentId ?? defaultParentId ?? '');
  const [nameUz, setNameUz] = useState((initial as any)?.nameUz ?? '');
  const [translating, setTranslating] = useState(false);

  const fieldCss: React.CSSProperties = {
    width: '100%', padding: '0 10px', height: 32,
    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
    borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelCss: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5, display: 'block',
  };

  // FIX #1: search any depth, not just 1st level
  const forbiddenIds = useMemo(() => {
    if (!initial?.id) return new Set<string>();
    const selfNode = findNode(initial.id, rootNodes);
    const ids = selfNode ? collectDescendantIds(selfNode) : new Set<string>();
    ids.add(initial.id);
    return ids;
  }, [initial?.id, rootNodes]);

  const parentOptions = categories.filter(c => c.type === type && !forbiddenIds.has(c.id));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.25)', padding: '22px 24px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {mode === 'create' ? 'Новая статья' : 'Редактировать статью'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelCss}>{t("Наименование", "Наименование")}</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              placeholder={t("Например: Аренда офиса", "Например: Аренда офиса")} style={fieldCss} />
          </div>
          <div>
            <label style={labelCss}>Nomi (UZ)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={nameUz} onChange={e => setNameUz(e.target.value)}
                placeholder="O'zbekcha nomi" style={{ ...fieldCss, flex: 1 }} />
              <button type="button" disabled={!name.trim() || translating}
                onClick={async () => { setTranslating(true); const uz = await translateToUz(name.trim()); if (uz) setNameUz(uz); setTranslating(false); }}
                style={{ flexShrink: 0, height: 32, padding: '0 12px', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 12, cursor: (name.trim() && !translating) ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
                {translating ? '…' : 'Перевести'}
              </button>
            </div>
          </div>
          <div>
            <label style={labelCss}>{t("Тип", "Тип")}</label>
            <select value={type} onChange={e => { setType(e.target.value); setParentId(''); }} style={fieldCss}>
              {ROOT_GROUPS.map(g => <option key={g.type} value={g.type}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelCss}>{t("Родительская группа", "Родительская группа")}</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} style={fieldCss}>
              <option value="">{t("— Корневой уровень", "— Корневой уровень")}</option>
              {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {(type === 'expense' || type === 'income') && (
            <div>
              <label style={labelCss}>{t("Вид деятельности (ОДДС)", "Вид деятельности (ОДДС)")}</label>
              <select value={activity} onChange={e => setActivity(e.target.value)} style={fieldCss}>
                <option value="">{t("— Не указано", "— Не указано")}</option>
                <option value="operating">{t("Операционный", "Операционный")}</option>
                <option value="financing">{t("Финансовая", "Финансовая")}</option>
                <option value="investing">{t("Инвестиционный", "Инвестиционный")}</option>
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button onClick={onClose} style={{ flex: 1, height: 32, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
              
              {t("Отозвать", "Отозвать")}
            </button>
            <button
              disabled={!name.trim()}
              onClick={() => onSave({
                name: name.trim(),
                nameUz: nameUz.trim() || undefined,
                type: type as Category['type'],
                activity: (activity as any) || undefined,
                parentId: parentId || (null as any)
              })}
              style={{
                flex: 1, height: 32, border: 'none', borderRadius: 6,
                background: !name.trim() ? 'var(--bg-elevated)' : 'var(--color-primary)',
                color: !name.trim() ? 'var(--text-muted)' : '#fff',
                fontSize: 12, fontWeight: 600,
                cursor: name.trim() ? 'pointer' : 'default',
                boxShadow: name.trim() ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
              }}>
              {mode === 'create' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────
   GROUP ROW
────────────────────────────────── */
const GroupRow: React.FC<{
  node: TreeNode; isOpen: boolean; color: string;
  isDropTarget: boolean;
  onToggle: () => void; onAdd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}> = ({ node, isOpen, color, isDropTarget, onToggle, onAdd, onDragOver, onDragLeave, onDrop }) => {
  const { t } = useTranslation();
    const totalCount = countDescendants(node);
  const tdG: React.CSSProperties = {
    padding: '10px 14px', fontSize: 12, fontWeight: 700,
    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
    background: isDropTarget ? 'rgba(99,102,241,0.10)' : 'var(--bg-hover)',
    whiteSpace: 'nowrap',
    borderLeft: isDropTarget ? '2px solid var(--color-primary)' : '2px solid transparent',
    transition: 'background 0.1s',
  };
  return (
    <tr
      style={{ cursor: 'pointer' }}
      onClick={onToggle}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <td style={{ ...tdG, width: 32, paddingRight: 0 }}>
        {isOpen
          ? <ChevronDown size={13} color="var(--text-muted)" />
          : <ChevronRight size={13} color="var(--text-muted)" />}
      </td>
      <td style={{ ...tdG, paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
            {node.label}
          </span>
          {totalCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {totalCount}
            </span>
          )}
          {isDropTarget && (
            <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '0.04em' }}>
              
              {t("↓ ПЕРЕНЕСТИ СЮДА", "↓ ПЕРЕНЕСТИ СЮДА")}
            </span>
          )}
        </div>
      </td>
      <td style={tdG} />
      <td style={tdG} />
      <td style={{ ...tdG, textAlign: 'right' }}>
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Plus size={12} />  {t("Добавить", "Добавить")}
        </button>
      </td>
    </tr>
  );
};


/* ──────────────────────────────────
   ITEM ROW
────────────────────────────────── */
const ItemRow: React.FC<{
  node: TreeNode; level: number; isOpen: boolean; hasChildren: boolean; color: string;
  usageCount: number; isDragging: boolean; isDropTarget: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void; onAddChild: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}> = ({ node, level, isOpen, hasChildren, color, usageCount, isDragging, isDropTarget,
        onToggle, onEdit, onDelete, onAddChild,
        onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd }) => {
  const { t } = useTranslation();
    const [hover, setHover] = useState(false);
  const descCount = hasChildren ? countDescendants(node) : 0;

  const td: React.CSSProperties = {
    padding: '9px 14px', fontSize: 12,
    borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
    color: 'var(--text-primary)',
    background: isDropTarget ? 'rgba(99,102,241,0.07)' : hover ? 'var(--bg-hover)' : 'var(--bg-base)',
    transition: 'background 0.1s',
    borderLeft: isDropTarget ? '2px solid var(--color-primary)' : '2px solid transparent',
  };

  return (
    <tr
      draggable
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ opacity: isDragging ? 0.4 : 1, cursor: 'grab' }}
    >
      <td style={{ ...td, width: 32, paddingRight: 0 }}>
        {hasChildren
          ? <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          : <GripVertical size={12} color="var(--text-muted)" style={{ opacity: hover ? 0.5 : 0 }} />}
      </td>
      <td style={{ ...td, paddingLeft: 8 + level * 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasChildren
            ? isOpen
              ? <FolderOpen size={13} style={{ color, flexShrink: 0 }} />
              : <Folder size={13} style={{ color, flexShrink: 0 }} />
            : <FileText size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
          <span style={{ fontWeight: hasChildren ? 500 : 400 }}>{node.label}</span>
          {hasChildren && (
            <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              {descCount}
            </span>
          )}
        </div>
      </td>
      <td style={{ ...td, color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
          {TYPE_LABELS[node.type] ?? node.type}
        </span>
      </td>
      <td style={{ ...td, color: 'var(--text-secondary)' }}>
        {node.item?.activity ? ACTIVITY_LABELS[node.item.activity] ?? node.item.activity : '—'}
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        {usageCount > 0 && (
          <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 7px', borderRadius: 4, marginRight: 8, fontWeight: 600 }}>
            {usageCount}  {t("транз.", "транз.")}
          </span>
        )}
        <div style={{ display: 'inline-flex', gap: 2, transition: 'opacity 0.12s' }}>
          <button onClick={onAddChild} title={t("Добавить подстатью", "Добавить подстатью")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <FolderPlus size={14} />
          </button>
          <button onClick={onEdit} title={t("Редактировать", "Редактировать")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} title={t("Удалить", "Удалить")}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '3px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ──────────────────────────────────
   MAIN EXPORT
   FIX #2: removed unused onCreateRoot prop
────────────────────────────────── */
export const CategoriesTreeTable: React.FC<{
  searchQuery: string;
  selectedRootType: string;
}> = ({ searchQuery, selectedRootType }) => {
  const { t } = useTranslation();
    const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinanceStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root_income', 'root_expense']));
  const [modal, setModal] = useState<{
    mode: 'create' | 'edit';
    initial?: Partial<Category>;
    defaultType?: string;
    defaultParentId?: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  // Usage map: direct transaction count per category
  const usageMap = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach(t => { if (t.categoryId) m[t.categoryId] = (m[t.categoryId] ?? 0) + 1; });
    return m;
  }, [transactions]);

  // Recursive usage: sum of self + all descendants
  function totalUsage(node: TreeNode): number {
    return (usageMap[node.id] ?? 0) + node.children.reduce((s, c) => s + totalUsage(c), 0);
  }

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /* Build tree */
  const rootNodes = useMemo<TreeNode[]>(() => {
    const catMap = new Map<string, TreeNode>();
    categories.forEach(cat =>
      catMap.set(cat.id, { id: cat.id, item: cat, label: cat.name, type: cat.type, children: [] })
    );
    const trees: TreeNode[] = ROOT_GROUPS.map(g => ({
      id: g.id, label: g.label, type: g.type, children: [], isRoot: true
    }));
    const typeToRoot: Record<string, TreeNode> = {};
    ROOT_GROUPS.forEach((g, i) => { typeToRoot[g.type] = trees[i]; });
    categories.forEach(cat => {
      const node = catMap.get(cat.id)!;
      if (cat.parentId && catMap.has(cat.parentId)) {
        catMap.get(cat.parentId)!.children.push(node);
      } else {
        (typeToRoot[cat.type] ?? trees[0]).children.push(node);
      }
    });
    return trees;
  }, [categories]);

  const filterTree = useCallback((node: TreeNode, q: string): TreeNode | null => {
    const children = node.children.map(c => filterTree(c, q)).filter(Boolean) as TreeNode[];
    if (!q || node.label.toLowerCase().includes(q.toLowerCase()) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  }, []);

  // Filter roots: hide empty groups, auto-expand-ready when searching
  const visibleRoots = useMemo(() =>
    rootNodes
      .filter(r => !selectedRootType || r.type === selectedRootType)
      .map(r => filterTree(r, searchQuery))
      .filter((r): r is TreeNode => r !== null && r.children.length > 0),
    [rootNodes, searchQuery, selectedRootType, filterTree]
  );

  // When search is active, ensure all roots are in expanded set
  // (we override isExp in renderNode, but also expand GroupRow children)
  const isGroupExpanded = (rootId: string) =>
    searchQuery ? true : expanded.has(rootId);

  /* DnD handlers */
  const handleDragStart = useCallback((e: React.DragEvent, id: string, type: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDrag({ draggedId: id, overId: null, overIsGroup: false, overType: type });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string, isGroup: boolean, targetType: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDrag(prev => prev ? { ...prev, overId: targetId, overIsGroup: isGroup, overType: targetType } : prev);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string, isGroup: boolean, targetType: string) => {
    e.preventDefault();
    if (!drag) return;
    const { draggedId } = drag;
    if (draggedId === targetId) { setDrag(null); return; }
    // Prevent dropping into own descendant
    const self = findNode(draggedId, rootNodes);
    if (self && collectDescendantIds(self).has(targetId)) { setDrag(null); return; }
    if (isGroup) {
      // Drop onto group header → become root item of that type
      updateCategory(draggedId, { type: targetType as Category['type'], parentId: null as any });
    } else {
      // Drop onto item → become its child, inherit its type
      const targetNode = findNode(targetId, rootNodes);
      updateCategory(draggedId, { parentId: targetId, type: (targetNode?.type ?? targetType) as Category['type'] });
    }
    setDrag(null);
  }, [drag, rootNodes, updateCategory]);

  /* Recursive row renderer */
  const renderNode = (node: TreeNode, level = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExp = searchQuery ? true : expanded.has(node.id);
    const color = ROOT_GROUP_BY_TYPE[node.type as keyof typeof ROOT_GROUP_BY_TYPE]?.color ?? 'var(--text-muted)';
    const isDragging = drag?.draggedId === node.id;
    const isDropTarget = drag !== null && drag.overId === node.id && !isDragging;

    return (
      <React.Fragment key={node.id}>
        <ItemRow
          node={node} level={level} isOpen={isExp}
          hasChildren={hasChildren} color={color}
          usageCount={totalUsage(node)}
          isDragging={isDragging} isDropTarget={isDropTarget}
          onToggle={() => toggle(node.id)}
          onEdit={() => setModal({ mode: 'edit', initial: node.item })}
          onDelete={() => setDeleteId(node.id)}
          onAddChild={() => setModal({ mode: 'create', defaultType: node.type, defaultParentId: node.id })}
          onDragStart={e => handleDragStart(e, node.id, node.type)}
          onDragOver={e => handleDragOver(e, node.id, false, node.type)}
          onDragLeave={() => setDrag(prev => prev ? { ...prev, overId: null } : null)}
          onDrop={e => handleDrop(e, node.id, false, node.type)}
          onDragEnd={() => setDrag(null)}
        />
        {isExp && node.children.map(child => renderNode(child, level + 1))}
      </React.Fragment>
    );
  };

  const deleteTarget = categories.find(c => c.id === deleteId);

  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 32 }} />
            <th style={th}>{t("Статья", "Статья")}</th>
            <th style={{ ...th, width: 160 }}>{t("Тип", "Тип")}</th>
            <th style={{ ...th, width: 180 }}>{t("Вид деятельности", "Вид деятельности")}</th>
            <th style={{ ...th, width: 120, textAlign: 'right' }}>{t("Транзакции / Действия", "Транзакции / Действия")}</th>
          </tr>
        </thead>
        <tbody>
          {visibleRoots.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {searchQuery
                  ? `По запросу «${searchQuery}» ничего не найдено`
                  : 'Нет учётных статей. '}
                {!searchQuery && (
                  <button onClick={() => setModal({ mode: 'create' })}
                    style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                    
                    {t("Создать первую", "Создать первую")}
                  </button>
                )}
              </td>
            </tr>
          ) : visibleRoots.map(root => {
            const meta = ROOT_GROUP_BY_TYPE[root.type as keyof typeof ROOT_GROUP_BY_TYPE];
            const isDropTarget = drag !== null && drag.overId === root.id;
            return (
              <React.Fragment key={root.id}>
                <GroupRow
                  node={root}
                  isOpen={isGroupExpanded(root.id)}
                  onToggle={() => toggle(root.id)}
                  onAdd={() => setModal({ mode: 'create', defaultType: root.type })}
                  color={meta?.color ?? '#64748b'}
                  isDropTarget={isDropTarget}
                  onDragOver={e => handleDragOver(e, root.id, true, root.type)}
                  onDragLeave={() => setDrag(prev => prev ? { ...prev, overId: null } : null)}
                  onDrop={e => handleDrop(e, root.id, true, root.type)}
                />
                {isGroupExpanded(root.id) && root.children.map(child => renderNode(child, 0))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* FIX #4: unified full CategoryModal for both create paths */}
      {modal && (
        <CategoryModal
          mode={modal.mode}
          initial={modal.initial}
          defaultType={modal.defaultType}
          defaultParentId={modal.defaultParentId}
          rootNodes={rootNodes}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={async data => {
            if (modal.mode === 'create') await addCategory(data);
            else if (modal.initial?.id) await updateCategory(modal.initial.id, data);
            setModal(null);
          }}
        />
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, width: 400, padding: 24, boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                  
                  {t("Удалить статью?", "Удалить статью?")}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  «{deleteTarget?.name}{t("» будет удалена безвозвратно.", "» будет удалена безвозвратно.")}
                  {deleteTarget && categories.some(c => c.parentId === deleteTarget.id) && (
                    <span style={{ display: 'block', marginTop: 6, color: '#f59e0b' }}>
                      
                      {t("⚠ Все вложенные подстатьи также будут удалены.", "⚠ Все вложенные подстатьи также будут удалены.")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteId(null)}
                style={{ flex: 1, height: 32, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                
                {t("Отозвать", "Отозвать")}
              </button>
              <button onClick={() => { deleteCategory(deleteId); setDeleteId(null); }}
                style={{ flex: 1, height: 32, background: '#ef4444', border: 'none', borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                
                {t("Удалить", "Удалить")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Re-export CategoryModal so ReferencesCategoriesPage can use the same full form
export { CategoryModal };
export type { ModalProps as CategoryModalProps };
