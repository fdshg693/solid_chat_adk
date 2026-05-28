import { Show } from 'solid-js';
import { apiKey, setCurrentTab } from '../../store/appState';

export function WelcomeScreen() {
  return (
    <div class="welcome-screen">
      <div class="welcome-logo">🌌</div>
      <h2 class="welcome-title">Welcome to Ultraviolet</h2>
      <p class="welcome-desc">
        This chat MVP demonstrates SolidJS running a local Node-backed `@google/adk` LlmAgent. 
        Enter your API key to start chat.
      </p>
      <Show when={!apiKey()}>
        <button class="btn-primary" onClick={() => setCurrentTab('settings')}>
          ⚙️ Setup API Key
        </button>
      </Show>
    </div>
  );
}
