import { createSignal } from 'solid-js';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string;
}

const DEFAULT_USERS: User[] = [
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

// Initial Persona and Session loaders
const getInitialUsers = (): User[] => {
  const saved = localStorage.getItem(getAuthKey('chat_users'));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse users', e);
    }
  }
  const defaultPersonas: User[] = [];
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
    defaultPersonas.push(...DEFAULT_USERS);
  }
  localStorage.setItem(getAuthKey('chat_users'), JSON.stringify(defaultPersonas));
  return defaultPersonas;
};

const getInitialActiveUser = (initialUsers: User[]): User => {
  const savedId = localStorage.getItem(getAuthKey('active_user_id'));
  if (savedId) {
    const found = initialUsers.find(u => u.id === savedId);
    if (found) return found;
  }
  const fallback = initialUsers[0] || DEFAULT_USERS[0];
  localStorage.setItem(getAuthKey('active_user_id'), fallback.id);
  return fallback;
};

const initialUsers = getInitialUsers();
const initialActiveUser = getInitialActiveUser(initialUsers);

export const [users, setUsers] = createSignal<User[]>(initialUsers);
export const [activeUser, setActiveUser] = createSignal<User>(initialActiveUser);

export const switchUser = (id: string) => {
  const found = users().find(u => u.id === id);
  if (found) {
    setActiveUser(found);
    localStorage.setItem(getAuthKey('active_user_id'), id);
  }
};

export const addUser = (name: string, role: 'admin' | 'user', avatar: string) => {
  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    role,
    avatar
  };
  const updated = [...users(), newUser];
  setUsers(updated);
  localStorage.setItem(getAuthKey('chat_users'), JSON.stringify(updated));
  return newUser;
};

export const deleteUser = (id: string) => {
  if (id === activeUser().id) {
    return false;
  }
  const updated = users().filter(u => u.id !== id);
  setUsers(updated);
  localStorage.setItem(getAuthKey('chat_users'), JSON.stringify(updated));
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
export const fetchMemos = async () => {
  const user = authUsername();
  if (!user) return;
  try {
    const res = await fetch('/api/memos', {
      headers: { 'X-User-Identity': user }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setUserMemos(data);
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
    const res = await fetch('/api/agents', {
      headers: { 'X-User-Identity': user }
    });
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

  const loadedUsers = getInitialUsers();
  setUsers(loadedUsers);
  
  const activeP = getInitialActiveUser(loadedUsers);
  setActiveUser(activeP);

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

    const user = authUsername() || '';

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Identity': user
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
  localStorage.removeItem('auth_username');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_avatar');
  setAuthUsername(null);
  setAuthRole(null);
  setAuthAvatar(null);
  
  // Clear frontend runtime state
  setUsers(DEFAULT_USERS);
  setActiveUser(DEFAULT_USERS[0]);
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
