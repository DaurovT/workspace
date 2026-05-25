import React, { useState, useRef, useEffect } from 'react';
import type { ProcessAnalysis } from '../types/processAnalysis';
import { analyzeProcessText } from '../services/aiProcessApi';
import { buildBpmnFromAnalysis } from '../services/buildBpmnFromAnalysis';
import { PROCESS_TEMPLATES } from '../templates/processTemplates';
import { Sparkles, CheckCircle, Search, AlertTriangle, Send, User, Bot, X, Plus } from 'lucide-react';
import './AiProcessPanel.css';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  action?: 'preview_create' | 'preview_validate';
  previewData?: ProcessAnalysis;
  applied?: boolean;
}

interface Props {
  modeler: any;
  onClose: () => void;
  onUpdateStatus: (msg: string, type?: 'success' | 'warning' | 'error') => void;
  activeChatId?: string | null;
  aiChats?: any[];
  onSaveChat?: (chat: any) => void;
}



export const AiProcessPanel: React.FC<Props> = ({ modeler, onClose, onUpdateStatus, activeChatId, aiChats, onSaveChat }) => {
  const defaultMessages: Message[] = [
    {
      id: 'init',
      role: 'ai',
      text: 'Привет! Я AI-агент. Опишите процесс, который хотите создать, или попросите проверить текущую схему.',
    }
  ];

  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeChatId && aiChats) {
      const chat = aiChats.find(c => c.id === activeChatId);
      if (chat) {
        setMessages(chat.messages);
      } else {
        setMessages(defaultMessages);
      }
    } else {
      setMessages(defaultMessages);
    }
  }, [activeChatId, aiChats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToProcess: string, forceMode?: 'create' | 'validate') => {
    if (!textToProcess.trim() && !forceMode) return;
    
    let currentMessages = [...messages];
    if (textToProcess.trim()) {
      currentMessages = [...currentMessages, { id: Date.now().toString(), role: 'user', text: textToProcess }];
      setMessages(currentMessages);
    }
    
    setInput('');
    setLoading(true);

    const mode = forceMode || (textToProcess.toLowerCase().includes('провер') ? 'validate' : 'create');

    try {
      let aiText = '';
      let action: any = undefined;
      let previewData: any = undefined;

      if (mode === 'validate') {
        const { xml } = await modeler.saveXML({ format: true });
        const data = await analyzeProcessText(xml, 'validate');
        if (data.warnings.length === 0) {
           aiText = 'Я проанализировал схему. Ошибок и логических нестыковок не найдено! Отличная работа.';
        } else {
           aiText = `Я проанализировал схему и нашел ${data.warnings.length} проблем.`;
           action = 'preview_validate';
           previewData = data;
        }
      } else {
        const data = await analyzeProcessText(textToProcess, 'create');
        if (data.questions.length > 0) {
          aiText = `Описание получилось слишком общим.\nТребуются уточнения:\n${data.questions.map(q => `— ${q}`).join('\n')}\n\nВы можете ответить на них, или я могу построить черновик как есть.`;
          action = 'preview_create';
          previewData = data;
        } else {
          aiText = `Отлично! Я подготовил структуру процесса "${data.processTitle}". Готов перенести её на холст.`;
          action = 'preview_create';
          previewData = data;
        }
      }

      const newMsg: Message = {
        id: Date.now().toString() + '_ai',
        role: 'ai',
        text: aiText,
        action,
        previewData
      };
      
      const updatedMessages = [...currentMessages, newMsg];
      setMessages(updatedMessages);

      if (onSaveChat) {
        const title = textToProcess.trim() ? textToProcess.substring(0, 30) + '...' : 'Проверка диаграммы';
        onSaveChat({
          id: activeChatId || undefined,
          title: activeChatId ? (aiChats?.find(c => c.id === activeChatId)?.title || title) : title,
          updatedAt: new Date().toISOString(),
          messages: updatedMessages
        });
      }

    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: 'Произошла ошибка при анализе. Попробуйте еще раз.' }]);
      onUpdateStatus('Ошибка AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyBuild = (msgId: string, data: ProcessAnalysis) => {
    buildBpmnFromAnalysis(modeler, data);
    onUpdateStatus('Диаграмма обновлена', 'success');
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="ai-process-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles size={16} className="text-purple-500" />
          <span>AI Copilot</span>
        </div>
        <div style={{display:'flex', gap: 8}}>
          <button className="ai-header-btn" onClick={() => handleSend('Проверь текущую схему', 'validate')} title="Проверить схему">
            <Search size={14} />
          </button>
          <button className="ai-close-btn" onClick={onClose}><X size={16} /></button>
        </div>
      </div>

      <div className="ai-chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`ai-message-row ${msg.role}`}>
            <div className="ai-message-avatar">
              {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className="ai-message-content">
              {msg.text && <div className="ai-message-text">{msg.text}</div>}
              
              {/* Template logic for first message */}
              {msg.id === 'init' && (
                <div className="ai-chat-templates">
                  {PROCESS_TEMPLATES.map(tpl => (
                    <button key={tpl.id} className="ai-chat-template-chip" onClick={() => handleSend(tpl.defaultPrompt, 'create')}>
                      {tpl.emoji} {tpl.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Actionable Preview Box */}
              {msg.action === 'preview_create' && msg.previewData && !msg.applied && (
                <div className="ai-chat-action-box">
                  <div className="ai-stats">Узлов: {msg.previewData.nodes.length} | Ролей: {msg.previewData.roles.length}</div>
                  <button className="ai-btn-primary" onClick={() => applyBuild(msg.id, msg.previewData!)}>
                    Применить на холсте
                  </button>
                </div>
              )}

              {msg.action === 'preview_create' && msg.applied && (
                <div className="ai-chat-action-success">
                  <CheckCircle size={12} /> Изменения применены
                </div>
              )}

              {msg.action === 'preview_validate' && msg.previewData && (
                <div className="ai-chat-action-box warning">
                  <div className="ai-warnings">
                    {msg.previewData.warnings.map((w, i) => (
                      <div key={i} style={{marginBottom: 4}}><AlertTriangle size={12} style={{display:'inline', marginRight:4}}/> {w}</div>
                    ))}
                  </div>
                  {msg.previewData.suggestions && msg.previewData.suggestions.length > 0 && (
                    <div className="ai-suggestions" style={{color: '#059669', marginTop: 8}}>
                      <strong>Рекомендации:</strong>
                      <ul style={{paddingLeft:16, margin: '4px 0 0 0'}}>
                        {msg.previewData.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  <button className="ai-btn-primary" style={{marginTop: 8}} onClick={() => onUpdateStatus('Автоисправление в разработке', 'warning')}>
                    <Sparkles size={14}/> Исправить всё (Mock)
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-typing-container">
            <div className="ai-typing-avatar">
              <Bot size={12} color="#fff" />
            </div>
            <div className="ai-typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="ai-chat-input-area">
        <div className="ai-chat-input-wrapper">
          <textarea
            className="ai-chat-textarea"
            placeholder="Опишите бизнес-процесс..."
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = '48px';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="ai-chat-actions">
            <button className="ai-chat-plus-btn" title="Добавить файл">
              <Plus size={16} />
            </button>
            <button 
              className="ai-chat-send-btn" 
              disabled={!input.trim() || loading}
              onClick={() => {
                handleSend(input);
                if (chatEndRef.current) {
                  const textarea = document.querySelector('.ai-chat-textarea') as HTMLTextAreaElement;
                  if (textarea) textarea.style.height = '48px';
                }
              }}
            >
              <Send size={14} style={{ marginLeft: -1, marginTop: 1 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
