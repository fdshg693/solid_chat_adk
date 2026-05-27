import { createSignal } from 'solid-js';

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

export const [apiKey, setApiKey] = createSignal(localStorage.getItem('gemini_api_key') || '');
export const [tempKey, setTempKey] = createSignal(localStorage.getItem('gemini_api_key') || '');

export const [tavilyApiKey, setTavilyApiKey] = createSignal(localStorage.getItem('tavily_api_key') || '');
export const [tempTavilyKey, setTempTavilyKey] = createSignal(localStorage.getItem('tavily_api_key') || '');

export const [model, setModel] = createSignal(localStorage.getItem('gemini_model') || 'gemini-2.5-flash');

export const [instruction, setInstruction] = createSignal(
  localStorage.getItem('gemini_system_instruction') || 'You are a helpful and concise AI assistant. Address the user directly.'
);

export interface UserMemo {
  id: string;
  title: string;
  content: string;
}

export const [userMemos, setUserMemos] = createSignal<UserMemo[]>([]);

// Fetch initial memos from backend
fetch('/api/memos')
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data)) {
      setUserMemos(data);
    }
  })
  .catch(e => console.error('Failed to fetch initial memos', e));

export const [showSettings, setShowSettings] = createSignal(!localStorage.getItem('gemini_api_key'));
export const [userInput, setUserInput] = createSignal('');
export const [messages, setMessages] = createSignal<Message[]>([]);
export const [loading, setLoading] = createSignal(false);
export const [errorMessage, setErrorMessage] = createSignal('');

// Session handling helpers
export const getInitialSessions = (): ChatSession[] => {
  const saved = localStorage.getItem('chat_sessions');
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
  localStorage.setItem('chat_sessions', JSON.stringify(defaultSessions));
  localStorage.setItem('active_session_id', defaultSessionId);
  return defaultSessions;
};

export const getInitialSessionId = (initialSessions: ChatSession[]): string => {
  const savedActive = localStorage.getItem('active_session_id');
  if (savedActive && initialSessions.some(s => s.id === savedActive)) {
    return savedActive;
  }
  const fallbackId = initialSessions[0].id;
  localStorage.setItem('active_session_id', fallbackId);
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
  
  localStorage.setItem('gemini_api_key', key);
  localStorage.setItem('gemini_model', model());
  localStorage.setItem('gemini_system_instruction', instruction());
  
  const tavilyKey = tempTavilyKey().trim();
  if (tavilyKey) {
    localStorage.setItem('tavily_api_key', tavilyKey);
  } else {
    localStorage.removeItem('tavily_api_key');
  }
  
  setApiKey(key);
  setTavilyApiKey(tavilyKey);
  setErrorMessage('');
  setShowSettings(false);
};

// Action: Clear active key
export const clearApiKey = () => {
  localStorage.removeItem('gemini_api_key');
  setApiKey('');
  setTempKey('');
  setShowSettings(true);
};

export const clearTavilyApiKey = () => {
  localStorage.removeItem('tavily_api_key');
  setTavilyApiKey('');
  setTempTavilyKey('');
};

// Action: Select another chat session
export const selectSession = (id: string) => {
  setSessionId(id);
  localStorage.setItem('active_session_id', id);
  const savedMessages = localStorage.getItem(`chat_history_${id}`);
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
  localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
  selectSession(newId);
};

// Action: Delete a session
export const deleteSession = (id: string) => {
  if (confirm('この会話履歴を削除してもよろしいですか？')) {
    localStorage.removeItem(`chat_history_${id}`);
    
    const updatedSessions = sessions().filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));

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
    setShowSettings(true);
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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: query,
        apiKey: apiKey(),
        tavilyApiKey: tavilyApiKey(),
        sessionId: sessionId(),
        instruction: instruction(),
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
    localStorage.setItem(`chat_history_${sessionId()}`, JSON.stringify(finalMessages));

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
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    }
    
  } catch (err: any) {
    console.error('Chat error:', err);
    setErrorMessage(err.message || 'Network error occurred. Ensure your local server is running.');
  } finally {
    setLoading(false);
    scrollToBottom();
  }
};
