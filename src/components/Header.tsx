import { Show } from 'solid-js';
import { 
  apiKey, 
  tavilyApiKey, 
  currentTab,
  setCurrentTab,
  activeUser
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
          class={`btn-glass ${currentTab() === 'memos' ? 'active' : ''}`}
          onClick={() => setCurrentTab('memos')}
        >
          📝 Memos
        </button>
        <button
          class={`btn-glass ${currentTab() === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div class="action-buttons">
        {/* Active User Badge */}
        <div 
          class="user-badge"
          onClick={() => setCurrentTab('settings')}
          title="ユーザー設定・切り替えへ"
          style="margin-right: 0.25rem;"
        >
          <span>{activeUser().avatar}</span>
          <span style="font-weight: 600;">{activeUser().name}</span>
        </div>

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
      </div>
    </header>
  );
}
