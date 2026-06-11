import { confirmDialog } from '../../lib/confirm';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './BpmnApp.css';

import lintModule from 'bpmn-js-bpmnlint';
// @ts-ignore
import * as bpmnlintConfig from '../../bpmnlint';
import minimapModule from 'diagram-js-minimap';
import tokenSimulationModule from 'bpmn-js-token-simulation';

import 'bpmn-js-bpmnlint/dist/assets/css/bpmn-js-bpmnlint.css';
import 'diagram-js-minimap/assets/diagram-js-minimap.css';
import 'bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css';

import { useStore } from '../../store';
import {
  ArrowLeft, Download, Upload, ZoomIn, ZoomOut, Maximize2,
  RotateCcw, RotateCw, Save, FileText, Trash2, Rat,
  ChevronRight, Plus, Grid3X3, Layers, X, Code2,
  Copy, AlertCircle, CheckCircle2, Image, Moon, Sun, Play, Sparkles, Bot
} from 'lucide-react';
import { AiProcessPanel } from '../../features/ai-process/components/AiProcessPanel';
import { io, Socket } from 'socket.io-client';

// ─── BPMN Templates ──────────────────────────────────────────────────────────

const TEMPLATES: { id: string; name: string; desc: string; emoji: string; xml: string }[] = [
  {
    id: 'empty', name: 'Пустая', emoji: '📄', desc: 'Чистый холст',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
  },
  {
    id: 'simple', name: 'Базовый процесс', emoji: '▶️', desc: 'Начало → Задача → Конец',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start" name="Начало"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="Task1" name="Выполнить задачу"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End" name="Конец"><bpmn:incoming>F2</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="Task1"/>
    <bpmn:sequenceFlow id="F2" sourceRef="Task1" targetRef="End"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="D1"><bpmndi:BPMNPlane id="P1" bpmnElement="Process_1">
    <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="152" y="172" width="36" height="36"/><bpmndi:BPMNLabel><dc:Bounds x="145" y="215" width="50" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="Task1_di" bpmnElement="Task1"><dc:Bounds x="240" y="150" width="130" height="80"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_di" bpmnElement="End"><dc:Bounds x="422" y="172" width="36" height="36"/><bpmndi:BPMNLabel><dc:Bounds x="418" y="215" width="44" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1"><di:waypoint x="188" y="190"/><di:waypoint x="240" y="190"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2"><di:waypoint x="370" y="190"/><di:waypoint x="422" y="190"/></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`
  },
  {
    id: 'approval', name: 'Согласование', emoji: '✅', desc: 'Заявка с ветвлением',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start" name="Заявка подана"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="T1" name="Проверка заявки"><bpmn:incoming>F1</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="GW1" name="Одобрено?"><bpmn:incoming>F2</bpmn:incoming><bpmn:outgoing>F3</bpmn:outgoing><bpmn:outgoing>F4</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:task id="T2" name="Выполнить запрос"><bpmn:incoming>F3</bpmn:incoming><bpmn:outgoing>F5</bpmn:outgoing></bpmn:task>
    <bpmn:task id="T3" name="Отклонить заявку"><bpmn:incoming>F4</bpmn:incoming><bpmn:outgoing>F6</bpmn:outgoing></bpmn:task>
    <bpmn:endEvent id="End1" name="Выполнено"><bpmn:incoming>F5</bpmn:incoming></bpmn:endEvent>
    <bpmn:endEvent id="End2" name="Отклонено"><bpmn:incoming>F6</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="T1"/>
    <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="GW1"/>
    <bpmn:sequenceFlow id="F3" name="Да" sourceRef="GW1" targetRef="T2"/>
    <bpmn:sequenceFlow id="F4" name="Нет" sourceRef="GW1" targetRef="T3"/>
    <bpmn:sequenceFlow id="F5" sourceRef="T2" targetRef="End1"/>
    <bpmn:sequenceFlow id="F6" sourceRef="T3" targetRef="End2"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="D1"><bpmndi:BPMNPlane id="P1" bpmnElement="Process_1">
    <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="132" y="192" width="36" height="36"/><bpmndi:BPMNLabel><dc:Bounds x="108" y="235" width="84" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="T1_di" bpmnElement="T1"><dc:Bounds x="220" y="170" width="130" height="80"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="GW1_di" bpmnElement="GW1" isMarkerVisible="true"><dc:Bounds x="405" y="185" width="50" height="50"/><bpmndi:BPMNLabel><dc:Bounds x="393" y="242" width="74" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="T2_di" bpmnElement="T2"><dc:Bounds x="510" y="100" width="130" height="80"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="T3_di" bpmnElement="T3"><dc:Bounds x="510" y="250" width="130" height="80"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End1_di" bpmnElement="End1"><dc:Bounds x="700" y="122" width="36" height="36"/><bpmndi:BPMNLabel><dc:Bounds x="690" y="165" width="56" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End2_di" bpmnElement="End2"><dc:Bounds x="700" y="272" width="36" height="36"/><bpmndi:BPMNLabel><dc:Bounds x="688" y="315" width="60" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1"><di:waypoint x="168" y="210"/><di:waypoint x="220" y="210"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2"><di:waypoint x="350" y="210"/><di:waypoint x="405" y="210"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F3_di" bpmnElement="F3"><di:waypoint x="430" y="185"/><di:waypoint x="430" y="140"/><di:waypoint x="510" y="140"/><bpmndi:BPMNLabel><dc:Bounds x="436" y="155" width="16" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F4_di" bpmnElement="F4"><di:waypoint x="430" y="235"/><di:waypoint x="430" y="290"/><di:waypoint x="510" y="290"/><bpmndi:BPMNLabel><dc:Bounds x="436" y="258" width="21" height="14"/></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F5_di" bpmnElement="F5"><di:waypoint x="640" y="140"/><di:waypoint x="700" y="140"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F6_di" bpmnElement="F6"><di:waypoint x="640" y="290"/><di:waypoint x="700" y="290"/></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`
  },
  {
    id: 'loop', name: 'Цикл обработки', emoji: '🔄', desc: 'Повторная обработка при ошибке',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start" name="Старт"><bpmn:outgoing>F1</bpmn:outgoing></bpmn:startEvent>
    <bpmn:task id="T1" name="Обработать данные"><bpmn:incoming>F1</bpmn:incoming><bpmn:incoming>F4</bpmn:incoming><bpmn:outgoing>F2</bpmn:outgoing></bpmn:task>
    <bpmn:exclusiveGateway id="GW1" name="Успешно?"><bpmn:incoming>F2</bpmn:incoming><bpmn:outgoing>F3</bpmn:outgoing><bpmn:outgoing>F4</bpmn:outgoing></bpmn:exclusiveGateway>
    <bpmn:endEvent id="End" name="Готово"><bpmn:incoming>F3</bpmn:incoming></bpmn:endEvent>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="T1"/>
    <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="GW1"/>
    <bpmn:sequenceFlow id="F3" name="Да" sourceRef="GW1" targetRef="End"/>
    <bpmn:sequenceFlow id="F4" name="Нет, повтор" sourceRef="GW1" targetRef="T1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="D1"><bpmndi:BPMNPlane id="P1" bpmnElement="Process_1">
    <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="132" y="182" width="36" height="36"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="T1_di" bpmnElement="T1"><dc:Bounds x="220" y="160" width="140" height="80"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="GW1_di" bpmnElement="GW1" isMarkerVisible="true"><dc:Bounds x="415" y="175" width="50" height="50"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_di" bpmnElement="End"><dc:Bounds x="532" y="182" width="36" height="36"/></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1"><di:waypoint x="168" y="200"/><di:waypoint x="220" y="200"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2"><di:waypoint x="360" y="200"/><di:waypoint x="415" y="200"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F3_di" bpmnElement="F3"><di:waypoint x="465" y="200"/><di:waypoint x="532" y="200"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="F4_di" bpmnElement="F4"><di:waypoint x="440" y="225"/><di:waypoint x="440" y="300"/><di:waypoint x="290" y="300"/><di:waypoint x="290" y="240"/></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`
  },
];

// ─── LocalStorage helpers (Removed) ─────────────────────────────────────────────────────
interface SavedDiagram { id: string; name: string; xml: string; updatedAt: string; }

// Removed localStorage sync functions. Backend will be used instead.

// ─── Sidebar tabs ─────────────────────────────────────────────────────────────
type SideTab = 'diagrams' | 'templates' | 'properties' | 'aichats';

interface SelectedElement {
  id: string;
  type: string;
  name?: string;
  documentation?: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const BpmnApp: React.FC = () => {
  const setActiveApp = useStore(state => state.setActiveApp);
      const theme = useStore(state => state.theme);
      const toggleTheme = useStore(state => state.toggleTheme);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<InstanceType<typeof BpmnModeler> | null>(null);

  const [diagrams, setDiagrams] = useState<SavedDiagram[]>([]);
  const [aiChats, setAiChats] = useState<any[]>([]);
  
  // ── Helper to automatically inject Auth token
  const bpmnFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');
    
    const res = await fetch(url, { ...options, headers, credentials: 'include' });
    if (res.status === 401) {
      localStorage.removeItem('has_session');
      window.location.href = '/';
      await new Promise(() => {}); // Pause execution forever
    }
    return res;
  };

  // Fetch initial data from backend
  useEffect(() => {
    bpmnFetch('/api/bpmn/diagrams').then(r => r.ok ? r.json() : Promise.reject(r)).then(data => {
      if (Array.isArray(data)) setDiagrams(data);
    }).catch(console.error);

    bpmnFetch('/api/bpmn/chats').then(r => r.ok ? r.json() : Promise.reject(r)).then(data => {
      if (Array.isArray(data)) setAiChats(data);
    }).catch(console.error);
  }, []);

  const [activeAiChatId, setActiveAiChatId] = useState<string | null>(null);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  const [diagramName, setDiagramName] = useState('Новая диаграмма');
  const [zoom, setZoom] = useState(100);
  const [showXml, setShowXml] = useState(false);
  const [xmlContent, setXmlContent] = useState('');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sideTab, setSideTab] = useState<SideTab>('diagrams');
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [propName, setPropName] = useState('');
  const [propDoc, setPropDoc] = useState('');
  const [elementCount, setElementCount] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Multiplayer State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomUsers, setRoomUsers] = useState<Record<string, any>>({});
  const lastMoveRef = useRef(0);
  const skipNextSyncRef = useRef(false);

  // ── Notify
  const notify = useCallback((msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 2800);
  }, []);

  // ── Count elements
  const refreshElementCount = useCallback(() => {
    const elReg = modelerRef.current?.get<any>('elementRegistry');
    if (!elReg) return;
    const all = elReg.getAll();
    const count = all.filter((e: any) => e.type !== 'label' && e.type !== 'bpmn:Process').length;
    setElementCount(count);
  }, []);

  // ── Init modeler
  useEffect(() => {
    if (!containerRef.current) return;

    const modeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [
        lintModule,
        minimapModule,
        tokenSimulationModule
      ],
      linting: {
        bpmnlint: bpmnlintConfig,
        active: true
      }
    });
    modelerRef.current = modeler;

    let isMounted = true;

    modeler.importXML(TEMPLATES[1].xml).then(() => {
      if (!isMounted) return;
      const canvas = modeler.get<any>('canvas');
      canvas.zoom('fit-viewport', 'auto');
      setZoom(Math.round(canvas.zoom() * 100));
      refreshElementCount();
    }).catch((err) => {
      // Ignore errors if component unmounted (Strict Mode)
      if (isMounted) console.error('BPMN Import Error:', err);
    });

    // Track zoom
    const eventBus = modeler.get<any>('eventBus');
    eventBus.on('canvas.viewbox.changed', () => {
      const canvas = modeler.get<any>('canvas');
      setZoom(Math.round(canvas.zoom() * 100));
    });

    // Track changes
    eventBus.on('commandStack.changed', () => {
      setIsDirty(true);
      refreshElementCount();
      
      // Auto-save trigger mechanism - set a flag on window
      if ((window as any)._bpmnAutoSaveTimeout) {
        clearTimeout((window as any)._bpmnAutoSaveTimeout);
      }
      (window as any)._bpmnAutoSaveTimeout = setTimeout(() => {
        // We'll trigger a custom event that handleSave listens to
        window.dispatchEvent(new CustomEvent('bpmn-auto-save'));
      }, 2000);

      // Sync Trigger
      if (skipNextSyncRef.current) {
        skipNextSyncRef.current = false;
        return;
      }
      if (modeler.saveXML) {
        modeler.saveXML({ format: true }).then(({ xml }) => {
          if (xml) window.dispatchEvent(new CustomEvent('bpmn-sync-xml', { detail: xml }));
        }).catch(() => {});
      }
    });

    // Track selection
    eventBus.on('selection.changed', ({ newSelection }: any) => {
      if (!newSelection || newSelection.length === 0) {
        setSelected(null);
        return;
      }
      const el = newSelection[0];
      const bo = el.businessObject;
      const name = bo?.name || '';
      const doc = bo?.documentation?.[0]?.text || '';
      setSelected({ id: el.id, type: el.type, name, documentation: doc });
      setPropName(name);
      setPropDoc(doc);
      setSideTab('properties');
    });

    return () => {
      isMounted = false;
      // In React Strict Mode, unmounting happens synchronously while importXML is running.
      // We delay destroy() slightly so internal bpmn-js microtasks don't crash on a destroyed canvas.
      setTimeout(() => {
        modeler.destroy();
      }, 50);
    };
  }, [refreshElementCount]);

  // ── Translate external tooltips (Minimap, Token Simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      const minimapToggle = document.querySelector('.djs-minimap .toggle');
      if (minimapToggle) {
        if (minimapToggle.getAttribute('title') === 'Open minimap') minimapToggle.setAttribute('title', 'Открыть мини-карту');
        if (minimapToggle.getAttribute('title') === 'Close minimap') minimapToggle.setAttribute('title', 'Закрыть мини-карту');
      }
      
      const btsToggle = document.querySelector('.bts-toggle-mode');
      if (btsToggle && btsToggle.getAttribute('title')?.includes('Token Simulation')) {
        btsToggle.setAttribute('title', 'Режим симуляции');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Zoom helpers
  const handleZoomIn = () => {
    const c = modelerRef.current?.get<any>('canvas');
    if (c) c.zoom(c.zoom() + 0.1);
  };
  const handleZoomOut = () => {
    const c = modelerRef.current?.get<any>('canvas');
    if (c) c.zoom(Math.max(0.1, c.zoom() - 0.1));
  };
  const handleFit = () => {
    const c = modelerRef.current?.get<any>('canvas');
    if (c) c.zoom('fit-viewport', 'auto');
  };

  // ── Undo / Redo
  const handleUndo = () => {
    const s = modelerRef.current?.get<any>('commandStack');
    if (s?.canUndo()) s.undo();
  };
  const handleRedo = () => {
    const s = modelerRef.current?.get<any>('commandStack');
    if (s?.canRedo()) s.redo();
  };

  // ── Save
  const handleSave = useCallback(async () => {
    if (!modelerRef.current) return;
    const { xml } = await modelerRef.current.saveXML({ format: true });
    if (!xml) return;
    
    if (activeDiagramId && !activeDiagramId.startsWith('d_')) {
      // Update existing
      try {
        const res = await bpmnFetch(`/api/bpmn/diagrams/${activeDiagramId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: diagramName, xml })
        });
        if (res.ok) {
          const updated = await res.json();
          setDiagrams(prev => prev.map(d => d.id === activeDiagramId ? updated : d));
        }
      } catch (e) {
        console.error(e);
        notify('Ошибка сохранения', 'error');
        return;
      }
    } else {
      // Create new
      try {
        const res = await bpmnFetch('/api/bpmn/diagrams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: diagramName, xml })
        });
        if (res.ok) {
          const created = await res.json();
          setDiagrams(prev => [created, ...prev]);
          setActiveDiagramId(created.id);
        }
      } catch (e) {
        console.error(e);
        notify('Ошибка сохранения', 'error');
        return;
      }
    }
    
    setIsDirty(false);
    notify('Диаграмма сохранена ✓');
  }, [activeDiagramId, diagramName, notify]);

  // ── Multiplayer Logic
  useEffect(() => {
    // Current host, since this runs in the workspace
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('users-update', (users) => setRoomUsers(users));
    newSocket.on('cursor-moved', ({ id, x, y }) => {
      setRoomUsers(prev => ({ ...prev, [id]: { ...prev[id], x, y } }));
    });
    newSocket.on('diagram-updated', ({ xml, senderId }) => {
      if (modelerRef.current && senderId !== newSocket.id) {
        skipNextSyncRef.current = true;
        modelerRef.current.importXML(xml).then(() => refreshElementCount()).catch(console.error);
      }
    });

    return () => { newSocket.close(); };
  }, [refreshElementCount]);

  useEffect(() => {
    if (socket) {
      const roomId = activeDiagramId || 'new-diagram';
      socket.emit('join-diagram', { roomId });
    }
  }, [socket, activeDiagramId]);

  // ── Keyboard shortcut Ctrl+S & Auto-save listener
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    const autoSaveHandler = () => handleSave();
    const syncHandler = (e: any) => {
      if (socket) socket.emit('diagram-update', { xml: e.detail });
    };
    
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('bpmn-auto-save', autoSaveHandler);
    window.addEventListener('bpmn-sync-xml', syncHandler);
    
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('bpmn-auto-save', autoSaveHandler);
      window.removeEventListener('bpmn-sync-xml', syncHandler);
    };
  }, [handleSave]);

  // ── Load saved
  const handleLoad = async (d: SavedDiagram) => {
    if (!modelerRef.current) return;
    await modelerRef.current.importXML(d.xml);
    modelerRef.current.get<any>('canvas').zoom('fit-viewport', 'auto');
    setActiveDiagramId(d.id);
    setDiagramName(d.name);
    setIsDirty(false);
    setSelected(null);
    refreshElementCount();
    notify(`Открыта: ${d.name}`);
  };

  // ── Load template
  const handleTemplate = async (t: (typeof TEMPLATES)[0]) => {
    if (!modelerRef.current) return;
    await modelerRef.current.importXML(t.xml);
    modelerRef.current.get<any>('canvas').zoom('fit-viewport', 'auto');
    setActiveDiagramId(null);
    setDiagramName(t.name);
    setIsDirty(true);
    setSelected(null);
    refreshElementCount();
    setSideTab('diagrams');
    notify(`Шаблон загружен: ${t.name}`);
  };

  // ── New
  const handleNew = async () => {
    if (!modelerRef.current) return;
    await modelerRef.current.importXML(TEMPLATES[0].xml);
    modelerRef.current.get<any>('canvas').zoom('fit-viewport', 'auto');
    setActiveDiagramId(null);
    setDiagramName('Новая диаграмма');
    setIsDirty(false);
    setSelected(null);
    refreshElementCount();
    notify('Новая диаграмма создана');
  };

  // ── Delete
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await confirmDialog({ message: 'Удалить диаграмму?', danger: true }))) return;
    try {
      await bpmnFetch(`/api/bpmn/diagrams/${id}`, { method: 'DELETE' });
      setDiagrams(prev => prev.filter(d => d.id !== id));
      if (activeDiagramId === id) { setActiveDiagramId(null); setDiagramName('Новая диаграмма'); }
      notify('Диаграмма удалена');
    } catch (err) {
      console.error(err);
      notify('Ошибка при удалении', 'error');
    }
  };

  // ── Duplicate
  const handleDuplicate = async () => {
    if (!modelerRef.current) return;
    const { xml } = await modelerRef.current.saveXML({ format: true });
    if (!xml) return;
    try {
      const res = await bpmnFetch('/api/bpmn/diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${diagramName} (копия)`, xml })
      });
      if (res.ok) {
        const created = await res.json();
        setDiagrams(prev => [created, ...prev]);
        notify('Диаграмма дублирована');
      }
    } catch (err) {
      notify('Ошибка при дублировании', 'error');
    }
  };

  // ── Export XML view
  const handleExportXml = async () => {
    if (!modelerRef.current) return;
    const { xml } = await modelerRef.current.saveXML({ format: true });
    setXmlContent(xml || '');
    setShowXml(true);
  };

  // ── Download BPMN
  const handleDownload = async () => {
    if (!modelerRef.current) return;
    const { xml } = await modelerRef.current.saveXML({ format: true });
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${diagramName}.bpmn`; a.click();
    URL.revokeObjectURL(url);
    notify('Файл .bpmn скачан');
  };

  // ── Export SVG
  const handleExportSvg = async () => {
    if (!modelerRef.current) return;
    try {
      const { svg } = await (modelerRef.current as any).saveSVG();
      if (!svg) return;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${diagramName}.svg`; a.click();
      URL.revokeObjectURL(url);
      notify('SVG экспортирован');
    } catch {
      notify('Ошибка экспорта SVG', 'error');
    }
  };

  // ── Upload
  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.bpmn,.xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !modelerRef.current) return;
      try {
        const text = await file.text();
        await modelerRef.current.importXML(text);
        modelerRef.current.get<any>('canvas').zoom('fit-viewport', 'auto');
        setDiagramName(file.name.replace(/\.(bpmn|xml)$/, ''));
        setActiveDiagramId(null);
        setIsDirty(true);
        refreshElementCount();
        notify(`Загружен: ${file.name}`);
      } catch {
        notify('Ошибка загрузки файла', 'error');
      }
    };
    input.click();
  };

  // ── Apply property changes
  const handleApplyProps = () => {
    if (!modelerRef.current || !selected) return;
    const modeling = modelerRef.current.get<any>('modeling');
    const elReg = modelerRef.current.get<any>('elementRegistry');
    const el = elReg.get(selected.id);
    if (!el) return;
    modeling.updateLabel(el, propName);
    setSelected(s => s ? { ...s, name: propName, documentation: propDoc } : s);
    notify('Свойства обновлены ✓');
  };

  // ── Mouse Move for Cursors
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!socket || !containerRef.current) return;
    const now = Date.now();
    if (now - lastMoveRef.current < 40) return; // ~25fps reporting
    lastMoveRef.current = now;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    socket.emit('cursor-move', { x, y });
  };

  // ── Colorize Element
  const handleColorize = (fill: string, stroke: string) => {
    if (!modelerRef.current || !selected) return;
    const modeling = modelerRef.current.get<any>('modeling');
    const elReg = modelerRef.current.get<any>('elementRegistry');
    const el = elReg.get(selected.id);
    if (!el) return;
    modeling.setColor([el], { fill, stroke });
    setIsDirty(true);
  };

  // ── Delete Element
  const handleDeleteElement = () => {
    if (!modelerRef.current || !selected) return;
    const modeling = modelerRef.current.get<any>('modeling');
    const elReg = modelerRef.current.get<any>('elementRegistry');
    const el = elReg.get(selected.id);
    if (!el) return;
    modeling.removeElements([el]);
    setSelected(null);
    notify('Элемент удалён на холсте');
  };

  // ── Toggle grid
  const toggleGrid = () => {
    setShowGrid(g => !g);
  };

  // ── Friendly type label
  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      'bpmn:StartEvent': 'Начальное событие',
      'bpmn:EndEvent': 'Конечное событие',
      'bpmn:Task': 'Задача',
      'bpmn:UserTask': 'Пользовательская задача',
      'bpmn:ServiceTask': 'Сервисная задача',
      'bpmn:ScriptTask': 'Скриптовая задача',
      'bpmn:ExclusiveGateway': 'Эксклюзивный шлюз (XOR)',
      'bpmn:ParallelGateway': 'Параллельный шлюз (AND)',
      'bpmn:InclusiveGateway': 'Инклюзивный шлюз (OR)',
      'bpmn:SequenceFlow': 'Поток управления',
      'bpmn:SubProcess': 'Подпроцесс',
      'bpmn:Lane': 'Дорожка',
      'bpmn:Participant': 'Пул',
      'bpmn:IntermediateCatchEvent': 'Промежуточное событие',
    };
    return map[t] || t.replace('bpmn:', '');
  };

  return (
    <div className="bpmn-app">
      {/* ── Top Bar ── */}
      <div className="bpmn-topbar">
        <div className="bpmn-topbar-left">
          <button className="bpmn-back-btn" onClick={() => setActiveApp('desktop')} title="На рабочий стол (Ctrl+M)">
            <ArrowLeft size={16} />
          </button>
          <div className="bpmn-brand">
            <Rat size={18} color="#a78bfa" />
            <span>BPMN<b>Studio</b></span>
          </div>
          <div className="bpmn-name-input-wrap">
            <input
              className={`bpmn-name-input ${isDirty ? 'dirty' : ''}`}
              value={diagramName}
              onChange={e => setDiagramName(e.target.value)}
              placeholder="Название диаграммы"
            />
            {isDirty && <span className="bpmn-dirty-dot" title="Несохранённые изменения" />}
          </div>
          <button className="bpmn-btn-new" onClick={handleNew} style={{ marginLeft: 8 }}>
            <Plus size={13} /> Новая
          </button>
        </div>

        <div className="bpmn-topbar-center">
          <button className="bpmn-tb-btn" onClick={handleUndo} title="Отменить (Ctrl+Z)">
            <RotateCcw size={14} />
          </button>
          <button className="bpmn-tb-btn" onClick={handleRedo} title="Повторить (Ctrl+Y)">
            <RotateCw size={14} />
          </button>
          <div className="bpmn-divider-v" />
          <button className="bpmn-tb-btn" onClick={() => {
            const tm = modelerRef.current?.get<any>('toggleMode');
            if (tm) tm.toggleMode();
          }} title="Режим симуляции">
            <Play size={14} />
          </button>
          <div className="bpmn-divider-v" />
          <button 
            className={`bpmn-tb-btn ${showAiPanel ? 'active' : ''}`} 
            onClick={() => setShowAiPanel(!showAiPanel)} 
            title="AI-помощник"
            style={{ color: showAiPanel ? '#a855f7' : '' }}
          >
            <Sparkles size={14} />
          </button>
          <div className="bpmn-divider-v" />
          <button className="bpmn-tb-btn" onClick={handleZoomOut} title="Уменьшить (-)">
            <ZoomOut size={14} />
          </button>
          <button
            className="bpmn-zoom-label-btn"
            onClick={handleFit}
            title="По размеру окна"
          >{zoom}%</button>
          <button className="bpmn-tb-btn" onClick={handleZoomIn} title="Увеличить (+)">
            <ZoomIn size={14} />
          </button>
          <button className="bpmn-tb-btn" onClick={handleFit} title="Вписать в экран">
            <Maximize2 size={14} />
          </button>
          <div className="bpmn-divider-v" />
          <button
            className={`bpmn-tb-btn ${showGrid ? 'active' : ''}`}
            onClick={toggleGrid}
            title="Сетка"
          >
            <Grid3X3 size={14} />
          </button>
          <div className="bpmn-divider-v" />
          <button className="bpmn-tb-btn" onClick={handleExportXml} title="Просмотр XML">
            <Code2 size={14} />
          </button>
          <button className="bpmn-tb-btn" onClick={handleExportSvg} title="Экспорт SVG">
            <Image size={14} />
          </button>
          <button className="bpmn-tb-btn" onClick={handleDownload} title="Скачать .bpmn">
            <Download size={14} />
          </button>
          <button className="bpmn-tb-btn" onClick={handleUpload} title="Загрузить файл">
            <Upload size={14} />
          </button>
        </div>

        <div className="bpmn-topbar-right">
          <button className="bpmn-tb-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="bpmn-divider-v" />
          <button className="bpmn-tb-btn" onClick={handleDuplicate} title="Дублировать">
            <Copy size={14} />
          </button>
          <button className="bpmn-btn-save" onClick={handleSave}>
            <Save size={13} /> Сохранить
          </button>
        </div>
      </div>

      <div className="bpmn-body">
        {/* ── Left Sidebar ── */}
        <div className={`bpmn-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          {/* Tab bar */}
          {sidebarOpen && (
            <div className="bpmn-sidebar-tabs">
              <button
                className={`bpmn-stab ${sideTab === 'diagrams' ? 'active' : ''}`}
                onClick={() => setSideTab('diagrams')}
                title="Мои диаграммы"
              >
                <Layers size={13} />
                <span>Файлы</span>
              </button>
              <button
                className={`bpmn-stab ${sideTab === 'templates' ? 'active' : ''}`}
                onClick={() => setSideTab('templates')}
                title="Шаблоны"
              >
                <FileText size={13} />
                <span>Шаблоны</span>
              </button>
              <button
                className={`bpmn-stab ${sideTab === 'aichats' ? 'active' : ''}`}
                onClick={() => setSideTab('aichats')}
                title="AI Чаты"
              >
                <Sparkles size={13} />
                <span>AI Чаты</span>
              </button>

            </div>
          )}

          <div className="bpmn-sidebar-header">
            {sidebarOpen && (
              <span>
                {sideTab === 'diagrams' && 'МОИ ДИАГРАММЫ'}
                {sideTab === 'templates' && 'ШАБЛОНЫ'}
                {sideTab === 'aichats' && 'ИСТОРИЯ AI'}
              </span>
            )}
            <button className="bpmn-sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
              <ChevronRight size={14} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>

          {sidebarOpen && (
            <div className="bpmn-sidebar-content">

              {/* ── DIAGRAMS TAB ── */}
              {sideTab === 'diagrams' && (
                <>
                  {diagrams.length === 0 ? (
                    <div className="bpmn-empty-state">
                      <Layers size={28} strokeWidth={1.2} color="var(--text-muted)" />
                      <p>Нет сохранённых<br />диаграмм</p>
                      <span>Нажмите «Сохранить»</span>
                    </div>
                  ) : (
                    diagrams.map(d => (
                      <div
                        key={d.id}
                        className={`bpmn-diagram-item ${activeDiagramId === d.id ? 'active' : ''}`}
                        onClick={() => handleLoad(d)}
                      >
                        <div className="bpmn-diagram-icon">
                          <Rat size={12} />
                        </div>
                        <div className="bpmn-diagram-info">
                          <span className="bpmn-diagram-name">{d.name}</span>
                          <span className="bpmn-diagram-date">
                            {new Date(d.updatedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <button
                          className="bpmn-delete-btn"
                          onClick={(e) => handleDelete(d.id, e)}
                          title="Удалить"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* ── TEMPLATES TAB ── */}
              {sideTab === 'templates' && (
                <div className="bpmn-template-list">
                  {TEMPLATES.map(t => (
                    <div
                      key={t.id}
                      className="bpmn-template-card"
                      onClick={() => handleTemplate(t)}
                    >
                      <span className="bpmn-template-emoji">{t.emoji}</span>
                      <div>
                        <div className="bpmn-template-name">{t.name}</div>
                        <div className="bpmn-template-desc">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AI CHATS TAB ── */}
              {sideTab === 'aichats' && (
                <>
                  <button 
                    onClick={() => {
                      setActiveAiChatId(null);
                      setShowAiPanel(true);
                    }}
                    style={{ width: 'calc(100% - 32px)', margin: '16px', padding: '10px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#7e22ce'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-primary)'}
                  >
                    <Plus size={16} /> Новый чат
                  </button>
                  {aiChats.length === 0 ? (
                    <div className="bpmn-empty-state">
                      <Sparkles size={28} strokeWidth={1.2} color="var(--text-muted)" />
                      <p>История диалогов<br />пуста</p>
                    </div>
                  ) : (
                    aiChats.map(chat => (
                      <div
                        key={chat.id}
                        className={`bpmn-diagram-item ${activeAiChatId === chat.id ? 'active' : ''}`}
                        onClick={() => { setActiveAiChatId(chat.id); setShowAiPanel(true); }}
                      >
                        <div className="bpmn-diagram-icon">
                          <Bot size={12} />
                        </div>
                        <div className="bpmn-diagram-info">
                          <span className="bpmn-diagram-name">{chat.title}</span>
                          <span className="bpmn-diagram-date">
                            {new Date(chat.updatedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <button
                          className="bpmn-delete-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await bpmnFetch(`/api/bpmn/chats/${chat.id}`, { method: 'DELETE' });
                              setAiChats(prev => prev.filter(c => c.id !== chat.id));
                              if (activeAiChatId === chat.id) setActiveAiChatId(null);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          title="Удалить"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}

            </div>
          )}
        </div>

        {/* ── Canvas Area ── */}
        <div className="bpmn-canvas-wrap" data-grid={showGrid ? 'on' : 'off'} onMouseMove={handleMouseMove}>
          <div
            ref={containerRef}
            className="bpmn-canvas"
          />

          {/* Cursors Layer */}
          {Object.entries(roomUsers).map(([id, user]) => {
            if (id === socket?.id || user.x < 0) return null;
            return (
              <div key={id} style={{
                position: 'absolute', left: user.x, top: user.y,
                pointerEvents: 'none', zIndex: 100, transition: 'all 0.1s linear'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={user.color} style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" stroke="#fff" strokeWidth="1.5"/>
                </svg>
                <div style={{
                  background: user.color, color: '#fff', fontSize: 10,
                  padding: '2px 6px', borderRadius: 4, marginTop: 4, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {user.name}
                </div>
              </div>
            );
          })}

          {/* Onboarding Overlay */}
          {!isDirty && elementCount <= 1 && diagramName === 'Новая диаграмма' && !showAiPanel && (
            <div className="bpmn-onboarding">
              <h3>Опишите процесс в AI-панели или выберите шаблон, чтобы быстро построить диаграмму.</h3>
              <div className="bpmn-onboarding-actions" style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                <button className="bpmn-btn-save" onClick={() => setShowAiPanel(true)}>
                  <Sparkles size={14} style={{ marginRight: 6 }} /> Описать процесс
                </button>
                <button className="bpmn-btn-new" onClick={() => setShowAiPanel(true)}>
                  Выбрать шаблон
                </button>
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="bpmn-statusbar">
            <span className="bpmn-status-item">
              {isDirty
                ? <AlertCircle size={11} color="#f97316" />
                : <CheckCircle2 size={11} color="#22c55e" />}
              {isDirty ? 'Изменения не сохранены' : 'Сохранено'}
            </span>
            <span className="bpmn-status-sep" />
            <span className="bpmn-status-item">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: -2 }} />
              Онлайн: {Object.keys(roomUsers).length || 1}
            </span>
            <span className="bpmn-status-sep" />
            <span className="bpmn-status-item">
              <Layers size={11} />
              {elementCount} {elementCount === 1 ? 'элемент' : elementCount < 5 ? 'элемента' : 'элементов'}
            </span>
            <span className="bpmn-status-sep" />
            <span className="bpmn-status-item">
              {showGrid ? <Grid3X3 size={11} color="#6366f1" /> : <Grid3X3 size={11} />}
              {showGrid ? 'Сетка вкл.' : 'Сетка откл.'}
            </span>
            <div style={{ flex: 1 }} />
            <span className="bpmn-status-item bpmn-shortcuts-hint">
              Ctrl+Z отменить · Ctrl+S сохранить · Scroll зум
            </span>
          </div>
        </div>

        {/* ── PROPERTIES RIGHT SIDEBAR ── */}
        {selected && (
          <div className="bpmn-sidebar bpmn-sidebar-right">
            <div className="bpmn-sidebar-header" style={{ paddingLeft: 12 }}>
              <span>СВОЙСТВА ЭЛЕМЕНТА</span>
              <button className="bpmn-sidebar-toggle-right" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="bpmn-sidebar-content">
              <div className="bpmn-props-panel">
                <div className="bpmn-prop-type-badge">
                  {typeLabel(selected.type)}
                </div>
                <div className="bpmn-prop-id">ID: <code>{selected.id}</code></div>

                <div className="bpmn-prop-group">
                  <label className="bpmn-prop-label">Название</label>
                  <input
                    className="bpmn-prop-input"
                    value={propName}
                    onChange={e => setPropName(e.target.value)}
                    placeholder="Название элемента"
                  />
                </div>

                <div className="bpmn-prop-group">
                  <label className="bpmn-prop-label">Описание</label>
                  <textarea
                    className="bpmn-prop-textarea"
                    value={propDoc}
                    onChange={e => setPropDoc(e.target.value)}
                    placeholder="Описание элемента..."
                    rows={3}
                  />
                </div>

                <div className="bpmn-prop-group">
                  <label className="bpmn-prop-label">Цвет элемента</label>
                  <div className="bpmn-color-picker">
                    <button className="bpmn-color-btn" style={{ background: '#ffffff', borderColor: '#cccccc' }} title="Белый (Сброс)" onClick={() => handleColorize('#ffffff', '#000000')} />
                    <button className="bpmn-color-btn" style={{ background: '#dcfce7', borderColor: '#22c55e' }} title="Зелёный" onClick={() => handleColorize('#dcfce7', '#22c55e')} />
                    <button className="bpmn-color-btn" style={{ background: '#fee2e2', borderColor: '#ef4444' }} title="Красный" onClick={() => handleColorize('#fee2e2', '#ef4444')} />
                    <button className="bpmn-color-btn" style={{ background: '#e0e7ff', borderColor: '#6366f1' }} title="Синий" onClick={() => handleColorize('#e0e7ff', '#6366f1')} />
                    <button className="bpmn-color-btn" style={{ background: '#fef3c7', borderColor: '#f59e0b' }} title="Жёлтый" onClick={() => handleColorize('#fef3c7', '#f59e0b')} />
                  </div>
                </div>

                <button className="bpmn-prop-apply-btn" onClick={handleApplyProps}>
                  Применить изменения
                </button>

                <button className="bpmn-prop-delete-btn" onClick={handleDeleteElement}>
                  <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Удалить элемент
                </button>
              </div>
            </div>
          </div>
        )}

        {showAiPanel && (
          <AiProcessPanel 
            modeler={modelerRef.current} 
            onClose={() => setShowAiPanel(false)}
            onUpdateStatus={(msg, type) => notify(msg, type || 'success')}
            activeChatId={activeAiChatId}
            aiChats={aiChats}
            onSaveChat={async (chat) => {
              try {
                const res = await bpmnFetch('/api/bpmn/chats', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: chat.id, title: chat.title, messages: chat.messages })
                });
                if (res.ok) {
                  const saved = await res.json();
                  setAiChats(prev => {
                    const exists = prev.find(c => c.id === saved.id);
                    return exists ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev];
                  });
                  setActiveAiChatId(saved.id);
                }
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}
      </div>      {/* ── XML Modal ── */}
      {showXml && (
        <div className="bpmn-modal-overlay" onClick={() => setShowXml(false)}>
          <div className="bpmn-modal" onClick={e => e.stopPropagation()}>
            <div className="bpmn-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={16} color="#6366f1" />
                <span>XML исходник — {diagramName}</span>
              </div>
              <button className="bpmn-modal-close" onClick={() => setShowXml(false)}>✕</button>
            </div>
            <pre className="bpmn-xml-pre">{xmlContent}</pre>
            <div className="bpmn-modal-footer">
              <button className="bpmn-btn-new" onClick={() => { navigator.clipboard.writeText(xmlContent); notify('XML скопирован'); setShowXml(false); }}>
                <Copy size={12} /> Скопировать
              </button>
              <button className="bpmn-btn-save" onClick={() => { handleDownload(); setShowXml(false); }}>
                <Download size={12} /> Скачать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {notification && (
        <div className={`bpmn-toast ${notification.type}`}>
          {notification.type === 'error'
            ? <AlertCircle size={13} />
            : <CheckCircle2 size={13} />}
          {notification.msg}
        </div>
      )}
    </div>
  );
};

export default BpmnApp;
