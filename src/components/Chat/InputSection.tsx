import { Show } from 'solid-js';
import {
  errorMessage,
  setErrorMessage,
  apiKey,
  userInput,
  setUserInput,
  loading,
  sendMessage
} from '../../store/appState';

export function InputSection() {
  return (
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
  );
}
