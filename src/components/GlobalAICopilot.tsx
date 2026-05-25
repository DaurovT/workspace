import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../modules/finance/financeStore';
import { useStore } from '../store';
import { X, Send, Bot, TrendingUp, DollarSign, AlertTriangle, ArrowLeft, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { APP_CURRENCY, APP_CURRENCY_SYMBOL } from '../modules/finance/config/currency';

interface MiniBarData { label: string; value: number; }

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  widget?: 'balance' | 'clients' | 'cashflow' | 'warning' | 'bar' | 'funds' | 'action' | null;
  widgetData?: { title?: string; bars?: MiniBarData[]; action?: { label: string; view: string }; };
}

export const GlobalAICopilot: React.FC = () => {
  const isGlobalAIOpen = useStore(state => state.isGlobalAIOpen);
      const setGlobalAIOpen = useStore(state => state.setGlobalAIOpen);
  const { accounts, transactions, contractors, categories, funds, copilotConversations, activeCopilotConversationId, setActiveCopilotConversationId, createCopilotConversation, updateCopilotConversation } = useFinanceStore();
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setGlobalAIOpen(!useStore.getState().isGlobalAIOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setGlobalAIOpen]);

  const defaultMessages: ChatMessage[] = [
    {
      id: '0',
      sender: 'ai',
      text: 'Привет! Я ваш финансовый помощник. Чем могу помочь сегодня?',
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [inputValue, setInputValue] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputValue === '' && textareaRef.current) {
      textareaRef.current.style.height = '38px';
    }
  }, [inputValue]);

  // Sync active conversation
  useEffect(() => {
    if (activeCopilotConversationId) {
      const conv = copilotConversations.find(c => c.id === activeCopilotConversationId);
      if (conv) setMessages(conv.messages as ChatMessage[]);
    } else {
      setMessages(defaultMessages);
    }
  }, [activeCopilotConversationId, copilotConversations]);

  useEffect(() => {
    if (!showHistory) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isGlobalAIOpen, showHistory]);

  const processQuery = useCallback((q: string): ChatMessage => {
    const lower = q.toLowerCase();
    
    // --- Tasks / Tracker ---
    if (lower.includes('задач') || lower.includes('проект') || lower.includes('сделат')) {
      const activeTasks = useStore.getState().tasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
      const urgent = activeTasks.filter(t => t.priority === 'urgent');
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `📋 **Анализ ваших задач:**\n\nВсего активных задач: ${activeTasks.length}\n🔥 Срочных задач: ${urgent.length}\n\nРекомендую сначала заняться срочными задачами. Вы можете нажать \`Cmd+K\` чтобы быстро найти нужную задачу.`
      };
    }

    // --- Free Cash Balance ---
    if (lower.includes('свободн') || lower.includes('free cash') || lower.includes('реально') || lower.includes('доступ')) {
      const total = accounts.filter(a => a.currency === APP_CURRENCY).reduce((s, a) => s + a.balance, 0);
      const reserved = funds.reduce((s, f) => s + f.currentBalance, 0);
      const free = total - reserved;
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `💰 **Свободные средства (Free Cash Balance)**: **${new Intl.NumberFormat('ru-RU').format(free)} сум**\n\nВсего на счетах: ${new Intl.NumberFormat('ru-RU').format(total)} сум\nЗаморожено в сейфах: −${new Intl.NumberFormat('ru-RU').format(reserved)} сум\n\n${free < 0 ? '⚠️ Внимание: кассовый разрыв! Суммы в сейфах превышают остаток.' : '✅ Кассовый разрыв не обнаружен.'}`,
        widget: free < 0 ? 'warning' : 'balance',
      };
    }

    // --- Total Balance ---
    if (lower.includes('остаток') || lower.includes('денег') || lower.includes('сколько') || lower.includes('счет') || lower.includes('баланс')) {
      const sorted = [...accounts].sort((a, b) => b.balance - a.balance);
      const total = accounts.reduce((s, a) => s + (a.currency === APP_CURRENCY ? a.balance : 0), 0);
      const bars = sorted.slice(0, 4).map(a => ({ label: a.name.substring(0, 18), value: a.balance }));
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `Общий остаток на сумвых счетах: **${new Intl.NumberFormat('ru-RU').format(total)} сум**\n\nНаибольший остаток на счёте «${sorted[0]?.name}» — ${new Intl.NumberFormat('ru-RU').format(sorted[0]?.balance || 0)} сум.`,
        widget: 'bar',
        widgetData: { title: 'Остатки по счетам', bars },
      };
    }

    // --- Top Clients ---
    if (lower.includes('клиент') || lower.includes('выручк') || lower.includes('доход') || lower.includes('лучший')) {
      const map = new Map<string, number>();
      transactions.filter(t => t.type === 'income').forEach(t => {
        const c = contractors.find(c => c.id === t.contractorId)?.name || 'Без контрагента';
        map.set(c, (map.get(c) || 0) + (t.baseAmount ?? t.amount));
      });
      const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (!top.length) return { id: Date.now().toString(), sender: 'ai', text: 'Пока нет данных о доходах по клиентам.' };
      const bars = top.map(([label, value]) => ({ label: label.substring(0, 16), value }));
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `🏆 **Топ-5 клиентов по выручке:**\n\n${top.map(([n, v], i) => `${i + 1}. ${n} — ${new Intl.NumberFormat('ru-RU').format(v)} ${APP_CURRENCY_SYMBOL}`).join('\n')}`,
        widget: 'bar',
        widgetData: { title: 'Выручка по клиентам', bars },
      };
    }

    // --- Expenses / overspend ---
    if (lower.includes('расход') || lower.includes('траты') || lower.includes('перетратил') || lower.includes('категор')) {
      const map = new Map<string, number>();
      transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId)?.name || 'Прочее';
        map.set(cat, (map.get(cat) || 0) + (t.baseAmount ?? t.amount));
      });
      const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const bars = top.map(([label, value]) => ({ label: label.substring(0, 18), value }));
      const totalExp = top.reduce((s, [, v]) => s + v, 0);
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `📊 **Топ расходных статей:**\n\n${top.map(([n, v], i) => `${i + 1}. ${n} — ${new Intl.NumberFormat('ru-RU').format(v)} ${APP_CURRENCY_SYMBOL}`).join('\n')}\n\nВсего расходов: **${new Intl.NumberFormat('ru-RU').format(totalExp)} сум**`,
        widget: 'bar',
        widgetData: { title: 'Структура расходов', bars },
      };
    }

    // --- Cash gap / разрыв ---
    if (lower.includes('разрыв') || lower.includes('кассов') || lower.includes('хватит') || lower.includes('хватает')) {
      const totalUzs = accounts.filter(a => a.currency === APP_CURRENCY).reduce((s, a) => s + a.balance, 0);
      const reserved = funds.reduce((s, f) => s + f.currentBalance, 0);
      const free = totalUzs - reserved;
      const avgExpPerMonth = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0) / 6;
      const monthsCovered = avgExpPerMonth > 0 ? (free / avgExpPerMonth).toFixed(1) : '∞';
      return {
        id: Date.now().toString(), sender: 'ai',
        text: free < 0
          ? `🚨 **Кассовый разрыв!**\nСвободный остаток отрицательный: **${new Intl.NumberFormat('ru-RU').format(free)} сум**.\nРекомендую срочно пополнить операционный счёт или разморозить часть резервов.`
          : `✅ Кассового разрыва нет. Свободных средств: **${new Intl.NumberFormat('ru-RU').format(free)} сум**\nПри текущем темпе расходов хватит примерно на **${monthsCovered} мес.**`,
        widget: free < 0 ? 'warning' : 'balance',
      };
    }

    // --- What-if scenario ---
    const amountMatch = lower.match(/(\d[\d\s]+)(млн|тыс|к|000)/);
    if ((lower.includes('куплю') || lower.includes('трачу') || lower.includes('заплачу') || lower.includes('what if')) && amountMatch) {
      let amt = parseInt(amountMatch[1].replace(/\s/g, ''));
      if (amountMatch[2].includes('млн')) amt *= 1_000_000;
      else if (amountMatch[2].includes('тыс') || amountMatch[2].includes('к')) amt *= 1_000;
      const free = accounts.filter(a => a.currency === APP_CURRENCY).reduce((s, a) => s + a.balance, 0) - funds.reduce((s, f) => s + f.currentBalance, 0);
      const after = free - amt;
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `📐 **What-if анализ:**\nЕсли вы потратите **${new Intl.NumberFormat('ru-RU').format(amt)} сум**, то после операции свободный остаток составит:\n\n${after >= 0 ? `✅ **${new Intl.NumberFormat('ru-RU').format(after)} сум** — всё в порядке` : `🚨 **${new Intl.NumberFormat('ru-RU').format(after)} сум** — кассовый разрыв! Рекомендую рассмотреть рассрочку или лизинг.`}`,
        widget: after < 0 ? 'warning' : 'balance',
      };
    }

    // --- Funds / Safes ---
    if (lower.includes('сейф') || lower.includes('резерв') || lower.includes('фонд') || lower.includes('налог')) {
      const bars = funds.map(f => ({ label: f.name.substring(0, 18), value: f.currentBalance }));
      const total = funds.reduce((s, f) => s + f.currentBalance, 0);
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `🔒 **Резервные фонды (Сейфы):**\n\n${funds.map(f => `• ${f.name}: **${new Intl.NumberFormat('ru-RU').format(f.currentBalance)} сум** (цель: ${new Intl.NumberFormat('ru-RU').format(f.targetAmount)} сум)`).join('\n')}\n\nИтого зарезервировано: **${new Intl.NumberFormat('ru-RU').format(total)} сум**`,
        widget: 'bar',
        widgetData: { title: 'Сейфы', bars },
      };
    }

    // --- Profit / рентабельность ---
    if (lower.includes('прибыл') || lower.includes('рентабел') || lower.includes('маржа') || lower.includes('p&l') || lower.includes('pnl')) {
      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.baseAmount ?? t.amount), 0);
      const profit = income - expense;
      const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0';
      return {
        id: Date.now().toString(), sender: 'ai',
        text: `📈 **Анализ P&L (ОПУ):**\n\nВыручка: ${new Intl.NumberFormat('ru-RU').format(income)} сум\nРасходы: ${new Intl.NumberFormat('ru-RU').format(expense)} сум\nЧистая прибыль: **${new Intl.NumberFormat('ru-RU').format(profit)} сум**\nМаржинальность: **${margin}%**\n\n${parseFloat(margin) > 20 ? '✅ Отличная рентабельность!' : parseFloat(margin) > 10 ? '⚡ Средняя рентабельность. Есть пространство для роста.' : '⚠️ Низкая маржа. Рекомендую провести анализ расходов.'}`,
        widget: profit > 0 ? 'cashflow' : 'warning',
      };
    }

    // --- Greeting ---
    if (lower.includes('привет') || lower.includes('здравств') || lower.includes('добр')) {
      return { id: Date.now().toString(), sender: 'ai', text: 'Привет! 👋 Готов анализировать ваши финансы. Попробуйте спросить:\n\n• «Сколько денег на счетах?»\n• «Топ клиентов по выручке»\n• «Есть ли кассовый разрыв?»\n• «Если я куплю оборудование за 3 млн...»' };
    }

    return {
      id: Date.now().toString(), sender: 'ai',
      text: 'Я не совсем понял вопрос. Попробуйте переформулировать. Примеры:\n\n• «Сколько свободных денег?»\n• «Где мы перетратили?»\n• «Если я куплю склад за 5 млн, хватит ли денег?»',
    };
  }, [accounts, transactions, contractors, categories, funds]);

  const handleSend = useCallback((text?: string) => {
    const q = text || inputValue;
    if (!q.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: q };
    
    let currentConvId = activeCopilotConversationId;
    let currentMessages = [...messages];
    
    if (!currentConvId) {
      currentConvId = Date.now().toString();
      const newMessages = [...defaultMessages, userMsg];
      createCopilotConversation({ id: currentConvId, title: q.substring(0, 40), updatedAt: new Date().toISOString(), messages: newMessages as any });
      setActiveCopilotConversationId(currentConvId);
    } else {
      updateCopilotConversation(currentConvId, { messages: [...currentMessages, userMsg] as any });
    }

    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg = processQuery(q);
      setIsTyping(false);
      const storeState = useFinanceStore.getState();
      const updatedConv = storeState.copilotConversations.find(c => c.id === currentConvId);
      if (updatedConv) {
         storeState.updateCopilotConversation(currentConvId!, { messages: [...updatedConv.messages, aiMsg] as any });
      }
    }, 900 + Math.random() * 600);
  }, [inputValue, processQuery, activeCopilotConversationId, messages, createCopilotConversation, updateCopilotConversation, setActiveCopilotConversationId]);

  // Mini bar chart renderer
  const MiniBarChart: React.FC<{ data: MiniBarData[]; title: string }> = ({ data, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 14, marginTop: 8, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((d, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>
                <span>{d.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(d.value)}</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', height: 5, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', height: '100%', width: `${(d.value / max) * 100}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render message text with markdown-ish bold
  const renderText = (text: string) =>
    text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div key={i} style={{ minHeight: line === '' ? 8 : 'auto' }}>
          {parts.map((p, j) =>
            p.startsWith('**') ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>
          )}
        </div>
      );
    });

  return (
    <>
      <div 
        style={{ 
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 1000,
          width: isGlobalAIOpen ? 380 : 0, 
          height: '100vh',
          background: 'var(--bg-surface)', 
          borderLeft: isGlobalAIOpen ? '1px solid var(--border-subtle)' : 'none', 
          display: 'flex', flexDirection: 'column', 
          boxShadow: isGlobalAIOpen ? '-8px 0 24px rgba(0,0,0,0.08)' : 'none', 
          opacity: isGlobalAIOpen ? 1 : 0,
          pointerEvents: isGlobalAIOpen ? 'auto' : 'none',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, boxSizing: 'border-box' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
          {showHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ArrowLeft size={18} />
              </button>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="var(--color-primary)" />
                История чатов
              </h3>
            </div>
          ) : (
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--color-primary)" />
              AI Copilot
            </h3>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setGlobalAIOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>
          </div>

          {showHistory ? (
            <div className="hide-scrollbar" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-base)', boxSizing: 'border-box' }}>
              <button 
                onClick={() => { setActiveCopilotConversationId(null); setShowHistory(false); }}
                style={{ width: '100%', padding: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <Plus size={16} /> Новый чат
              </button>
              
              {copilotConversations.length > 0 && <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ваши диалоги</div>}
              
              {copilotConversations.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <MessageSquare size={32} opacity={0.3} />
                  У вас пока нет сохраненных чатов.
                </div>
              ) : (
                copilotConversations.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => { setActiveCopilotConversationId(c.id); setShowHistory(false); }}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px', cursor: 'pointer', transition: 'all 0.2s', borderColor: activeCopilotConversationId === c.id ? 'var(--color-primary)' : 'var(--border-subtle)' }}
                    onMouseEnter={e => { if(activeCopilotConversationId !== c.id) e.currentTarget.style.borderColor = 'var(--border-default)' }}
                    onMouseLeave={e => { if(activeCopilotConversationId !== c.id) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.updatedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, boxSizing: 'border-box', background: 'var(--bg-base)' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ display: 'none' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <div style={{ background: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-surface)', color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)', padding: '12px 16px', borderRadius: msg.sender === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px', fontSize: 13, fontWeight: 400, lineHeight: 1.5, border: msg.sender === 'user' ? 'none' : '1px solid var(--border-subtle)', boxShadow: msg.sender === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.02)', wordBreak: 'break-word' }}>
                      {renderText(msg.text)}
                    </div>
                    {msg.widget === 'warning' && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: '#ef4444' }}>
                        <AlertTriangle size={12} /> Требует внимания
                      </div>
                    )}
                    {msg.widget === 'balance' && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: '#10b981' }}>
                        <DollarSign size={12} /> Баланс в норме
                      </div>
                    )}
                    {msg.widget === 'cashflow' && (
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: '#3b82f6' }}>
                        <TrendingUp size={12} /> Выручка растет
                      </div>
                    )}
                    {msg.widget === 'bar' && msg.widgetData?.bars && (
                      <MiniBarChart data={msg.widgetData.bars} title={msg.widgetData.title || ''} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={12} color="#fff" />
                </div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', animation: `pulse 1.2s ease ${i * 0.2}s infinite`, opacity: 0.6 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '0', background: 'var(--bg-base)', borderTop: 'none', boxSizing: 'border-box' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderBottom: 'none', borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', margin: '0 20px', overflow: 'hidden' }}>
              <textarea
                id="aicopilotwidget-text-1" 
                name="aicopilotwidget-text-1"
                ref={textareaRef}
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  e.target.style.height = '48px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isTyping) handleSend();
                  }
                }}
                placeholder="Type a message..."
                disabled={isTyping}
                style={{ width: '100%', minHeight: 48, height: 48, maxHeight: 120, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: '14px 16px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 400, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, wordBreak: 'break-all' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                <button
                  style={{ width: 28, height: 28, background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  style={{ width: 28, height: 28, background: 'var(--color-primary)', border: 'none', borderRadius: 4, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: inputValue.trim() && !isTyping ? 'pointer' : 'default', opacity: inputValue.trim() && !isTyping ? 1 : 0.6, transition: 'all 0.2s' }}
                >
                  <Send size={14} style={{ marginLeft: -1, marginTop: 1 }} />
                </button>
              </div>
            </div>
          </div>
          <div style={{ height: 20, background: 'var(--bg-base)' }} />
          </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};
