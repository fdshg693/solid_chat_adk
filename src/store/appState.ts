import {
  authUsername, authRole, authAvatar, getAuthKey, authFetch,
  setAuthUsername, setAuthRole, setAuthAvatar
} from './authSlice';

import {
  currentTab, loading, errorMessage, userInput,
  setCurrentTab, setLoading, setErrorMessage, setUserInput,
  scrollerRef, setScrollerRef, scrollToBottom
} from './uiSlice';

import {
  apiKey, tempKey, tavilyApiKey, tempTavilyKey, model, instruction,
  setApiKey, setTempKey, setTavilyApiKey, setTempTavilyKey, setModel, setInstruction,
  getInitialApiKey, getInitialTavilyApiKey, getInitialModel, getInitialInstruction
} from './configSlice';

import {
  personas, activePersona, setPersonas, setActivePersona,
  getInitialPersonas, getInitialActivePersona
} from './personaSlice';

import {
  userMemos, memoTotalCount, memoCurrentPage, memoPageSize,
  setUserMemos, setMemoTotalCount, setMemoCurrentPage
} from './memoSlice';

import {
  agents, selectedAgentId, setAgents, setSelectedAgentId
} from './agentSlice';

import {
  sessions, sessionId, messages,
  setSessions, setSessionId, setMessages,
  getInitialSessions, getInitialSessionId
} from './chatSlice';

import type { Persona, Message, ChatSession } from './types';
import { DEFAULT_PERSONAS } from './types';

// Re-exports
export * from './types';
export {
  authUsername, authRole, authAvatar, getAuthKey, authFetch,
  setAuthUsername, setAuthRole, setAuthAvatar,
  currentTab, loading, errorMessage, userInput,
  setCurrentTab, setLoading, setErrorMessage, setUserInput,
  scrollerRef, setScrollerRef, scrollToBottom,
  apiKey, tempKey, tavilyApiKey, tempTavilyKey, model, instruction,
  setApiKey, setTempKey, setTavilyApiKey, setTempTavilyKey, setModel, setInstruction,
  personas, activePersona, setPersonas, setActivePersona,
  userMemos, memoTotalCount, memoCurrentPage, memoPageSize,
  setUserMemos, setMemoTotalCount, setMemoCurrentPage,
  agents, selectedAgentId, setAgents, setSelectedAgentId,
  sessions, sessionId, messages,
  setSessions, setSessionId, setMessages
};

// Fetchers
export const fetchMemos = async (page: number = 1) => {
  const user = authUsername();
  if (!user) return;
  const persona = activePersona() ? activePersona().name : '';
  try {
    const res = await authFetch(`/api/memos?page=${page}&limit=${memoPageSize}&persona=${encodeURIComponent(persona)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.memos)) {
        setUserMemos(data.memos);
        setMemoTotalCount(data.total || 0);
        setMemoCurrentPage(page);
      }
    }
  } catch (e) {
    console.error('Failed to fetch memos', e);
  }
};

export const fetchAgents = async () => {
  const user = authUsername();
  if (!user) return;
  try {
    const res = await authFetch('/api/agents');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setAgents(data);
      }
    }
  } catch (e) {
    console.error('Failed to fetch agents', e);
  }
};

// Persona Actions
export const switchPersona = (id: string) => {
  const found = personas().find(p => p.id === id);
  if (found) {
    setActivePersona(found);
    localStorage.setItem(getAuthKey('active_persona_id'), id);
    fetchMemos(1);
  }
};

export const addPersona = (name: string, role: 'admin' | 'user', avatar: string) => {
  const newPersona: Persona = {
    id: `u-${Date.now()}`,
    name,
    role,
    avatar
  };
  const updated = [...personas(), newPersona];
  setPersonas(updated);
  localStorage.setItem(getAuthKey('chat_personas'), JSON.stringify(updated));
  return newPersona;
};

export const deletePersona = (id: string) => {
  if (id === activePersona().id) {
    return false;
  }
  const updated = personas().filter(p => p.id !== id);
  setPersonas(updated);
  localStorage.setItem(getAuthKey('chat_personas'), JSON.stringify(updated));
  return true;
};

// Config Actions
export const saveConfiguration = (e: Event) => {
  e.preventDefault();
  const key = tempKey().trim();
  if (!key) {
    setErrorMessage('Please enter a valid API key.');
    return;
  }
  
  localStorage.setItem(getAuthKey('gemini_api_key'), key);
  localStorage.setItem(getAuthKey('gemini_model'), model());
  localStorage.setItem(getAuthKey('gemini_system_instruction'), instruction());
  
  const tavily = tempTavilyKey().trim();
  if (tavily) {
    localStorage.setItem(getAuthKey('tavily_api_key'), tavily);
  } else {
    localStorage.removeItem(getAuthKey('tavily_api_key'));
  }
  
  setApiKey(key);
  setTavilyApiKey(tavily);
  setErrorMessage('');
  setCurrentTab('chat');
};

export const clearApiKey = () => {
  localStorage.removeItem(getAuthKey('gemini_api_key'));
  setApiKey('');
  setTempKey('');
  setCurrentTab('settings');
};

export const clearTavilyApiKey = () => {
  localStorage.removeItem(getAuthKey('tavily_api_key'));
  setTavilyApiKey('');
  setTempTavilyKey('');
};

// Session Actions
export const selectSession = (id: string) => {
  setSessionId(id);
  localStorage.setItem(getAuthKey('active_session_id'), id);
  const savedMessages = localStorage.getItem(getAuthKey(`chat_history_${id}`));
  if (savedMessages) {
    try {
      setMessages(JSON.parse(savedMessages));
    } catch (e) {
      console.error('Failed to restore chat history', e);
      setMessages([]);
    }
  } else {
    setMessages([]);
  }
  setErrorMessage('');
  scrollToBottom();
};

export const createNewSession = () => {
  const newId = `session-${Date.now()}`;
  const newSession: ChatSession = {
    id: newId,
    title: '新しい会話',
    timestamp: Date.now()
  };
  const updatedSessions = [newSession, ...sessions()];
  setSessions(updatedSessions);
  localStorage.setItem(getAuthKey('chat_sessions'), JSON.stringify(updatedSessions));
  selectSession(newId);
};

export const deleteSession = (id: string) => {
  if (confirm('この会話履歴を削除してもよろしいですか？')) {
    localStorage.removeItem(getAuthKey(`chat_history_${id}`));
    
    const updatedSessions = sessions().filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem(getAuthKey('chat_sessions'), JSON.stringify(updatedSessions));

    if (sessionId() === id) {
      if (updatedSessions.length > 0) {
        selectSession(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  }
};

// Chat Actions
export const sendMessage = async (e: Event) => {
  e.preventDefault();
  
  const query = userInput().trim();
  if (!query) return;

  if (!apiKey()) {
    setErrorMessage('Please configure and save your Gemini API Key in the settings panel above first.');
    setCurrentTab('settings');
    return;
  }

  // Add user message to UI
  const userMsgId = `msg-user-${Date.now()}`;
  const newUserMsg: Message = {
    id: userMsgId,
    role: 'user',
    text: query,
    timestamp: Date.now()
  };
  
  const updatedMessages = [...messages(), newUserMsg];
  setMessages(updatedMessages);
  setUserInput('');
  setErrorMessage('');
  setLoading(true);
  scrollToBottom();

  // Call API proxy
  try {
    let effectiveInstruction = instruction();
    const activeAgent = agents().find(a => a.id === selectedAgentId());
    if (activeAgent) {
      effectiveInstruction = activeAgent.systemPrompt;
    }

    const activePersonaName = activePersona() ? activePersona().name : 'admin';
    const agentName = activeAgent ? activeAgent.name : 'Global Default';

    const response = await authFetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: query,
        apiKey: apiKey(),
        tavilyApiKey: tavilyApiKey(),
        sessionId: sessionId(),
        instruction: effectiveInstruction,
        model: model(),
        activePersonaName,
        agentName
      })
    });

    let data: any = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data.error || `Server error (${response.status}): Ensure the backend server is running.`);
    }

    // Add assistant message to UI
    const assistantMsgId = `msg-assistant-${Date.now()}`;
    const newAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      text: data.response || 'No response returned from the agent.',
      timestamp: Date.now()
    };

    const finalMessages = [...updatedMessages, newAssistantMsg];
    setMessages(finalMessages);
    
    // Save history
    localStorage.setItem(getAuthKey(`chat_history_${sessionId()}`), JSON.stringify(finalMessages));

    // Update session title if it is currently the default "新しい会話"
    const currentSession = sessions().find(s => s.id === sessionId());
    if (currentSession && currentSession.title === '新しい会話') {
      const titleText = query.length > 25 ? `${query.substring(0, 25)}...` : query;
      const updatedSessions = sessions().map(s => {
        if (s.id === sessionId()) {
          return { ...s, title: titleText };
        }
        return s;
      });
      setSessions(updatedSessions);
      localStorage.setItem(getAuthKey('chat_sessions'), JSON.stringify(updatedSessions));
    }
    
  } catch (err: any) {
    console.error('Chat error:', err);
    setErrorMessage(err.message || 'Network error occurred. Ensure your local server is running.');
  } finally {
    setLoading(false);
    scrollToBottom();
  }
};

// Initializer
export const initializeStateForUser = () => {
  const user = authUsername();
  if (!user) return;

  setApiKey(getInitialApiKey());
  setTempKey(getInitialApiKey());

  setTavilyApiKey(getInitialTavilyApiKey());
  setTempTavilyKey(getInitialTavilyApiKey());

  setModel(getInitialModel());
  setInstruction(getInitialInstruction());

  const loadedPersonas = getInitialPersonas();
  setPersonas(loadedPersonas);
  
  const activeP = getInitialActivePersona(loadedPersonas);
  setActivePersona(activeP);

  setSelectedAgentId(localStorage.getItem(getAuthKey('active_agent_id')) || '');

  // Reset currentTab
  setCurrentTab(localStorage.getItem(getAuthKey('gemini_api_key')) ? 'chat' : 'settings');

  // Load chat sessions
  const loadedSessions = getInitialSessions();
  setSessions(loadedSessions);

  const actSessId = getInitialSessionId(loadedSessions);
  setSessionId(actSessId);

  // Restore messages
  const savedMessages = localStorage.getItem(getAuthKey(`chat_history_${actSessId}`));
  if (savedMessages) {
    try {
      setMessages(JSON.parse(savedMessages));
    } catch (e) {
      setMessages([]);
    }
  } else {
    setMessages([]);
  }

  fetchMemos();
  fetchAgents();
};

// Auth Actions
export const loginUser = async (username: string, pw: string) => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pw })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Set signals and storage
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_username', data.user.username);
    localStorage.setItem('auth_role', data.user.role);
    localStorage.setItem('auth_avatar', data.user.avatar);
    setAuthUsername(data.user.username);
    setAuthRole(data.user.role);
    setAuthAvatar(data.user.avatar);

    // Initialize user's local workspace
    initializeStateForUser();
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const registerUser = async (username: string, pw: string, avatar: string = '👤') => {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pw, role: 'user', avatar })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

export const logoutUser = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_username');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_avatar');
  setAuthUsername(null);
  setAuthRole(null);
  setAuthAvatar(null);
  
  // Clear frontend runtime state
  setPersonas(DEFAULT_PERSONAS);
  setActivePersona(DEFAULT_PERSONAS[0]);
  setSessions([]);
  setSessionId('');
  setMessages([]);
  setUserMemos([]);
  setAgents([]);
  setApiKey('');
  setTavilyApiKey('');
};

// Initialize if logged in on startup
if (authUsername()) {
  initializeStateForUser();
}
