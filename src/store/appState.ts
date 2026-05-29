import { createSignal } from 'solid-js';

export interface Persona {
  id: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string;
}

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'u-1', name: 'admin', role: 'admin', avatar: '👑' },
  { id: 'u-2', name: 'user1', role: 'user', avatar: '👤' }
];

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

// Initial Persona and Session loaders
const getInitialPersonas = (): Persona[] => {
  let saved = localStorage.getItem(getAuthKey('chat_personas'));
  let usingLegacy = false;
  if (!saved) {
    saved = localStorage.getItem(getAuthKey('chat_users'));
    usingLegacy = true;
  }
  
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (usingLegacy) {
          localStorage.setItem(getAuthKey('chat_personas'), saved);
          localStorage.removeItem(getAuthKey('chat_users'));
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse personas', e);
    }
  }
  const defaultPersonas: Persona[] = [];
  const name = authUsername();
  if (name) {
    defaultPersonas.push({
      id: 'u-1',
      name,
      role: (authRole() as 'admin' | 'user') || 'user',
      avatar: authAvatar() || '👤'
    });
    if (authRole() === 'admin') {
      defaultPersonas.push({ id: 'u-2', name: 'assistant', role: 'user', avatar: '🤖' });
    }
  } else {
    defaultPersonas.push(...DEFAULT_PERSONAS);
  }
  localStorage.setItem(getAuthKey('chat_personas'), JSON.stringify(defaultPersonas));
  return defaultPersonas;
};

const getInitialActivePersona = (initialP: Persona[]): Persona => {
  let savedId = localStorage.getItem(getAuthKey('active_persona_id'));
  let usingLegacy = false;
  if (!savedId) {
    savedId = localStorage.getItem(getAuthKey('active_user_id'));
    usingLegacy = true;
  }

  if (savedId) {
    const found = initialP.find(p => p.id === savedId);
    if (found) {
      if (usingLegacy) {
        localStorage.setItem(getAuthKey('active_persona_id'), savedId);
        localStorage.removeItem(getAuthKey('active_user_id'));
      }
      return found;
    }
  }
  const fallback = initialP[0] || DEFAULT_PERSONAS[0];
  localStorage.setItem(getAuthKey('active_persona_id'), fallback.id);
  return fallback;
};

const initialPersonas = getInitialPersonas();
const initialActivePersona = getInitialActivePersona(initialPersonas);

export const [personas, setPersonas] = createSignal<Persona[]>(initialPersonas);
export const [activePersona, setActivePersona] = createSignal<Persona>(initialActivePersona);

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

export const [apiKey, setApiKey] = createSignal(localStorage.getItem(getAuthKey('gemini_api_key')) || '');
export const [tempKey, setTempKey] = createSignal(localStorage.getItem(getAuthKey('gemini_api_key')) || '');

export const [tavilyApiKey, setTavilyApiKey] = createSignal(localStorage.getItem(getAuthKey('tavily_api_key')) || '');
export const [tempTavilyKey, setTempTavilyKey] = createSignal(localStorage.getItem(getAuthKey('tavily_api_key')) || '');

export const [model, setModel] = createSignal(localStorage.getItem(getAuthKey('gemini_model')) || 'gemini-2.5-flash');

export const [instruction, setInstruction] = createSignal(
  localStorage.getItem(getAuthKey('gemini_system_instruction')) || 'You are a helpful and concise AI assistant. Address the user directly.'
);

export interface UserMemo {
  id: string;
  title: string;
  content: string;
  creator?: string;
  updater?: string;
  targetAudiences?: string[];
}

export const [userMemos, setUserMemos] = createSignal<UserMemo[]>([]);
export const [memoTotalCount, setMemoTotalCount] = createSignal<number>(0);
export const [memoCurrentPage, setMemoCurrentPage] = createSignal<number>(1);
export const memoPageSize = 10;

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  avatar?: string;
}

export const [agents, setAgents] = createSignal<Agent[]>([]);
export const [selectedAgentId, setSelectedAgentId] = createSignal(localStorage.getItem(getAuthKey('active_agent_id')) || '');
export const [currentTab, setCurrentTab] = createSignal<'chat' | 'agents' | 'settings' | 'memos'>(
  localStorage.getItem(getAuthKey('gemini_api_key')) ? 'chat' : 'settings'
);

// Fetchers with Auth headers
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

// Initialize State dynamically for a user session
export const initializeStateForUser = () => {
  const user = authUsername();
  if (!user) return;

  setApiKey(localStorage.getItem(getAuthKey('gemini_api_key')) || '');
  setTempKey(localStorage.getItem(getAuthKey('gemini_api_key')) || '');

  setTavilyApiKey(localStorage.getItem(getAuthKey('tavily_api_key')) || '');
  setTempTavilyKey(localStorage.getItem(getAuthKey('tavily_api_key')) || '');

  setModel(localStorage.getItem(getAuthKey('gemini_model')) || 'gemini-2.5-flash');
  setInstruction(
    localStorage.getItem(getAuthKey('gemini_system_instruction')) || 
    'You are a helpful and concise AI assistant. Address the user directly.'
  );

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

export const [userInput, setUserInput] = createSignal('');
export const [messages, setMessages] = createSignal<Message[]>([]);
export const [loading, setLoading] = createSignal(false);
export const [errorMessage, setErrorMessage] = createSignal('');

// Session handling helpers
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

export let scrollerRef: HTMLDivElement | undefined;
export const setScrollerRef = (ref: HTMLDivElement | undefined) => { scrollerRef = ref; };

// Helper: Scroll container to bottom
export const scrollToBottom = () => {
  setTimeout(() => {
    if (scrollerRef) {
      scrollerRef.scrollTop = scrollerRef.scrollHeight;
    }
  }, 50);
};

// Action: Save API & model config
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
  
  const tavilyKey = tempTavilyKey().trim();
  if (tavilyKey) {
    localStorage.setItem(getAuthKey('tavily_api_key'), tavilyKey);
  } else {
    localStorage.removeItem(getAuthKey('tavily_api_key'));
  }
  
  setApiKey(key);
  setTavilyApiKey(tavilyKey);
  setErrorMessage('');
  setCurrentTab('chat');
};

// Action: Clear active key
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

// Action: Select another chat session
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

// Action: Start a brand new session
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

// Action: Delete a session
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

// Action: Send Query to backend Express proxy
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
        model: model()
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

// Authentication Actions
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
