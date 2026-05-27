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
  messages,
  agents,
  selectedAgentId,
  setSelectedAgentId,
  setShowAgentManager
} from '../store/appState';

export function Sidebar() {
  const addMemo = async () => {
    const newMemo: UserMemo = { 
      id: `memo-${Date.now()}`, 
      title: `New Memo ${userMemos().length + 1}`, 
      content: '',
      creator: 'user',
      updater: 'user',
      targetAudiences: []
    };
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

  const saveToBackend = (memo: UserMemo) => {
    if (saveTimeouts[memo.id]) clearTimeout(saveTimeouts[memo.id]);
    saveTimeouts[memo.id] = window.setTimeout(() => {
      fetch(`/api/memos/${memo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memo)
      }).catch(e => console.error(e));
    }, 500);
  };

  const updateMemoField = (id: string, updates: Partial<UserMemo>) => {
    const memo = userMemos().find(m => m.id === id);
    if (!memo) return;
    const updated = { ...memo, ...updates, updater: 'user' };
    setUserMemos(userMemos().map(m => m.id === id ? updated : m));
    saveToBackend(updated);
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h3 class="sidebar-title" style="margin: 0;">🤖 Active Agent</h3>
          <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onClick={() => setShowAgentManager(true)}>Manage</button>
        </div>
        <div class="sidebar-card">
          <div class="sidebar-info-row" style="margin-bottom: 0.5rem;">
            <select
              class="input-text"
              style="width: 100%; font-size: 0.8rem; padding: 0.3rem; background: var(--bg-dark); color: var(--text-bright); border: 1px solid var(--border-color); border-radius: 4px;"
              value={selectedAgentId()}
              onChange={(e) => {
                const newId = e.currentTarget.value;
                setSelectedAgentId(newId);
                localStorage.setItem('active_agent_id', newId);
              }}
            >
              <option value="">Global Default</option>
              <For each={agents()}>
                {(agent) => <option value={agent.id}>{agent.name}</option>}
              </For>
            </select>
          </div>
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
                    onInput={(e) => updateMemoField(memo.id, { title: e.currentTarget.value })}
                  />
                  <button
                    class="btn-delete-session"
                    onClick={() => deleteMemo(memo.id)}
                    title="メモを削除"
                  >
                    🗑️
                  </button>
                </div>
                <div style="display: flex; gap: 0.2rem; font-size: 0.7rem;">
                  <div style="flex: 1; display: flex; flex-direction: column;">
                    <label style="color: var(--text-muted); margin-bottom: 0.1rem;">作成者</label>
                    <select
                      class="input-text"
                      style="padding: 0.1rem 0.2rem; font-size: 0.7rem; background: var(--bg-dark); color: var(--text-bright);"
                      value={memo.creator || 'user'}
                      onChange={(e) => updateMemoField(memo.id, { creator: e.currentTarget.value })}
                    >
                      <option value="user">User</option>
                      <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                    </select>
                  </div>
                  <div style="flex: 1; display: flex; flex-direction: column;">
                    <label style="color: var(--text-muted); margin-bottom: 0.1rem;">更新者</label>
                    <select
                      class="input-text"
                      style="padding: 0.1rem 0.2rem; font-size: 0.7rem; background: var(--bg-dark); color: var(--text-bright);"
                      value={memo.updater || 'user'}
                      onChange={(e) => updateMemoField(memo.id, { updater: e.currentTarget.value })}
                    >
                      <option value="user">User</option>
                      <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                    </select>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; font-size: 0.7rem;">
                  <label style="color: var(--text-muted); margin-bottom: 0.1rem;">対象者 (複数選択可)</label>
                  <select
                    class="input-text"
                    multiple
                    style="padding: 0.2rem; font-size: 0.7rem; background: var(--bg-dark); color: var(--text-bright); height: 40px;"
                    value={memo.targetAudiences || []}
                    onChange={(e) => {
                      const selected = Array.from(e.currentTarget.selectedOptions).map(o => o.value);
                      updateMemoField(memo.id, { targetAudiences: selected });
                    }}
                  >
                    <option value="user">User</option>
                    <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                  </select>
                </div>
                <textarea
                  class="input-text"
                  rows={3}
                  style="resize: vertical; width: 100%; box-sizing: border-box; font-size: 0.8rem; padding: 0.4rem;"
                  placeholder="メモの内容..."
                  value={memo.content}
                  onInput={(e) => updateMemoField(memo.id, { content: e.currentTarget.value })}
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
