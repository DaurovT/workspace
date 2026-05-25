/**
 * Centralized API base URL helper.
 * All API calls in the app should use this to ensure consistent behavior
 * across development (Vite proxy) and production (direct connection) environments.
 */
export const API_BASE = '';

/**
 * Build a full API URL from a path like '/api/assets'.
 * @param path - must start with '/api/...'
 */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;
