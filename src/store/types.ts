export interface Persona {
  id: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
}

export interface UserMemo {
  id: string;
  title: string;
  content: string;
  creator?: string;
  updater?: string;
  targetAudiences?: string[];
}

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  avatar?: string;
}

export const DEFAULT_PERSONAS: Persona[] = [
  { id: 'u-1', name: 'admin', role: 'admin', avatar: '👑' },
  { id: 'u-2', name: 'user1', role: 'user', avatar: '👤' }
];
