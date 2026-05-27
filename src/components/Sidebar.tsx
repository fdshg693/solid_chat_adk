import { For } from 'solid-js';
import {
  model,
  userMemos,
  setUserMemos,
  type UserMemo,
  sessions,
  sessionId,
  selectSession,
  deleteSession,
  messages
} from '../store/appState';

export function Sidebar() {
  const addMemo = async () => {
    const newMemo: UserMemo = { id: `memo-${Date.now()}`, title: `New Memo ${userMemos().length + 1}`, content: '' };
    const updated = [...userMemos(), newMemo];
    setUserMemos(updated);
    
    try {
      await fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemo)
      });
    } catch (e) {
      console.error(e);
    }
  };

  let saveTimeouts: Record<string, number> = {};

  const saveToBackend = (id: string, title: string, content: string) => {
    if (saveTimeouts[id]) clearTimeout(saveTimeouts[id]);
    saveTimeouts[id] = window.setTimeout(() => {
      fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      }).catch(e => console.error(e));
    }, 500);
  };

  const updateMemoTitle = (id: string, title: string) => {
    const memo = userMemos().find(m => m.id === id);
    if (!memo) return;
    const updated = userMemos().map(m => m.id === id ? { ...m, title } : m);
    setUserMemos(updated);
    saveToBackend(id, title, memo.content);
  };

  const updateMemoContent = (id: string, content: string) => {
    const memo = userMemos().find(m => m.id === id);
    if (!memo) return;
    const updated = userMemos().map(m => m.id === id ? { ...m, content } : m);
    setUserMemos(updated);
    saveToBackend(id, memo.title, content);
  };

  const deleteMemo = async (id: string) => {
    const updated = userMemos().filter(m => m.id !== id);
    setUserMemos(updated);
    try {
      await fetch(`/api/memos/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
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

      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="sidebar-title" style="margin: 0;">📝 ユーザーメモ</h3>
          <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onClick={addMemo}>+ 追加</button>
        </div>
        <div class="sidebar-sessions-list" style="max-height: 300px; overflow-y: auto;">
          <For each={userMemos()}>
            {(memo) => (
              <div class="sidebar-card" style="margin-bottom: 0.5rem; padding: 0.5rem; display: flex; flex-direction: column; gap: 0.3rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <input
                    type="text"
                    class="input-text"
                    style="flex: 1; margin-right: 0.5rem; padding: 0.2rem 0.4rem; font-size: 0.8rem;"
                    value={memo.title}
                    placeholder="メモのタイトル..."
                    onInput={(e) => updateMemoTitle(memo.id, e.currentTarget.value)}
                  />
                  <button
                    class="btn-delete-session"
                    onClick={() => deleteMemo(memo.id)}
                    title="メモを削除"
                  >
                    🗑️
                  </button>
                </div>
                <textarea
                  class="input-text"
                  rows={3}
                  style="resize: vertical; width: 100%; box-sizing: border-box; font-size: 0.8rem; padding: 0.4rem;"
                  placeholder="メモの内容..."
                  value={memo.content}
                  onInput={(e) => updateMemoContent(memo.id, e.currentTarget.value)}
                />
              </div>
            )}
          </For>
        </div>
      </div>

      <div>
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
