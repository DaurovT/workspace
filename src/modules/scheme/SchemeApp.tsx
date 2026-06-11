import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

import { CLR, LEGEND, BLOCKS, NODES, ARROWS, CARGO_COLORS, CARGO_LEGEND, FLEET_PLACEHOLDER, LOGISTICS, RADIAL_NODES, RADIAL_FLOWS, TIMELINE_TRIPS, TIMELINE_TRACKS } from './schemeData';

type ViewMode = 'flow' | 'plan' | 'logistics';

export default function SchemeApp() {
  const [view, setView] = useState<ViewMode>('plan');
  const [flowExpanded, setFlowExpanded] = useState<string[]>([]);
  const [planExpanded, setPlanExpanded] = useState<string[]>([]);
  const [logExpanded, setLogExpanded] = useState<string[]>([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#flow') setView('flow');
    else if (hash === '#plan') setView('plan');
    else if (hash === '#logistics') setView('logistics');
  }, []);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    window.history.pushState(null, '', `#${newView}`);
  };

  const toggleFlowBlock = (id: string) => {
    setFlowExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const expandAllFlow = () => setFlowExpanded(BLOCKS.map(b => b.id));
  const collapseAllFlow = () => setFlowExpanded([]);

  const togglePlanBlock = (id: string) => {
    setPlanExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleLogBlock = (id: string) => {
    setLogExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const scrollToPlanBlock = (id?: string) => {
    if (!id) return;
    setPlanExpanded(prev => prev.includes(id) ? prev : [...prev, id]);
    setTimeout(() => {
      const el = document.getElementById(`plan-desc-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('flash-highlight');
        setTimeout(() => el.classList.remove('flash-highlight'), 1500);
      }
    }, 100);
  };

  return (
    <div className="scheme-app">
      <style>{`
        .scheme-app {
          --bg-dark: var(--bg-canvas, #0f172a);
          --bg-panel: var(--bg-panel, #1e293b);
          --text-main: var(--text-primary, #f8fafc);
          --text-muted: #cbd5e1;
          --border-color: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.18);
          
          background: var(--bg-dark);
          color: var(--text-main);
          height: 100dvh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-y: auto;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .scheme-app * { box-sizing: border-box; }

        .scheme-content {
          padding: 24px;
          flex: 1;
        }

        .scheme-header-bar {
          height: 52px; border-bottom: 1px solid var(--border-color);
          display: flex; align-items: center; padding: 0 20px; gap: 12px;
          background: var(--bg-panel); flex-shrink: 0;
        }
        .scheme-header-title { margin: 0; font-size: 16px; font-weight: 600; color: #f8fafc; }

        .scheme-legend-bar {
          display: flex; align-items: center; gap: 18px; padding: 10px 20px;
          background: var(--bg-panel); border-bottom: 1px solid var(--border-color);
          flex-shrink: 0; flex-wrap: wrap;
        }

        .scheme-tabs {
          display: flex; gap: 8px;
          background: var(--bg-panel); padding: 4px; border-radius: 8px;
          width: fit-content; margin-bottom: 24px; border: 1px solid var(--border-color);
        }
        .scheme-tab {
          padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;
          color: #cbd5e1; cursor: pointer; border: none; background: transparent;
          transition: all 0.2s;
        }
        .scheme-tab:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .scheme-tab.active { background: #6366f1; color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

        .scheme-controls { display: flex; gap: 12px; margin-bottom: 32px; }

        .scheme-btn {
          background: var(--bg-panel); border: 1px solid var(--border-color);
          color: #f8fafc; padding: 8px 16px; border-radius: 6px;
          cursor: pointer; font-size: 14px; transition: background 0.2s;
        }
        .scheme-btn:hover { background: #2a3548; border-color: var(--border-hover); }

        .scheme-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr;
          gap: 16px; align-items: stretch;
        }

        .grid-card, .plan-desc-card {
          background: var(--bg-panel); border: 1px solid var(--border-color);
          border-radius: 8px; padding: 16px; transition: all 0.2s ease;
        }
        .grid-card { cursor: pointer; display: flex; flex-direction: column; }
        .grid-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
        .grid-card[aria-expanded="true"] { border-color: #6366f1; box-shadow: 0 0 0 1px #6366f1; }

        .plan-desc-card { margin-bottom: 16px; }
        .plan-desc-card.flash-highlight { animation: flashHighlight 1.5s ease-out; }
        
        @keyframes flashHighlight {
          0% { border-color: #6366f1; box-shadow: 0 0 16px rgba(99,102,241,0.5); }
          100% { border-color: var(--border-color); box-shadow: none; }
        }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .card-num {
          background: #4f46e5; color: #ffffff; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; font-size: 13px; font-weight: 700;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .scheme-title { font-size: 16px; font-weight: 600; color: #f8fafc; }
        .rubezh-label { font-size: 12px; color: #a5b4fc; font-weight: 500; margin-top: 4px; display: block; }

        .mini-list { margin-top: auto; display: flex; flex-direction: column; gap: 8px; }
        .mini-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #cbd5e1; }

        .card-footer {
          margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color);
          font-size: 12px; color: #94a3b8; text-align: center;
        }

        .grid-arrow { display: flex; align-items: center; justify-content: center; color: var(--border-hover); }

        .grid-panel {
          overflow: hidden; max-height: 0; opacity: 0;
          transition: max-height 0.4s ease, opacity 0.4s ease, padding 0.4s ease, margin 0.4s ease;
          background: rgba(0,0,0,0.15); border-radius: 8px;
        }
        .grid-panel.open {
          max-height: 2500px; opacity: 1; padding: 24px; margin-bottom: 16px; border: 1px solid var(--border-color);
        }
        .plan-panel {
          overflow: hidden; max-height: 0; opacity: 0; transition: all 0.4s ease;
        }
        .plan-panel.open {
          max-height: 3000px; opacity: 1; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);
        }

        .panel-purpose { font-size: 15px; line-height: 1.5; margin-bottom: 24px; color: #e2e8f0; }

        .zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .zone-card {
          background: var(--bg-panel); border-radius: 6px; padding: 16px;
          border-left: 4px solid; display: flex; flex-direction: column; gap: 8px;
        }
        .zone-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .zone-name { font-weight: 600; font-size: 15px; color: #f8fafc; }
        .scheme-mono { font-family: 'Courier New', monospace; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #cbd5e1; }
        .zone-desc { font-size: 13px; color: #cbd5e1; line-height: 1.4; }
        .zone-ctrl { margin-top: auto; font-size: 12px; color: #9ca3af; background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 4px; border: 1px dashed var(--border-color); }

        .callout {
          margin-top: 24px; padding: 16px; border-radius: 6px; display: flex; gap: 12px; font-size: 14px; line-height: 1.5;
        }
        .callout.warn { background: rgba(207, 77, 120, 0.1); border: 1px solid rgba(207, 77, 120, 0.3); color: #fbcfe8; }
        .callout.ok { background: rgba(29, 158, 117, 0.1); border: 1px solid rgba(29, 158, 117, 0.3); color: #a7f3d0; }

        .req-list {
          padding-left: 20px; display: flex; flex-direction: column; gap: 8px; color: #e2e8f0; line-height: 1.5; font-size: 14px; margin: 0;
        }
        .req-list li::marker { color: #6366f1; }

        .plan-node { transition: transform 0.15s ease; cursor: pointer; }
        .plan-node:hover { transform: translateY(-2px); }
        .plan-node:hover > rect:first-child { filter: brightness(1.2); }

        .scheme-footer {
          margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border-color);
          font-size: 14px; color: #94a3b8; line-height: 1.6;
        }

        /* Logistics Section */
        .logistics-section { margin-top: 64px; border-top: 1px solid var(--border-color); padding-top: 48px; }
        .logistics-title { font-size: 20px; font-weight: 600; color: #f8fafc; margin-bottom: 8px; }
        .logistics-subtitle { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 32px; max-width: 900px; }
        
        .overview-chain {
          display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
          padding: 24px; background: rgba(0,0,0,0.2); border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05); margin-bottom: 32px;
        }
        .overview-node {
          padding: 8px 16px; background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color); border-radius: 6px;
          font-size: 14px; color: #f8fafc;
        }
        .overview-node.ramp {
          border-color: #ef4444; background: rgba(239,68,68,0.15);
          color: #fca5a5; font-weight: 600;
        }
        .overview-node.return {
          border-style: dashed; color: #cbd5e1;
        }
        .overview-arrow { color: #64748b; display: flex; align-items: center; justify-content: center; }

        .cargo-legend-bar {
          display: flex; align-items: center; gap: 16px; padding: 12px 20px;
          background: rgba(0,0,0,0.2); border: 1px solid var(--border-color);
          border-radius: 8px; flex-wrap: wrap; margin-bottom: 24px;
        }

        .logistics-accordion { display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }
        .log-card {
          background: var(--bg-panel); border: 1px solid var(--border-color);
          border-radius: 8px; transition: all 0.2s ease;
        }
        .log-card:hover { border-color: var(--border-hover); }
        .log-card[aria-expanded="true"] { border-color: #6366f1; box-shadow: 0 0 0 1px #6366f1; }
        .log-card-header {
          padding: 16px 20px; display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; background: rgba(255,255,255,0.02);
        }
        .log-card-header:hover { background: rgba(255,255,255,0.04); }
        .dir-badge {
          font-size: 11px; text-transform: uppercase; padding: 4px 8px;
          border-radius: 4px; font-weight: 600;
        }
        .dir-badge.входящая { background: rgba(16,185,129,0.15); color: #34d399; }
        .dir-badge.внутренняя { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .dir-badge.исходящая { background: rgba(249,115,22,0.15); color: #fb923c; }
        .dir-badge.обратная { background: rgba(139,92,246,0.15); color: #c084fc; }

        .log-card-body {
          overflow: hidden; max-height: 0; opacity: 0;
          transition: all 0.4s ease;
        }
        .log-card-body.open {
          max-height: 3000px; opacity: 1; padding: 0 20px 24px;
          border-top: 1px solid var(--border-color);
        }
        
        .flow-list { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
        .flow-item {
          display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.03);
          padding: 12px 16px; border-radius: 6px; flex-wrap: wrap;
        }
        .flow-cargo-badge {
          font-size: 12px; padding: 4px 10px; border-radius: 12px; font-weight: 600;
          flex-shrink: 0; min-width: 120px; text-align: center; color: #fff;
        }
        .fleet-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px; margin-top: 24px;
        }
        .fleet-card {
          background: rgba(0,0,0,0.2); border: 1px dashed var(--border-color);
          padding: 16px; border-radius: 6px;
        }
        .fleet-card-title { font-size: 12px; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
        .fleet-card-val { font-size: 14px; color: #e2e8f0; }

        @media (max-width: 900px) {
          .scheme-grid { display: flex; flex-direction: column; }
          .grid-arrow { transform: rotate(90deg); padding: 8px 0; }
          .grid-card { min-height: 120px; }
        }
        .radial-svg { display: block; overflow: visible; font-family: 'Inter', sans-serif; margin: 0 auto; }
        .radial-svg path.flow-line { fill: none; stroke-linecap: round; }
        .radial-svg text { fill: #f8fafc; font-size: 13px; font-weight: 500; text-anchor: middle; }
        .radial-svg text.sub { fill: #94a3b8; font-size: 11px; font-weight: 400; }
        .glow-shadow { filter: drop-shadow(0 0 16px rgba(99,102,241,0.25)); }
        
        .timeline-wrapper { position: relative; margin: 32px 0 24px; border-top: 1px solid var(--border-color); padding-top: 16px; font-family: 'JetBrains Mono', monospace; }
        .time-axis { display: flex; justify-content: space-between; color: #64748b; font-size: 12px; margin-bottom: 12px; padding-left: 150px; }
        .time-tick { position: relative; }
        .time-tick::before { content: ''; position: absolute; left: 50%; top: 16px; width: 1px; height: 160px; background: rgba(255,255,255,0.05); }
        .timeline-row { display: flex; height: 36px; margin-bottom: 8px; position: relative; align-items: center; }
        .timeline-label { width: 150px; font-size: 13px; color: #cbd5e1; font-weight: 500; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .timeline-track { flex: 1; position: relative; background: rgba(255,255,255,0.02); border-radius: 4px; height: 100%; border: 1px solid rgba(255,255,255,0.05); }
        .timeline-block { position: absolute; height: 100%; top: 0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .timeline-block:hover { transform: scaleY(1.15); box-shadow: 0 4px 12px rgba(0,0,0,0.4); z-index: 10; }
      `}</style>

      {/* Верхний бар */}
      <div className="scheme-header-bar">
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth={2}>
          <rect x={3} y={3} width={7} height={7} rx={1}/>
          <rect x={14} y={3} width={7} height={7} rx={1}/>
          <rect x={3} y={14} width={7} height={7} rx={1}/>
          <rect x={14} y={14} width={7} height={7} rx={1}/>
        </svg>
        <h1 className="scheme-header-title">Производственно-логистическая схема</h1>
      </div>

      {/* Легенда */}
      <div className="scheme-legend-bar">
        {LEGEND.map(({ cat, label }) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3,
              background: CLR[cat].bg, border: `2px solid ${CLR[cat].border}`,
            }}/>
            <span style={{ fontSize: 13, color: '#cbd5e1' }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="scheme-content">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
          <div className="scheme-tabs" style={{ marginBottom: 0 }}>
            <button className={`scheme-tab ${view === 'plan' ? 'active' : ''}`} onClick={() => handleViewChange('plan')}>План этажа</button>
            <button className={`scheme-tab ${view === 'flow' ? 'active' : ''}`} onClick={() => handleViewChange('flow')}>Схема потока</button>
            <button className={`scheme-tab ${view === 'logistics' ? 'active' : ''}`} onClick={() => handleViewChange('logistics')}>Логистика</button>
          </div>
        </div>

        {view === 'plan' && (
          <div className="plan-view">
            <div style={{ overflowX: 'auto', marginBottom: 32, paddingBottom: 16 }}>
              <svg viewBox="0 0 1100 640" width="1100" height="640" style={{ minWidth: 1000, display: 'block' }}>
                <defs>
                  <marker id="arr" markerWidth={8} markerHeight={8} refX={7} refY={3} orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.4)"/>
                  </marker>
                </defs>
                
                {/* Стрелки */}
                <g stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" markerEnd="url(#arr)">
                  {ARROWS.map((d, i) => <path key={i} d={d} />)}
                </g>
                
                {/* Узлы */}
                {NODES.map(node => {
                  const c = CLR[node.cat];
                  const small = node.h <= 100;
                  const cx = node.x + node.w / 2;
                  return (
                    <g key={node.id} className={node.blockId ? "plan-node" : ""} onClick={() => scrollToPlanBlock(node.blockId)}>
                      <rect
                        x={node.x} y={node.y} width={node.w} height={node.h}
                        rx={10} fill={c.bg} stroke={c.border} strokeWidth={2}
                        strokeDasharray={node.dashed ? '7,4' : undefined}
                      />
                      {!node.dashed && (
                        <rect x={node.x + 1} y={node.y + 1} width={node.w - 2} height={4}
                          rx={9} fill={c.border} opacity={0.55}/>
                      )}
                      <text
                        x={cx} y={node.y + (small ? 31 : 38)}
                        textAnchor="middle"
                        fontSize={small ? 13 : 14} fontWeight={600}
                        fill="rgba(255,255,255,0.95)"
                      >
                        {node.label}
                      </text>
                      <text
                        x={cx} y={node.y + (small ? 50 : 58)}
                        textAnchor="middle"
                        fontSize={12} fill="rgba(255,255,255,0.7)"
                      >
                        {node.sub}
                      </text>
                    </g>
                  );
                })}
                
                <text x={152} y={600} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.3)" fontStyle="italic">
                  — Вне основного потока —
                </text>
              </svg>
            </div>

            <div className="plan-descriptions">
              {BLOCKS.map(b => {
                const isExpanded = planExpanded.includes(b.id);
                return (
                  <div key={b.id} id={`plan-desc-${b.id}`} className="plan-desc-card">
                    <div className="card-header" onClick={() => togglePlanBlock(b.id)} style={{ cursor: 'pointer', marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="card-num">{b.num}</div>
                        <div>
                          <div className="scheme-title">{b.name}</div>
                          {b.rubezh && <div className="rubezh-label">{b.rubezh}</div>}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                    </div>
                    
                    <div className={`plan-panel ${isExpanded ? 'open' : ''}`}>
                      <div className="panel-purpose">{b.purpose}</div>
                      
                      <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>Состав зон</div>
                      <div className="zones-grid" style={{ marginBottom: 24 }}>
                        {b.zones.map((zone, i) => (
                          <div key={i} className="zone-card" style={{ borderLeftColor: zone.color, padding: 12 }}>
                            <div className="zone-header">
                              <div className="zone-name" style={{ fontSize: 14 }}>{zone.name}</div>
                              <div className="scheme-mono">{zone.temp}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 12 }}>Архитектурные и инженерные требования</div>
                      <ul className="req-list">
                        {b.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'flow' && (
          <>
            <div className="scheme-controls">
              <button className="scheme-btn" onClick={expandAllFlow}>Развернуть все</button>
              <button className="scheme-btn" onClick={collapseAllFlow}>Свернуть все</button>
            </div>

            <div className="scheme-grid">
              {BLOCKS.map((b, idx) => {
                const isExpanded = flowExpanded.includes(b.id);
                return (
                  <React.Fragment key={b.id}>
                    <div 
                      className="grid-card" 
                      style={{ gridColumn: idx * 2 + 1, gridRow: 1 }}
                      onClick={() => toggleFlowBlock(b.id)}
                      aria-expanded={isExpanded}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="card-header">
                        <div className="card-num">{b.num}</div>
                        {isExpanded ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                      </div>
                      <div>
                        <div className="scheme-title">{b.name}</div>
                        {b.rubezh && <div className="rubezh-label">{b.rubezh}</div>}
                      </div>
                      
                      <div className="mini-list" style={{ marginTop: '16px' }}>
                        {b.mini.map((m, i) => (
                          <div key={i} className="mini-item">
                            <div style={{ background: m.color, width: 10, height: 10, borderRadius: 2 }} />
                            {m.label}
                          </div>
                        ))}
                      </div>

                      <div className="card-footer">
                        Нажми, чтобы {isExpanded ? 'свернуть' : 'раскрыть'}
                      </div>
                    </div>

                    {idx < BLOCKS.length - 1 && (
                      <div className="grid-arrow" style={{ gridColumn: idx * 2 + 2, gridRow: 1 }}>
                        <ArrowRight size={24} />
                      </div>
                    )}

                    <div 
                      className={`grid-panel ${isExpanded ? 'open' : ''}`}
                      style={{ gridColumn: '1 / -1', gridRow: idx + 2 }}
                    >
                      <div className="panel-purpose">{b.purpose}</div>
                      
                      <div className="zones-grid">
                        {b.zones.map((zone, i) => (
                          <div key={i} className="zone-card" style={{ borderLeftColor: zone.color }}>
                            <div className="zone-header">
                              <div className="zone-name">{zone.name}</div>
                              <div className="scheme-mono">{zone.temp}</div>
                            </div>
                            <div className="zone-desc">{zone.desc}</div>
                            <div className="zone-ctrl">Контроль: {zone.ctrl}</div>
                          </div>
                        ))}
                      </div>

                      {b.callout && (
                        <div className={`callout ${b.callout.type}`}>
                          {b.callout.type === 'warn' ? <AlertTriangle size={24} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={24} style={{ flexShrink: 0 }} />}
                          <div>{b.callout.text}</div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        )}

        {/* НОВЫЙ РАЗДЕЛ: ЛОГИСТИЧЕСКАЯ СХЕМА */}
        {view === 'logistics' && (
        <div className="logistics-section">
          <div className="logistics-title">Логистическая схема: Радиальная карта и Тайминг рейсов</div>
          <div className="logistics-subtitle">
            Логистика = территория × время × тип груза. Комбинат раздаёт по трём рампам, потоки расходятся к точкам по типам, рейсы расписаны под пики смен. Толщина потока = объём, цвет = груз, пунктир = возврат тары/отходов.
          </div>

          {/* Легенда грузов */}
          <div className="cargo-legend-bar" style={{ marginBottom: 24, justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 600, marginRight: 8 }}>Легенда грузов:</span>
            {CARGO_LEGEND.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: c.color }}/>
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* ЧАСТЬ А: РАДИАЛЬНАЯ КАРТА */}
          <div className="grid-card glow-shadow" style={{ padding: 0, overflow: 'hidden', marginBottom: 32, background: 'var(--bg-dark)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#f8fafc' }}>А. Пространственная карта потоков (Сэнки-диаграмма)</div>
            </div>
            <div style={{ overflowX: 'auto', padding: '24px 0' }}>
              <svg className="radial-svg" viewBox="0 0 1100 640" width="1100" height="640">
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Линии потоков */}
                {RADIAL_FLOWS.map(f => (
                  <g key={f.id}>
                    <path 
                      className="flow-line" 
                      d={f.d} 
                      stroke={CARGO_COLORS[f.cargo] || '#fff'} 
                      strokeWidth={f.volume} 
                      strokeDasharray={f.dashed ? '8,6' : 'none'}
                      opacity={f.dashed ? 0.6 : 0.8}
                    />
                    {f.label && <text x={f.labelX} y={f.labelY} fill={CARGO_COLORS[f.cargo]}>{f.label}</text>}
                    
                    {f.anim && (
                      <circle r={f.volume / 1.5 + 1} fill="#ffffff" opacity="0.9">
                        <animateMotion dur={f.dashed ? "5s" : "3.5s"} repeatCount="indefinite" path={f.d} />
                      </circle>
                    )}
                  </g>
                ))}
                
                {/* Узлы */}
                {RADIAL_NODES.map(n => {
                  if (n.type === 'combine' || n.type === 'ramp') {
                    return (
                      <g key={n.id}>
                        <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.fill} stroke={n.stroke} strokeWidth={3} filter={n.type === 'combine' ? 'url(#glow)' : undefined} />
                        <text x={n.cx} y={n.cy - 4} fontWeight="600">{n.label}</text>
                        <text x={n.cx} y={n.cy + 12} className="sub">{n.sub}</text>
                      </g>
                    );
                  }
                  return (
                    <g key={n.id}>
                      <rect x={n.cx - n.w! / 2} y={n.cy - n.h! / 2} width={n.w} height={n.h} rx={8} fill="var(--bg-panel)" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
                      <text x={n.cx} y={n.cy - 2} fontWeight="600">{n.label}</text>
                      <text x={n.cx} y={n.cy + 14} className="sub">{n.sub}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* ЧАСТЬ Б: ВРЕМЕННАЯ ДИАГРАММА */}
          <div className="grid-card" style={{ padding: 24, marginBottom: 32 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#f8fafc', marginBottom: 8 }}>Б. Временная диаграмма рейсов (Развозка под смены)</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Горизонтальная шкала 00:00–24:00 показывает точную привязку рейсов к пиковым нагрузкам получателей.</div>
            
            <div className="timeline-wrapper">
              <div className="time-axis">
                {[0, 4, 8, 12, 16, 20, 24].map(h => (
                  <div key={h} className="time-tick">{String(h).padStart(2, '0')}:00</div>
                ))}
              </div>
              
              {TIMELINE_TRACKS.map((trackName, idx) => {
                const trackTrips = TIMELINE_TRIPS.filter(t => t.track === idx);
                return (
                  <div key={idx} className="timeline-row">
                    <div className="timeline-label">{trackName}</div>
                    <div className="timeline-track">
                      {trackTrips.map((tr, i) => {
                        const left = (tr.time / 24) * 100;
                        const width = (tr.duration / 24) * 100;
                        const color = CARGO_COLORS[tr.cargo] || '#64748b';
                        return (
                          <div key={i} className="timeline-block" style={{ left: `${left}%`, width: `${width}%`, background: color }} title={`${tr.label} (${tr.shift})`}>
                            {tr.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ЧАСТЬ В: 4 Контуры */}
          <div className="logistics-accordion">
            {LOGISTICS.map((log, idx) => {
              const isExpanded = logExpanded.includes(log.id);
              return (
                <div key={log.id} className="log-card" aria-expanded={isExpanded}>
                  <div className="log-card-header" onClick={() => toggleLogBlock(log.id)}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <div className="scheme-title">Контур {idx + 1}: {log.name}</div>
                        <div className={`dir-badge ${log.direction}`}>{log.direction}</div>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{log.subtitle}</div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} color="#9ca3af" /> : <ChevronDown size={20} color="#9ca3af" />}
                  </div>

                  <div className={`log-card-body ${isExpanded ? 'open' : ''}`}>
                    <div style={{ paddingTop: 20 }}>
                      <div className="panel-purpose" style={{ margin: 0 }}>{log.note}</div>
                      
                      {log.id === 'l3' && (
                        <div className="fleet-grid">
                          <div className="fleet-card">
                            <div className="fleet-card-title">Автопарк</div>
                            <div className="fleet-card-val">{FLEET_PLACEHOLDER.vehicles}</div>
                          </div>
                          <div className="fleet-card">
                            <div className="fleet-card-title">Получатели</div>
                            <div className="fleet-card-val">{FLEET_PLACEHOLDER.destinations}</div>
                          </div>
                          <div className="fleet-card" style={{ gridColumn: '1 / -1' }}>
                            <div className="fleet-card-title">Примерный график смен</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              {FLEET_PLACEHOLDER.schedule.map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                                  <span style={{ color: '#60a5fa', fontWeight: 500, minWidth: 160 }}>{s.shift}</span>
                                  <span style={{ color: '#cbd5e1' }}>{s.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flow-list">
                        <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>Потоки движения</div>
                        {log.flows.map((flow, i) => (
                          <div key={i} className="flow-item">
                            <div className="flow-cargo-badge" style={{ background: CARGO_COLORS[flow.cargo] }}>
                              {CARGO_LEGEND.find(c => c.id === flow.cargo)?.label || flow.cargo}
                            </div>
                            <div className="flow-text" style={{ flex: 1 }}>
                              <span className="flow-node">{flow.from}</span>
                              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                                {flow.dashed ? <span style={{letterSpacing: 2}}>----&gt;</span> : <ArrowRight size={16}/>}
                              </span>
                              <span className="flow-node">{flow.to}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                              {flow.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div className="scheme-footer">
          <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 12 }}>Сквозные принципы</div>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Поток строго в одну сторону, грязное не пересекается с чистым.</li>
            <li>Три контрольных рубежа: вход (1), развес (2), выход из производства (3).</li>
            <li>Три разнесённые рампы: Р1 сырьё, Р2 готовое, Р3 мусор — не совмещать.</li>
            <li>Несущее (закладывать сразу под удвоение объёма): площадь и поточность, инженерия (электрика/вода/канализация/жироуловитель/вентиляция под 2×), три рампы, отдельная зона развеса, дробление холода (мясо ≠ молочка ≠ кефир ≠ готовое).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
