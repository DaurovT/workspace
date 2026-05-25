import { AsyncLocalStorage } from 'async_hooks';

export interface AuthContextPayload {
  userId: string;
  userName: string;
  role: string;
}

export const authContext = new AsyncLocalStorage<AuthContextPayload>();
