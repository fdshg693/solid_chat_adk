import { Show } from 'solid-js';
import { 
  apiKey, 
  tavilyApiKey, 
  currentTab,
  setCurrentTab,
  activePersona,
  authUsername,
  authAvatar,
  logoutUser
} from '../store/appState';
import './Header.css';

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

      <div class="tab-navigation">
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
        {/* Authenticated Identity Badge */}
        <div 
          class="user-badge header-identity-badge"
          title="ログイン中の認証ユーザー名 (Identity)"
        >
          <span>{authAvatar() || '👤'}</span>
          <span class="header-identity-badge-name">{authUsername()}</span>
          <span class="header-identity-badge-tag">ID</span>
        </div>

        {/* Active Persona Badge */}
        <div 
          class="user-badge header-persona-badge"
          onClick={() => setCurrentTab('settings')}
          title="アクティブペルソナ (Persona) 設定へ"
        >
          <span>{activePersona().avatar}</span>
          <span class="header-persona-badge-name">{activePersona().name}</span>
          <span class="header-persona-badge-tag">PERSONA</span>
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

        {/* Logout Button */}
        <button
          type="button"
          class="btn-glass header-logout-btn"
          onClick={() => { if (confirm('ログアウトしますか？')) logoutUser(); }}
          title="ログアウトする"
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );
}
