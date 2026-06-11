import { toast } from './toast';

// Shared fetch wrapper: credentials + CSRF header, 401 redirect, and a visible
// toast on failure (so API errors are never silent). Returns the raw Response.
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers, credentials: 'include' });
  } catch (e) {
    toast.error('Нет связи с сервером');
    throw e;
  }
  if (res.status === 401) {
    localStorage.removeItem('has_session');
    window.location.href = '/';
    await new Promise(() => {}); // pause forever during redirect
  }
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const data = await res.clone().json();
      if (data && data.error) msg = data.error;
    } catch { /* non-JSON body */ }
    toast.error(msg);
  }
  return res;
};
