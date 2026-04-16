import React, { useState, useRef } from 'react';
import { Bold, Italic, Code, List, CheckSquare } from 'lucide-react';
import { MarkdownViewer } from './MarkdownViewer';
import { MentionsInput, Mention } from 'react-mentions';
import { useStore } from '../../../store';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const users = useStore(s => s.users);

  // Prepare users for mention auto-complete
  const mentionData = users.map(u => ({ id: u.name, display: u.name }));

  const insertFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = before + prefix + selected + suffix + after;
    onChange(newText);

    // Set cursor position back inside the braces/marks
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="md-editor-container">
      <div className="md-editor-header">
        <div className="md-editor-tabs">
          <button 
            type="button"
            className={`btn btn-sm ${tab === 'write' ? 'active' : 'btn-ghost'}`} 
            onClick={() => setTab('write')}
          >
            Писать
          </button>
          <button 
            type="button"
            className={`btn btn-sm ${tab === 'preview' ? 'active' : 'btn-ghost'}`} 
            onClick={() => setTab('preview')}
          >
            Превью
          </button>
        </div>
        
        {tab === 'write' && (
          <div className="md-editor-toolbar">
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => insertFormat('**', '**')} title="Жирный">
              <Bold size={14} />
            </button>
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => insertFormat('*', '*')} title="Курсив">
              <Italic size={14} />
            </button>
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => insertFormat('`', '`')} title="Код">
              <Code size={14} />
            </button>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => insertFormat('- ')} title="Список">
              <List size={14} />
            </button>
            <button type="button" className="btn btn-icon btn-ghost" onClick={() => insertFormat('- [ ] ')} title="Задача">
              <CheckSquare size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="md-editor-body">
        {tab === 'write' ? (
          <MentionsInput
            inputRef={textareaRef as any}
            className="md-mentions-container"
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
          >
            <Mention
              trigger="@"
              data={mentionData}
              markup="@[__display__]"
              className="md-mention-highlight"
              style={{ background: 'var(--color-primary-light)', padding: '0 2px', borderRadius: 4 }}
            />
          </MentionsInput>
        ) : (
          <div className="md-preview-area">
            <MarkdownViewer text={value} />
          </div>
        )}
      </div>
    </div>
  );
};
