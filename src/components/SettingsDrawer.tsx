import { Show } from 'solid-js';
import {
  apiKey,
  tavilyApiKey,
  tempKey,
  setTempKey,
  tempTavilyKey,
  setTempTavilyKey,
  model,
  setModel,
  instruction,
  setInstruction,
  saveConfiguration,
  clearApiKey,
  clearTavilyApiKey,
  setCurrentTab
} from '../store/appState';

export function SettingsView() {
  return (
    <div class="settings-view">
      <form class="settings-content" onSubmit={saveConfiguration}>
        <h2 style="font-family: var(--font-family-display); font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; font-weight: 700;">
          ⚙️ App Configuration
        </h2>
        
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
            <label class="settings-label">
              Tavily API Key (Optional)
              <span class="settings-info">(Enable Tavily web search)</span>
            </label>
            <div style="display: flex; gap: 0.5rem; width: 100%;">
              <input
                type="password"
                class="input-text"
                placeholder="tvly-..."
                value={tempTavilyKey()}
                onInput={(e) => setTempTavilyKey(e.currentTarget.value)}
              />
              <Show when={tavilyApiKey()}>
                <button type="button" class="btn-glass" onClick={clearTavilyApiKey} style="color: var(--color-error); border-color: rgba(239,68,68,0.2);">
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
            rows={4}
            style="resize: none;"
            placeholder="You are a helpful AI assistant..."
            value={instruction()}
            onInput={(e) => setInstruction(e.currentTarget.value)}
          />
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center; margin-top: 1rem;">
          <Show when={apiKey()}>
            <button type="button" class="btn-glass" onClick={() => setCurrentTab('chat')}>
              Cancel
            </button>
          </Show>
          <button type="submit" class="btn-primary">
            💾 Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
