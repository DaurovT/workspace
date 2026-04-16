import React, { useMemo } from 'react';

const parseInlineNodes = (text: string) => {
  let html = text;
  // Escape html tags to prevent XSS (very basic)
  html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Упоминания `@[Name]`
  html = html.replace(/@\[(.*?)\]/g, '<span class="md-mention">@$1</span>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="md-code-inline">$1</code>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
};

export const MarkdownViewer: React.FC<{ text: string }> = ({ text }) => {
  const html = useMemo(() => {
    if (!text) return '<p class="md-empty">Нет описания</p>';
    
    const lines = text.split('\n');
    let out = '';
    let inList = false;
    let inCodeBlock = false;
    let codeContent = '';

    lines.forEach(line => {
      // Поддержка code blocks ```
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          out += `<pre class="md-code-block"><code>${codeContent}</code></pre>`;
          inCodeBlock = false;
          codeContent = '';
        } else {
          inCodeBlock = true;
          if (inList) { out += '</ul>'; inList = false; }
        }
        return;
      }

      if (inCodeBlock) {
        // preserve newlines in code block, basic escape
        codeContent += line.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n';
        return;
      }

      if (line.match(/^(\s*)[-*]\s/)) {
        if (!inList) { out += '<ul class="md-list">'; inList = true; }
        let content = line.replace(/^(\s*)[-*]\s/, '');
        const checkedMatch = content.match(/^\[([ x])\]\s(.*)/i);
        if (checkedMatch) {
            const checked = checkedMatch[1].toLowerCase() === 'x';
            content = `<div style="display:flex; gap:6px; align-items:flex-start;"><input type="checkbox" ${checked ? 'checked' : ''} disabled style="margin-top:4px;" /> <span>${parseInlineNodes(checkedMatch[2])}</span></div>`;
            out += `<li class="md-list-item task-item" style="list-style-type:none; margin-left:-20px;">${content}</li>`;
        } else {
            out += `<li class="md-list-item">${parseInlineNodes(content)}</li>`;
        }
      } else {
        if (inList) { out += '</ul>'; inList = false; }
        
        let parsed = line;
        if (line.startsWith('### ')) parsed = `<h3 class="md-h3">${parseInlineNodes(line.substring(4))}</h3>`;
        else if (line.startsWith('## ')) parsed = `<h2 class="md-h2">${parseInlineNodes(line.substring(3))}</h2>`;
        else if (line.startsWith('# ')) parsed = `<h1 class="md-h1">${parseInlineNodes(line.substring(2))}</h1>`;
        else if (line.startsWith('> ')) parsed = `<blockquote class="md-quote">${parseInlineNodes(line.substring(2))}</blockquote>`;
        else parsed = `<p class="md-p">${parseInlineNodes(line)}</p>`;
        
        out += parsed;
      }
    });

    if (inCodeBlock) out += `<pre class="md-code-block"><code>${codeContent}</code></pre>`;
    if (inList) out += '</ul>';
    
    return out.replace(/<p class="md-p"><\/p>/g, '<div style="height:8px"></div>');
  }, [text]);

  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
};
