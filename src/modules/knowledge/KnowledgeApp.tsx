import React, { useEffect } from 'react';
import { useKnowledgeStore } from './knowledgeStore';
import { KnowledgeSidebar } from './components/KnowledgeSidebar';
import { KnowledgeEditor } from './components/KnowledgeEditor';

const KnowledgeApp: React.FC = () => {
  const { loadNotes } = useKnowledgeStore();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <div style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      background: 'var(--bg-primary)' 
    }}>
      <KnowledgeSidebar />
      <KnowledgeEditor />
    </div>
  );
};

export default KnowledgeApp;
