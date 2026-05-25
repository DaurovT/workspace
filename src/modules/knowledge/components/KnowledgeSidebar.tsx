import React, { useState } from 'react';
import { useKnowledgeStore } from '../knowledgeStore';
import type { KnowledgeNote } from '../knowledgeStore';
import { ChevronRight, ChevronDown, FileText, FilePlus, Trash2 } from 'lucide-react';

const NoteTreeItem: React.FC<{ note: KnowledgeNote, allNotes: KnowledgeNote[], depth: number }> = ({ note, allNotes, depth }) => {
  const { activeNoteId, setActiveNoteId, deleteNote, createNote } = useKnowledgeStore();
  const [expanded, setExpanded] = useState(true);

  // A note is considered a folder if it has children or if we explicitly created it as a parent
  const children = allNotes.filter(n => n.parentId === note.id);
  const isFolder = children.length > 0;
  const isActive = activeNoteId === note.id;

  return (
    <div>
      <div 
        className="knowledge-tree-item"
        style={{ 
          paddingLeft: depth * 12 + 8,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px', cursor: 'pointer',
          background: isActive ? 'var(--primary-color, rgba(99,102,241,0.15))' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderRadius: 6,
          marginBottom: 2
        }}
        onClick={() => setActiveNoteId(note.id)}
      >
        <span 
          style={{ width: 16, display: 'flex', justifyContent: 'center' }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {isFolder ? (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <FileText size={14} opacity={0.5} />}
        </span>
        
        <span style={{ flex: 1, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {note.title || 'Безымянная заметка'}
        </span>
        
        {isActive && (
          <div style={{ display: 'flex', gap: 4 }} className="knowledge-item-actions">
            <button 
              onClick={(e) => { e.stopPropagation(); createNote(note.id); setExpanded(true); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
              title="Добавить в папку"
            >
              <FilePlus size={14} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); if(confirm('Удалить заметку?')) deleteNote(note.id); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
              title="Удалить"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <NoteTreeItem key={child.id} note={child} allNotes={allNotes} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const KnowledgeSidebar: React.FC = () => {
  const { notes, createNote } = useKnowledgeStore();
  
  const rootNotes = notes.filter(n => !n.parentId);

  return (
    <div style={{
      width: 260,
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>База знаний</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-icon btn-ghost" 
            title="Новая заметка"
            onClick={() => createNote(null)}
          >
            <FilePlus size={16} color="var(--text-secondary)" />
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {rootNotes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
            Нет заметок. Создайте первую!
          </div>
        ) : (
          rootNotes.map(note => (
            <NoteTreeItem key={note.id} note={note} allNotes={notes} depth={0} />
          ))
        )}
      </div>
    </div>
  );
};
