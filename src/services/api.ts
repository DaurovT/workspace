import type { Project, Task, Comment, AppSettings } from '../store';

export const apiHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
};

export const handleRes = async (r: Response) => {
  if (r.status === 401) {
    console.error('GOT 401 FROM:', r.url);
    localStorage.removeItem('has_session');
    localStorage.removeItem('auth_user');
    window.location.href = '/';
    await new Promise(() => {});
  }
  return r;
};

export const api = {
  async fetchProjects(): Promise<Project[]> {
    try { const r = await fetch('/api/arcana/projects', { headers: apiHeaders(), credentials: 'include' }); await handleRes(r); return r.ok ? r.json() : []; } catch { return []; }
  },
  async fetchTasks(): Promise<Task[]> {
    try { const r = await fetch('/api/arcana/tasks', { headers: apiHeaders(), credentials: 'include' }); await handleRes(r); return r.ok ? r.json() : []; } catch { return []; }
  },
  async fetchComments(): Promise<Comment[]> {
    try { const r = await fetch('/api/arcana/comments', { headers: apiHeaders(), credentials: 'include' }); await handleRes(r); return r.ok ? r.json() : []; } catch { return []; }
  },
  async fetchSettings(): Promise<Partial<AppSettings>> {
    try { const r = await fetch('/api/settings', { headers: apiHeaders(), credentials: 'include' }); await handleRes(r); return r.ok ? r.json() : {}; } catch { return {}; }
  },
  post(url: string, body: any) { return fetch(url, { method: 'POST', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(body) }).then(handleRes); },
  put(url: string, body: any) { return fetch(url, { method: 'PUT', headers: apiHeaders(), credentials: 'include', body: JSON.stringify(body) }).then(handleRes); },
  del(url: string) { return fetch(url, { method: 'DELETE', headers: apiHeaders(), credentials: 'include' }).then(handleRes); },
};
