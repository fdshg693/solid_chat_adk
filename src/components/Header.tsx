import { Show } from 'solid-js';
import { 
  apiKey, 
  tavilyApiKey, 
  createNewSession,
  currentTab,
  setCurrentTab
} from '../store/appState';

export function Header() {
  return (
    <header class="header-bar">
      <div class="brand-section">
        <div class="brand-logo">U</div>
        <div>
          <h1 class="brand-title">Ultraviolet Chat</h1>
          <p class="brand-tagline">@google/adk Agent MVP</p>
        </div>
      </div>

      <div class="tab-navigation" style="display: flex; gap: 0.75rem; align-items: center;">
        <button
          class={`btn-glass ${currentTab() === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentTab('chat')}
        >
          💬 Chat
        </button>
        <button
          class={`btn-glass ${currentTab() === 'agents' ? 'active' : ''}`}
          onClick={() => setCurrentTab('agents')}
        >
          🤖 Agents
        </button>
        <button
          class={`btn-glass ${currentTab() === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div class="action-buttons">
        {/* API key status indicator badge */}
        <Show
          when={apiKey()}
          fallback={<span class="api-key-badge missing">API Key Missing</span>}
        >
          <span class="api-key-badge saved">API Key Confirmed</span>
        </Show>
        <Show when={tavilyApiKey()}>
          <span class="api-key-badge saved">Tavily Active</span>
        </Show>
        
        <button
          class="btn-glass"
          onClick={createNewSession}
          title="新しいチャットを開始"
        >
          ➕ 新しいチャット
        </button>
      </div>
    </header>
  );
}
