import { Show } from 'solid-js';
import { 
  apiKey, 
  tavilyApiKey, 
  currentTab,
  setCurrentTab,
  activeUser,
  authUsername,
  authAvatar,
  logoutUser
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

      <div class="action-buttons" style="display: flex; gap: 0.5rem; align-items: center;">
        {/* Authenticated Identity Badge */}
        <div 
          class="user-badge"
          style="background: rgba(6,182,212,0.15); border-color: rgba(6,182,212,0.3); color: #22d3ee; margin: 0;"
          title="ログイン中の認証ユーザー名 (Identity)"
        >
          <span>{authAvatar() || '👤'}</span>
          <span style="font-weight: 700; color: #fff;">{authUsername()}</span>
          <span style="font-size: 0.65rem; background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; margin-left: 0.35rem; font-weight: 900; letter-spacing: 0.5px;">ID</span>
        </div>

        {/* Active Persona Badge */}
        <div 
          class="user-badge"
          onClick={() => setCurrentTab('settings')}
          title="アクティブペルソナ (Persona) 設定へ"
          style="margin: 0; cursor: pointer;"
        >
          <span>{activeUser().avatar}</span>
          <span style="font-weight: 600;">{activeUser().name}</span>
          <span style="font-size: 0.65rem; background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; margin-left: 0.35rem; font-weight: 900; color: var(--color-primary); letter-spacing: 0.5px;">PERSONA</span>
        </div>

        {/* API key status indicator badge */}
        <Show
          when={apiKey()}
          fallback={<span class="api-key-badge missing" style="margin: 0;">API Key Missing</span>}
        >
          <span class="api-key-badge saved" style="margin: 0;">API Key Confirmed</span>
        </Show>
        <Show when={tavilyApiKey()}>
          <span class="api-key-badge saved" style="margin: 0;">Tavily Active</span>
        </Show>

        {/* Logout Button */}
        <button
          type="button"
          class="btn-glass"
          onClick={() => { if (confirm('ログアウトしますか？')) logoutUser(); }}
          style="color: var(--color-error); border-color: rgba(239,68,68,0.2); font-weight: 600; margin: 0; padding: 0.4rem 0.8rem; font-size: 0.82rem;"
          title="ログアウトする"
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );
}
