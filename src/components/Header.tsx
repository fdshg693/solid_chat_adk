import { Show } from 'solid-js';
import { 
  apiKey, 
  tavilyApiKey, 
  showSettings, 
  setShowSettings, 
  createNewSession 
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

      <div class="action-buttons">
        {/* API key status indicator badge */}
        <Show
          when={apiKey()}
          fallback={<span class="api-key-badge missing">API Key Missing</span>}
        >
          <span class="api-key-badge saved">API Key Confirmed</span>
        </Show>
        <Show when={tavilyApiKey()}>
          <span class="api-key-badge saved" style="margin-left: 8px;">Tavily Active</span>
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
          onClick={createNewSession}
          title="新しいチャットを開始"
        >
          ➕ 新しいチャット
        </button>
      </div>
    </header>
  );
}
