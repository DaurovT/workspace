import React, { useState, useEffect } from 'react';
import { useKnowledgeStore } from '../knowledgeStore';
import { MarkdownEditor } from '../../workspace/MarkdownEditor';

export const KnowledgeEditor: React.FC = () => {
  const { activeNoteId, notes, updateNote } = useKnowledgeStore();
  const activeNote = notes.find(n => n.id === activeNoteId);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Sync local state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
  }, [activeNoteId, activeNote?.title, activeNote?.content]);

  // Debounced save
  useEffect(() => {
    if (!activeNoteId || !activeNote) return;
    
    // Only save if changed
    if (title === activeNote.title && content === activeNote.content) return;

    const timeout = setTimeout(() => {
      updateNote(activeNoteId, { title, content });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [title, content, activeNoteId, activeNote, updateNote]);

  if (!activeNoteId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
        Выберите заметку в меню слева или создайте новую
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Заголовок заметки..."
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            fontFamily: 'inherit'
          }}
        />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          Изменения сохраняются автоматически
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Начните писать здесь... (поддерживается Markdown)"
        />
      </div>
    </div>
  );
};
