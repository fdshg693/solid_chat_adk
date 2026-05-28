import { For } from 'solid-js';
import {
  model,
  sessions,
  sessionId,
  selectSession,
  deleteSession,
  messages,
  createNewSession,
} from '../store/appState';

export function Sidebar() {


  return (
    <aside class="sidebar-panel">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h3 class="sidebar-title" style="margin: 0;">🤖 Active Agent</h3>
        </div>
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
        <button
          class="btn-glass"
          onClick={createNewSession}
          title="新しいチャットを開始"
          style="width: 100%; justify-content: center; margin-bottom: 1rem; font-weight: 600;"
        >
          ➕ 新しいチャット
        </button>
        <h3 class="sidebar-title">💬 会話履歴</h3>
        <div class="sidebar-sessions-list">
          <For each={sessions()}>
            {(sessionItem) => (
              <div
                class={`session-list-item ${sessionItem.id === sessionId() ? 'active' : ''}`}
                onClick={() => selectSession(sessionItem.id)}
              >
                <span class="session-item-title" title={sessionItem.title}>
                  {sessionItem.title}
                </span>
                <button
                  class="btn-delete-session"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(sessionItem.id);
                  }}
                  title="会話を削除"
                >
                  🗑️
                </button>
              </div>
            )}
          </For>
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
        This chat runs an unmodified <strong>LlmAgent</strong> orchestrated by a <strong>Runner</strong> (with <strong>InMemorySessionService</strong>) using the <strong>Agent Development Kit</strong>.
      </div>
    </aside>
  );
}
