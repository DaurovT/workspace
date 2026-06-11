import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../modules/finance/financeStore';
import { useStore } from '../store';
import { X, Send, Bot, TrendingUp, DollarSign, AlertTriangle, ArrowLeft, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MiniBarData { label: string; value: number; }

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  widget?: 'balance' | 'clients' | 'cashflow' | 'warning' | 'bar' | 'funds' | 'action' | null;
  widgetData?: { title?: string; bars?: MiniBarData[]; action?: { label: string; view: string }; };
}

export const GlobalAICopilot: React.FC = () => {
  const { t } = useTranslation();
  const isGlobalAIOpen = useStore(state => state.isGlobalAIOpen);
  const setGlobalAIOpen = useStore(state => state.setGlobalAIOpen);
  const { copilotConversations, activeCopilotConversationId, setActiveCopilotConversationId } = useFinanceStore();
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
      text: t('Привет! Я ваш финансовый помощник. Чем могу помочь сегодня?'),
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

  // Send message and get AI response from server
  const handleSend = useCallback(async (text?: string) => {
    const q = text || inputValue;
    if (!q.trim()) return;

    const userMsg: ChatMessage & { role?: string } = { id: Date.now().toString(), sender: 'user', text: q, role: 'user' };

    let currentConvId = activeCopilotConversationId;
    const currentMessages = [...messages];
    const storeState = useFinanceStore.getState();

    setInputValue('');
    setIsTyping(true);

    try {
      let responseConv: any;

      if (!currentConvId) {
        // Create new conversation — server generates AI reply
        const newMessages = [...defaultMessages.map(m => ({ ...m, role: 'assistant' })), userMsg];
        const res = await fetch('/api/copilot-conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
          body: JSON.stringify({
            id: Date.now().toString(),
            title: q.substring(0, 40),
            updatedAt: new Date().toISOString(),
            messages: newMessages,
          }),
        });
        responseConv = await res.json();
        setActiveCopilotConversationId(responseConv.id);
        storeState.createCopilotConversation(responseConv);
      } else {
        // Update existing conversation — server generates AI reply
        const newMessages = [...currentMessages.map(m => ({ ...m, role: m.sender === 'ai' ? 'assistant' : 'user' })), userMsg];
        const res = await fetch(`/api/copilot-conversations/${currentConvId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'include',
          body: JSON.stringify({
            updatedAt: new Date().toISOString(),
            messages: newMessages,
          }),
        });
        responseConv = await res.json();
        storeState.updateCopilotConversation(currentConvId, responseConv);
      }
    } catch (e) {
      console.error('AI request failed:', e);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, activeCopilotConversationId, messages, setActiveCopilotConversationId, defaultMessages]);

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
      const trimmed = line.trimStart();
      const isBullet = /^[-*\u2022]\s+/.test(trimmed);
      const content = isBullet ? trimmed.replace(/^[-*\u2022]\s+/, '') : line;
      const parts = content.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((p, j) =>
        p.startsWith('**') ? <strong key={j} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>
      );
      if (isBullet) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '1px 0' }}>
            <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}>•</span>
            <span style={{ minWidth: 0 }}>{rendered}</span>
          </div>
        );
      }
      return <div key={i} style={{ minHeight: line === '' ? 8 : 'auto' }}>{rendered}</div>;
    });

  return (
    <>
      <div 
        style={{ 
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 1000,
          width: isGlobalAIOpen ? 420 : 0, 
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
        <div style={{ width: 420, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, boxSizing: 'border-box' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxSizing: 'border-box' }}>
          {showHistory ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <ArrowLeft size={18} />
              </button>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="var(--color-primary)" />
                {t('История чатов')}
              </h3>
            </div>
          ) : (
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--color-primary)" />
              AI Copilot
            </h3>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!showHistory && (<>
              <button onClick={() => { setActiveCopilotConversationId(null); setMessages(defaultMessages); }} title={t('Новый чат')} aria-label={t('Новый чат')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 5, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Plus size={18} />
              </button>
              <button onClick={() => setShowHistory(true)} title={t('История чатов')} aria-label={t('История чатов')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 5, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <MessageSquare size={17} />
              </button>
            </>)}
            <button onClick={() => setGlobalAIOpen(false)} title={t('Закрыть')} aria-label={t('Закрыть')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 5, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
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
                <Plus size={16} /> {t('Новый чат')}
              </button>
              
              {copilotConversations.length > 0 && <div style={{ marginTop: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Ваши диалоги')}</div>}
              
              {copilotConversations.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <MessageSquare size={32} opacity={0.3} />
                  {t('У вас пока нет сохраненных чатов.')}
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
                        <AlertTriangle size={12} /> {t('Требует внимания')}
                      </div>
                    )}
                    {msg.widget === 'balance' && (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: '#10b981' }}>
                        <DollarSign size={12} /> {t('Баланс в норме')}
                      </div>
                    )}
                    {msg.widget === 'cashflow' && (
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: '#3b82f6' }}>
                        <TrendingUp size={12} /> {t('Выручка растет')}
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
                placeholder={t('Спросите про ваши финансы…')}
                disabled={isTyping}
                style={{ width: '100%', minHeight: 48, height: 48, maxHeight: 120, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: '14px 16px', color: 'var(--text-primary)', fontSize: 13, fontWeight: 400, outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', userSelect: 'none' }}>{t('Enter — отправить')}</span>
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
