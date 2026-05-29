import { createSignal } from 'solid-js';
import type { Message, ChatSession } from './types';
import { getAuthKey } from './authSlice';

export const getInitialSessions = (): ChatSession[] => {
  const saved = localStorage.getItem(getAuthKey('chat_sessions'));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse chat sessions', e);
    }
  }
  const defaultSessionId = `session-${Date.now()}`;
  const defaultSessions = [{ id: defaultSessionId, title: '新しい会話', timestamp: Date.now() }];
  localStorage.setItem(getAuthKey('chat_sessions'), JSON.stringify(defaultSessions));
  localStorage.setItem(getAuthKey('active_session_id'), defaultSessionId);
  return defaultSessions;
};

export const getInitialSessionId = (initialSessions: ChatSession[]): string => {
  const savedActive = localStorage.getItem(getAuthKey('active_session_id'));
  if (savedActive && initialSessions.some(s => s.id === savedActive)) {
    return savedActive;
  }
  const fallbackId = initialSessions[0].id;
  localStorage.setItem(getAuthKey('active_session_id'), fallbackId);
  return fallbackId;
};

const initialSessions = getInitialSessions();
const initialSessionId = getInitialSessionId(initialSessions);

export const [sessions, setSessions] = createSignal<ChatSession[]>(initialSessions);
export const [sessionId, setSessionId] = createSignal<string>(initialSessionId);
export const [messages, setMessages] = createSignal<Message[]>([]);
