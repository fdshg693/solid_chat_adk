import { createSignal } from 'solid-js';

// Authentication signals
export const [authUsername, setAuthUsername] = createSignal<string | null>(localStorage.getItem('auth_username'));
export const [authRole, setAuthRole] = createSignal<string | null>(localStorage.getItem('auth_role'));
export const [authAvatar, setAuthAvatar] = createSignal<string | null>(localStorage.getItem('auth_avatar'));

// Helper to get namespace-isolated LocalStorage key
export const getAuthKey = (key: string): string => {
  const user = authUsername();
  return user ? `${user}_${key}` : key;
};

// Cryptographically secure fetch wrapper adding Authorization header with JWT
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};
