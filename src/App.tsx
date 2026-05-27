import { createSignal, onMount, For, Show } from 'solid-js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

function App() {
  // Config & State Signals
  const [apiKey, setApiKey] = createSignal(localStorage.getItem('gemini_api_key') || '');
  const [tempKey, setTempKey] = createSignal(localStorage.getItem('gemini_api_key') || '');
  
  const [model, setModel] = createSignal(localStorage.getItem('gemini_model') || 'gemini-2.5-flash');
  
  const [instruction, setInstruction] = createSignal(
    localStorage.getItem('gemini_system_instruction') || 'You are a helpful and concise AI assistant. Address the user directly.'
  );
  
  const [showSettings, setShowSettings] = createSignal(!localStorage.getItem('gemini_api_key'));
  const [userInput, setUserInput] = createSignal('');
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal('');
  const [sessionId, setSessionId] = createSignal(`session-${Date.now()}`);
  
  let scrollerRef: HTMLDivElement | undefined;

  // Lifecycle
  onMount(() => {
    // Check if we have history saved locally for this session
    const savedMessages = localStorage.getItem(`chat_history_${sessionId()}`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
        scrollToBottom();
      } catch (e) {
        console.error('Failed to restore chat history', e);
      }
    }
  });

  // Helper: Scroll container to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollerRef) {
        scrollerRef.scrollTop = scrollerRef.scrollHeight;
      }
    }, 50);
  };

  // Action: Save API & model config
  const saveConfiguration = (e: Event) => {
    e.preventDefault();
    const key = tempKey().trim();
    if (!key) {
      setErrorMessage('Please enter a valid API key.');
      return;
    }
    
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model());
    localStorage.setItem('gemini_system_instruction', instruction());
    
    setApiKey(key);
    setErrorMessage('');
    setShowSettings(false);
  };

  // Action: Clear active key
  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setTempKey('');
    setShowSettings(true);
  };

  // Action: Reset entire chat session
  const resetSession = () => {
    if (confirm('Are you sure you want to reset this chat and start a new session?')) {
      localStorage.removeItem(`chat_history_${sessionId()}`);
      setSessionId(`session-${Date.now()}`);
      setMessages([]);
      setErrorMessage('');
    }
  };

  // Action: Send Query to backend Express proxy
  const sendMessage = async (e: Event) => {
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
      
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Network error occurred. Ensure your local server is running.');
      // Remove last user message if it failed to process (optional) or keep it with red color
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div class="app-container">
      {/* Background radial glows */}
      <div class="bg-glow-purple"></div>
      <div class="bg-glow-cyan"></div>

      {/* Header bar */}
      <header class="header-bar">
        <div class="brand-section">
          <div class="brand-logo">U</div>
          <div>
            <h1 class="brand-title">Ultraviolet Chat</h1>
            <p class="brand-tagline">@google/adk Agent MVP</p>
          </div>
        </div>

        <div class="action-buttons">
          {/* API key status indicator badge */}
          <Show
            when={apiKey()}
            fallback={<span class="api-key-badge missing">API Key Missing</span>}
          >
            <span class="api-key-badge saved">API Key Confirmed</span>
          </Show>

          <button
            class={`btn-glass ${showSettings() ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings())}
            title="Configure Agent & Key Settings"
          >
            ⚙️ Settings
          </button>
          
          <button
            class="btn-glass"
            onClick={resetSession}
            title="Reset Chat Session"
          >
            🔄 New Session
          </button>
        </div>
      </header>

      {/* Settings Drawer Panel */}
      <Show when={showSettings()}>
        <form class="settings-drawer" onSubmit={saveConfiguration}>
          <div class="settings-grid">
            <div class="settings-group">
              <label class="settings-label">
                Gemini API Key
                <span class="settings-info">(Stored only in your browser LocalStorage)</span>
              </label>
              <div style="display: flex; gap: 0.5rem; width: 100%;">
                <input
                  type="password"
                  class="input-text"
                  placeholder="AIzaSy..."
                  value={tempKey()}
                  onInput={(e) => setTempKey(e.currentTarget.value)}
                />
                <Show when={apiKey()}>
                  <button type="button" class="btn-glass" onClick={clearApiKey} style="color: var(--color-error); border-color: rgba(239,68,68,0.2);">
                    Clear
                  </button>
                </Show>
              </div>
            </div>

            <div class="settings-group">
              <label class="settings-label">Model Selection</label>
              <select
                class="settings-select"
                value={model()}
                onChange={(e) => setModel(e.currentTarget.value)}
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & recommended)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Intense reasoning)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Classic flash)</option>
              </select>
            </div>
          </div>

          <div class="settings-group">
            <label class="settings-label">
              Agent Instructions (System Prompt)
              <span class="settings-info">Instruct your @google/adk agent persona</span>
            </label>
            <textarea
              class="input-text"
              rows={2}
              style="resize: none;"
              placeholder="You are a helpful AI assistant..."
              value={instruction()}
              onInput={(e) => setInstruction(e.currentTarget.value)}
            />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
            <Show when={apiKey()}>
              <button type="button" class="btn-glass" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </Show>
            <button type="submit" class="btn-primary">
              💾 Save Configuration
            </button>
          </div>
        </form>
      </Show>

      {/* Main workspace */}
      <div class="chat-workspace">
        {/* Left Sidebar details */}
        <aside class="sidebar-panel">
          <div>
            <h3 class="sidebar-title">🤖 Active Agent</h3>
            <div class="sidebar-card">
              <div class="sidebar-info-row">
                <span>SDK</span>
                <span class="sidebar-info-val">@google/adk v1.1.0</span>
              </div>
              <div class="sidebar-info-row">
                <span>Model</span>
                <span class="sidebar-info-val" style="font-size: 0.72rem; word-break: break-all;">{model()}</span>
              </div>
              <div class="sidebar-info-row">
                <span>Type</span>
                <span class="sidebar-info-val">LlmAgent</span>
              </div>
            </div>
          </div>

          <div>
            <h3 class="sidebar-title">📊 Session Details</h3>
            <div class="sidebar-card">
              <div class="sidebar-info-row">
                <span>Session ID</span>
                <span class="sidebar-info-val" style="font-size: 0.65rem; word-break: break-all;">{sessionId().substring(0, 15)}...</span>
              </div>
              <div class="sidebar-info-row">
                <span>Messages</span>
                <span class="sidebar-info-val">{messages().length}</span>
              </div>
              <div class="sidebar-info-row">
                <span>Memory</span>
                <span class="sidebar-info-val">InMemory</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: auto; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4;">
            This chat runs an unmodified <strong>LlmAgent</strong> orchestrated by an <strong>InMemoryRunner</strong> using the <strong>Agent Development Kit</strong>.
          </div>
        </aside>

        {/* Right chat view */}
        <main class="chat-container">
          {/* Scrollable messages area */}
          <div class="messages-scroller" ref={scrollerRef}>
            <Show when={messages().length === 0}>
              <div class="welcome-screen">
                <div class="welcome-logo">🌌</div>
                <h2 class="welcome-title">Welcome to Ultraviolet</h2>
                <p class="welcome-desc">
                  This chat MVP demonstrates SolidJS running a local Node-backed `@google/adk` LlmAgent. 
                  Enter your API key above to start chat.
                </p>
                <Show when={!apiKey()}>
                  <button class="btn-primary" onClick={() => setShowSettings(true)}>
                    ⚙️ Setup API Key
                  </button>
                </Show>
              </div>
            </Show>

            {/* Render message list */}
            <For each={messages()}>
              {(msg) => (
                <div class={`message-row ${msg.role}`}>
                  <div class="message-bubble-wrapper">
                    <div class={`message-avatar ${msg.role}`}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div>
                      <div class="message-bubble">
                        <div style="white-space: pre-wrap;">{msg.text}</div>
                      </div>
                      <div class="message-meta">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </For>

            {/* Typing status indicator */}
            <Show when={loading()}>
              <div class="message-row assistant">
                <div class="message-bubble-wrapper">
                  <div class="message-avatar assistant">🤖</div>
                  <div>
                    <div class="message-bubble">
                      <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                      </div>
                    </div>
                    <div class="message-meta">
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer Input block */}
          <div class="input-section">
            <Show when={errorMessage()}>
              <div class="error-banner">
                <span>⚠️ {errorMessage()}</span>
                <button class="btn-close-error" onClick={() => setErrorMessage('')}>×</button>
              </div>
            </Show>

            <form class="input-wrapper" onSubmit={sendMessage}>
              <input
                type="text"
                class="chat-input"
                placeholder={apiKey() ? "Send a message to your agent..." : "Configure API Key in settings first..."}
                value={userInput()}
                disabled={loading()}
                onInput={(e) => setUserInput(e.currentTarget.value)}
              />
              <button
                type="submit"
                class="btn-send"
                disabled={!userInput().trim() || loading()}
              >
                ➡️
              </button>
            </form>
            
            <div class="input-footer-info">
              <span>Press Enter to send</span>
              <span>SolidJS + @google/adk MVP</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
