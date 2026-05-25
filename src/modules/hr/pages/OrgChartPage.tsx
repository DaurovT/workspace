import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Printer, Building2, Users, Network, ListTree, ZoomIn, ZoomOut } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface OrgNode {
  id: string;
  ru: string;
  uz?: string;
  staff?: string;
  level: 1 | 2 | 3 | 4;
  children?: OrgNode[];
  schedule?: string;
  note?: string;
}

// ─── Full Structure Data ────────────────────────────────────────────
const DATA: OrgNode = {
  id: 'dir', ru: 'Директор МЧЖ «Бекабадский комбинат питания»', uz: '«Бекобод Овқатланиш комбинати» МЧЖ директори', staff: '1/1', level: 1,
  children: [
    { id: 'hr', ru: 'Нач. бюро по управлению персоналом', uz: 'Ходимларни бошқариш бюроси бошлиғи', staff: '1/1', level: 2, children: [
      { id: 'hr1', ru: 'Специалист по зарплате и вознаграждениям', uz: 'Иш ҳақи ва мукофотлар бўйича профессионал-мутахассис', staff: '1/0', level: 4 },
      { id: 'hr2', ru: 'Инспектор по кадрам', uz: 'Кадрлар бўйича инспектор', staff: '1/0', level: 4 },
    ]},
    { id: 'fs', ru: 'Нач. группы по безопасности пищевых продуктов и контролю качества', uz: 'Озиқ-овқат хавфсизлиги ва сифат назорати бўйича гуруҳ бошлиғи', staff: '1/1', level: 2, children: [
      { id: 'tech', ru: 'Техник-технолог по пищевой промышленности', uz: 'Озиқ-овқат саноати бўйича техник-технолог', staff: '1/0', level: 3 },
      { id: 'g24', ru: 'Круглосуточно (00:00–24:00)', uz: 'Соат 00:00 дан 24:00 гача', level: 3, schedule: '00:00–24:00', children: [
        { id: 'npb', ru: 'Столовая НПБ', uz: 'НПБ ошхонаси', staff: '1/0', level: 4 },
        { id: 'epeb1', ru: 'Столовая ЭПЭБ', uz: 'ЭПЭБ ошхонаси', staff: '1/0', level: 4 },
        { id: 'zpb1', ru: 'Столовая ЗПБ', uz: 'ЗПБ ошхонаси', staff: '1/0', level: 4 },
        { id: 'fich', ru: 'Столовая ФИЧ', uz: 'ФИЧ ошхонаси', staff: '1/0', level: 4 },
        { id: 'dan', ru: 'Столовая «Даниель»', uz: 'Даниель ошхонаси', staff: '1/0', level: 4 },
      ]},
    ]},
    { id: 'dep', ru: 'Заместитель директора', uz: 'Директори ўринбосари', staff: '1/1', level: 2, children: [
      { id: 'prod', ru: 'Нач. производственного отдела', uz: 'Ишлаб чиқариш бўлими бошлиғи', staff: '1/1', level: 3, children: [
        { id: 'g20', ru: 'С 08:00 до 20:00', uz: 'Соат 08:00 дан 20:00 гача', level: 3, schedule: '08:00–20:00', children: [
          { id: 'hot', ru: 'Столовая гостиницы', uz: 'Меҳмонхона ошхонаси', staff: '1/0', level: 4 },
          { id: 'npba', ru: 'Столовая стажировки НПБ', uz: 'НПБ адъюстаж ошхонаси', staff: '1/0', level: 4 },
          { id: 'ebuf', ru: 'Буфет ЭПЭБ', uz: 'ЭПЭБ буфети', staff: '1/0', level: 4 },
          { id: 'kmbuf', ru: 'Буфет КМехБ', uz: 'КМехБ буфети', staff: '1/0', level: 4 },
          { id: 'zbuf', ru: 'Буфет ЗПБ', uz: 'ЗПБ буфети', staff: '1/0', level: 4 },
          { id: 'baz', ru: 'Кафетерий «Базальт»', uz: 'Базальт кафетерияси', staff: '1/0', level: 4 },
        ]},
        { id: 'g17', ru: 'С 08:00 до 17:00', uz: 'Соат 08:00 дан 17:00 гача', level: 3, schedule: '08:00–17:00', children: [
          { id: 'tyh', ru: 'Столовая ТЙХ', uz: 'ТЙХ ошхонаси', staff: '1/0', level: 4 },
          { id: 'mtb', ru: 'Столовая МТБ', uz: 'МТБ ошхонаси', staff: '1/0', level: 4 },
          { id: 'him', ru: 'Столовая ХИМИЧ', uz: 'ХИМИЧ ошхонаси', staff: '1/0', level: 4 },
          { id: 'enat', ru: 'Столовая нац. блюд ЭПЭБ', uz: 'ЭПЭБ миллий таомлар ошхонаси', staff: '1/0', level: 4 },
          { id: 'mkb', ru: 'Столовая МКБ', uz: 'МКБ ошхонаси', staff: '1/0', level: 4 },
          { id: 'ecaf', ru: 'Кафетерий ЭПЭБ', uz: 'ЭПЭБ кафетерияси', staff: '1/0', level: 4 },
          { id: 'hbuf', ru: 'Буфет ХИМИЧ', uz: 'ХИМИЧ буфети', staff: '1/0', level: 4 },
          { id: 'kpmbuf', ru: 'Буфет КПМ', uz: 'КПМ буфети', staff: '1/0', level: 4, note: 'Тушлик: 11:30–13:30, 02:00–03:30' },
          { id: 'nbuf', ru: 'Буфет НПБ', uz: 'НПБ буфети', staff: '1/0', level: 4 },
        ]},
      ]},
    ]},
    { id: 'oht', ru: 'Специалист по охране труда и ТБ', uz: 'Меҳнат муҳофазаси ва техника хавфсизлиги бўйича профессионал-мутахассис', staff: '1/0', level: 2, children: [
      { id: 'el', ru: 'Электромеханик', uz: 'Электромеханик', staff: '2/0', level: 4 },
      { id: 'lab', ru: 'Лаборант-кассир производства', uz: 'Ишлаб чиқариш лаборанти-сотувчи кассир', staff: '1/0', level: 4 },
      { id: 'br', ru: 'Зав. цехом хлебобулочных изд.', uz: 'Нон ва булочка маҳсулотлари ишлаб чиқариш цехи мудири', staff: '1/1', level: 3, children: [
        { id: 'brd', ru: 'Экспедитор-водитель', uz: 'Экспедитор-ҳайдовчи', staff: '1/0', level: 4 },
      ]},
      { id: 'cn', ru: 'Зав. кондитерским цехом', uz: 'Қандолат цехи мудири', staff: '1/1', level: 3, children: [
        { id: 'cnd', ru: 'Экспедитор-водитель (лабо)', uz: 'Экспедитор-ҳайдовчи (лабо)', staff: '2/0', level: 4 },
      ]},
    ]},
    { id: 'fin', ru: 'Нач. отдела финансов и экономики', uz: 'Молия ва иқтисодиёт бўлими бошлиғи', staff: '1/1', level: 2, children: [
      { id: 'ca', ru: 'Главный бухгалтер', uz: 'Бош бухгалтер', staff: '1/1', level: 3 },
      { id: 'ac', ru: 'Бухгалтер', uz: 'Бухгалтер', staff: '2/0', level: 4 },
      { id: 'ec', ru: 'Бухгалтер-экономист', uz: 'Бухгалтер-иқтисодчи', staff: '1/0', level: 4 },
      { id: 'ct', ru: 'Счетовод', uz: 'Ҳисобловчи', staff: '1/0', level: 4 },
      { id: 'lw', ru: 'Юрисконсульт', uz: 'Юристконсулт', staff: '0,5/0', level: 4 },
    ]},
    { id: 'com', ru: 'Коммерческий отдел', uz: 'Тижорат бўлими', staff: '1/1', level: 2, children: [
      { id: 'pr', ru: 'Специалист по организации закупок', uz: 'Харидларни ташкил этиш бўйича мутахассис', staff: '1/0', level: 4 },
      { id: 'wh', ru: 'Зав. складом снабжения и центр. складом', uz: 'Таъминот ва марказий омбор хўжалиги мудири', staff: '1/1', level: 3, children: [
        { id: 'md', ru: 'Экспедитор (молочная продукция)', uz: 'Экспедитор (сут маҳсулотлари)', staff: '1/0', level: 4 },
      ]},
    ]},
  ],
};

const LEVEL_BORDER = ['', '#6d28d9', '#8b5cf6', '#94a3b8', '#cbd5e1'];

function countNodes(n: OrgNode): number {
  let c = 1;
  n.children?.forEach(ch => c += countNodes(ch));
  return c;
}

// ─── Diagram View Components ────────────────────────────────────────

function NodeCard({ node, isRoot }: { node: OrgNode, isRoot?: boolean }) {
  const isSched = !!node.schedule;

  if (isSched) {
    return (
      <div style={{
        background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: 8,
        padding: '6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        width: 180, textAlign: 'center', zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="#f59e0b" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>{node.schedule}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: isRoot ? '#1e1b4b' : '#fff',
      border: `2px solid ${isRoot ? '#6d28d9' : '#cbd5e1'}`,
      borderRadius: 8,
      padding: '10px 12px',
      width: isRoot ? 320 : 210,
      textAlign: 'center',
      boxShadow: isRoot ? '0 8px 24px rgba(109,40,217,0.3)' : '0 2px 6px rgba(0,0,0,0.04)',
      zIndex: 1,
      display: 'flex', flexDirection: 'column',
      position: 'relative'
    }}>
      <div style={{ fontSize: isRoot ? 14 : 11, fontWeight: 700, color: isRoot ? '#fff' : '#1e293b', lineHeight: 1.25 }}>
        {node.ru}
      </div>
      {node.uz && (
        <div style={{ fontSize: isRoot ? 11 : 9.5, color: isRoot ? 'rgba(255,255,255,0.7)' : '#64748b', fontStyle: 'italic', marginTop: 4, lineHeight: 1.2 }}>
          {node.uz}
        </div>
      )}
      {node.staff && (
        <>
          <div style={{ height: 1, background: isRoot ? 'rgba(255,255,255,0.2)' : '#e2e8f0', margin: '8px -12px 6px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isRoot ? '#c4b5fd' : '#8b5cf6' }}>
            {node.staff}
          </div>
        </>
      )}
      {node.note && (
        <div style={{ fontSize: 9, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>
          {node.note}
        </div>
      )}
    </div>
  );
}

function VerticalStack({ nodes }: { nodes: OrgNode[] }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {nodes.map((node) => (
        <React.Fragment key={node.id}>
          <div style={{ width: 2, height: 20, background: '#cbd5e1' }} />
          <NodeCard node={node} />
          {node.children && node.children.length > 0 && (
            <VerticalStack nodes={node.children} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DiagramView({ zoom }: { zoom: number }) {
  const l2Nodes = DATA.children || [];

  return (
    <div style={{
      padding: '40px 60px', minWidth: 'max-content',
      transform: `scale(${zoom})`, transformOrigin: 'top center',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transition: 'transform 0.2s ease-out'
    }}>
      <NodeCard node={DATA} isRoot />
      <div style={{ width: 2, height: 30, background: '#cbd5e1' }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
          {l2Nodes.map((l2, i) => (
            <div key={l2.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 210, position: 'relative' }}>
               {/* Horizontal connector segment */}
               <div style={{
                 position: 'absolute', top: 0, height: 2, background: '#cbd5e1',
                 left: i === 0 ? '50%' : 0,
                 right: i === l2Nodes.length - 1 ? '50%' : 0,
               }} />
              <div style={{ width: 2, height: 20, background: '#cbd5e1' }} />
              <NodeCard node={l2} />
              <VerticalStack nodes={l2.children || []} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── List View Components ───────────────────────────────────────────

function ListRow({ node, depth, collapsed, toggleSet }: {
  node: OrgNode; depth: number; collapsed: Set<string>; toggleSet: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const isOpen = !collapsed.has(node.id);
  const has = node.children && node.children.length > 0;
  const isSched = !!node.schedule;
  const isDir = node.level === 1;
  const indent = depth * 28;

  const toggle = () => {
    if (!has) return;
    toggleSet(p => { const s = new Set(p); s.has(node.id) ? s.delete(node.id) : s.add(node.id); return s; });
  };

  return (
    <>
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'stretch', cursor: has ? 'pointer' : 'default',
          borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s',
          background: isDir ? '#1e1b4b' : undefined,
        }}
        onMouseEnter={e => { if (!isDir) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!isDir) e.currentTarget.style.background = ''; }}
      >
        <div style={{ width: 4, flexShrink: 0, borderRadius: '0 2px 2px 0', background: isSched ? '#f59e0b' : LEVEL_BORDER[node.level] }} />
        <div style={{ width: indent + 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
          {has ? (isOpen ? <ChevronDown size={14} color={isDir ? '#a78bfa' : '#94a3b8'} /> : <ChevronRight size={14} color={isDir ? '#a78bfa' : '#94a3b8'} />) : <div style={{ width: 14 }} />}
        </div>
        {isSched && <div style={{ display: 'flex', alignItems: 'center', marginRight: 6 }}><Clock size={13} color="#f59e0b" /></div>}
        <div style={{ flex: 1, padding: isDir ? '12px 8px' : '8px 8px', minWidth: 0 }}>
          <div style={{ fontSize: isDir ? 13 : isSched ? 11 : node.level === 2 ? 12 : node.level === 3 ? 11.5 : 11, fontWeight: isDir ? 700 : node.level <= 3 || isSched ? 600 : 400, color: isDir ? '#fff' : isSched ? '#92400e' : '#1e293b', lineHeight: 1.35 }}>
            {node.ru}
          </div>
          {node.uz && !isSched && (
            <div style={{ fontSize: isDir ? 11 : node.level === 2 ? 10 : 9.5, color: isDir ? 'rgba(255,255,255,0.55)' : '#94a3b8', fontStyle: 'italic', lineHeight: 1.3, marginTop: 1 }}>
              {node.uz}
            </div>
          )}
          {node.note && <div style={{ fontSize: 9, color: '#b45309', marginTop: 2, fontStyle: 'italic' }}>{node.note}</div>}
        </div>
        {node.staff && (
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isDir ? '#c4b5fd' : '#8b5cf6', background: isDir ? 'rgba(139,92,246,0.2)' : '#f5f3ff', padding: '2px 10px', borderRadius: 4, border: isDir ? 'none' : '1px solid #ede9fe' }}>
              {node.staff}
            </span>
          </div>
        )}
        {has && (
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: isDir ? 'rgba(255,255,255,0.4)' : '#94a3b8' }}>{countNodes(node) - 1}</span>
          </div>
        )}
      </div>
      {has && isOpen && node.children!.map(ch => <ListRow key={ch.id} node={ch} depth={depth + 1} collapsed={collapsed} toggleSet={toggleSet} />)}
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function OrgChartPage() {
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(0.85);

  const expandAll = () => setCollapsed(new Set());
  const collapseL2 = () => {
    const ids = new Set<string>();
    DATA.children?.forEach(c => ids.add(c.id));
    setCollapsed(ids);
  };

  const totalPositions = countNodes(DATA);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: '#fff',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <Building2 size={16} color="#8b5cf6" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Оргструктура</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 'auto' }}>— МЧЖ «Бекабадский комбинат питания»</span>
        
        {/* View Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 8, marginRight: 12 }}>
          <button
            onClick={() => setViewMode('diagram')}
            style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: 'none',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              background: viewMode === 'diagram' ? '#fff' : 'transparent',
              color: viewMode === 'diagram' ? '#1e293b' : '#64748b',
              boxShadow: viewMode === 'diagram' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Network size={14} /> Схема
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', border: 'none',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              background: viewMode === 'list' ? '#fff' : 'transparent',
              color: viewMode === 'list' ? '#1e293b' : '#64748b',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <ListTree size={14} /> Список
          </button>
        </div>

        {viewMode === 'diagram' && (
          <>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} style={btn}><ZoomOut size={14} /></button>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#64748b', width: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} style={btn}><ZoomIn size={14} /></button>
            <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          </>
        )}
        
        {viewMode === 'list' && (
          <>
            <button onClick={expandAll} style={btn}>Развернуть</button>
            <button onClick={collapseL2} style={btn}>Свернуть</button>
            <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 4px' }} />
          </>
        )}
        
        <button onClick={() => window.print()} style={btn} title="Печать"><Printer size={14} /></button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', background: viewMode === 'diagram' ? '#f8fafc' : '#fff' }}>
        {viewMode === 'diagram' ? (
          <DiagramView zoom={zoom} />
        ) : (
          <ListRow node={DATA} depth={0} collapsed={collapsed} toggleSet={setCollapsed} />
        )}
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 20px', borderTop: '1px solid #e2e8f0', background: '#fff',
        display: 'flex', gap: 20, fontSize: 10, color: '#94a3b8', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span><b style={{ color: '#8b5cf6' }}>X/Y</b> — штатных ед. / факт. занятых</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={11} color="#f59e0b" /> Группы по графику
        </span>
        <span>КПМ: 11:30–13:30, 02:00–03:30</span>
        <span>ИА: 13:00–14:00</span>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={11} color="#94a3b8" /> {totalPositions} позиций
        </span>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
  cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: 4,
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
};
