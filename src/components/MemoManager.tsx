import { For, createSignal } from 'solid-js';
import {
  userMemos,
  setUserMemos,
  type UserMemo,
  agents,
} from '../store/appState';

export function MemoManager() {
  // New Memo form states
  const [newTitle, setNewTitle] = createSignal('');
  const [newContent, setNewContent] = createSignal('');
  const [newCreator, setNewCreator] = createSignal('user');
  const [newUpdater, setNewUpdater] = createSignal('user');
  const [newTargetAudiences, setNewTargetAudiences] = createSignal<string[]>([]);

  // Debounced auto-save map
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
    if (!confirm('このメモを削除してもよろしいですか？')) return;
    const updated = userMemos().filter(m => m.id !== id);
    setUserMemos(updated);
    try {
      await fetch(`/api/memos/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const createMemo = async () => {
    if (!newTitle().trim()) return;
    const newMemo: UserMemo = {
      id: `memo-${Date.now()}`,
      title: newTitle().trim(),
      content: newContent().trim(),
      creator: newCreator(),
      updater: newUpdater(),
      targetAudiences: newTargetAudiences()
    };
    
    // Add to state
    setUserMemos([...userMemos(), newMemo]);

    // Reset inputs
    setNewTitle('');
    setNewContent('');
    setNewCreator('user');
    setNewUpdater('user');
    setNewTargetAudiences([]);

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

  // Helper to toggle audience in new memo state
  const toggleNewAudience = (name: string) => {
    const current = newTargetAudiences();
    if (current.includes(name)) {
      setNewTargetAudiences(current.filter(x => x !== name));
    } else {
      setNewTargetAudiences([...current, name]);
    }
  };

  // Helper to toggle audience in existing memo
  const toggleExistingAudience = (id: string, name: string) => {
    const memo = userMemos().find(m => m.id === id);
    if (!memo) return;
    const current = memo.targetAudiences || [];
    const next = current.includes(name)
      ? current.filter(x => x !== name)
      : [...current, name];
    updateMemoField(id, { targetAudiences: next });
  };

  return (
    <div class="agent-manager-view">
      <div class="agent-manager-content" style="max-width: 900px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin: 0; color: var(--text-primary); font-family: var(--font-family-display); font-size: 1.8rem;">📝 Memo Manager</h2>
        </div>

        {/* Create New Memo Section */}
        <div style="margin-bottom: 2.5rem; background: rgba(27, 30, 48, 0.2); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;">
          <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-family: var(--font-family-display); font-size: 1.2rem;">Create New Memo</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            
            {/* Grid for creator/updater/audiences */}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Title</label>
                <input
                  type="text"
                  class="input-text"
                  placeholder="Memo Title"
                  value={newTitle()}
                  onInput={(e) => setNewTitle(e.currentTarget.value)}
                />
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Creator</label>
                <select
                  class="input-text"
                  style="background: var(--bg-dark); color: var(--text-bright);"
                  value={newCreator()}
                  onChange={(e) => setNewCreator(e.currentTarget.value)}
                >
                  <option value="user">User</option>
                  <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Updater</label>
                <select
                  class="input-text"
                  style="background: var(--bg-dark); color: var(--text-bright);"
                  value={newUpdater()}
                  onChange={(e) => setNewUpdater(e.currentTarget.value)}
                >
                  <option value="user">User</option>
                  <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                </select>
              </div>

            </div>

            {/* Checklist for Multi-Select Target Audiences */}
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Target Audiences (Multiple Select)</label>
              <div class="checklist-group">
                <label class="checklist-item">
                  <input
                    type="checkbox"
                    checked={newTargetAudiences().includes('user')}
                    onChange={() => toggleNewAudience('user')}
                  />
                  <span>User</span>
                </label>
                <For each={agents()}>
                  {(a) => (
                    <label class="checklist-item">
                      <input
                        type="checkbox"
                        checked={newTargetAudiences().includes(a.name)}
                        onChange={() => toggleNewAudience(a.name)}
                      />
                      <span>{a.name}</span>
                    </label>
                  )}
                </For>
              </div>
            </div>

            {/* Textarea for Content */}
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Content</label>
              <textarea
                class="input-text"
                rows={4}
                placeholder="Write your memo content here..."
                value={newContent()}
                onInput={(e) => setNewContent(e.currentTarget.value)}
                style="resize: vertical;"
              />
            </div>

            <button 
              class="btn-primary" 
              onClick={createMemo} 
              disabled={!newTitle().trim()}
              style="align-self: flex-start;"
            >
              Create Memo
            </button>
          </div>
        </div>

        {/* Existing Memos Section */}
        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <h3 style="color: var(--text-primary); margin-bottom: 1.2rem; font-family: var(--font-family-display); font-size: 1.4rem;">Existing Memos</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
            <For each={userMemos()}>
              {(memo) => (
                <div class="sidebar-card" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: rgba(18, 20, 32, 0.5); border: 1px solid rgba(124, 58, 237, 0.15);">
                  
                  {/* Title & Delete button */}
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <input
                      type="text"
                      class="input-text"
                      style="font-weight: 600; font-size: 0.95rem; padding: 0.35rem 0.6rem; border-color: rgba(255,255,255,0.05);"
                      value={memo.title}
                      placeholder="Memo Title..."
                      onInput={(e) => updateMemoField(memo.id, { title: e.currentTarget.value })}
                    />
                    <button
                      class="btn-delete-session"
                      onClick={() => deleteMemo(memo.id)}
                      title="Delete Memo"
                      style="padding: 4px;"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Creator / Updater selects */}
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                      <label style="font-size: 0.7rem; color: var(--text-muted);">Creator</label>
                      <select
                        class="input-text"
                        style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--bg-dark); color: var(--text-bright);"
                        value={memo.creator || 'user'}
                        onChange={(e) => updateMemoField(memo.id, { creator: e.currentTarget.value })}
                      >
                        <option value="user">User</option>
                        <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                      </select>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                      <label style="font-size: 0.7rem; color: var(--text-muted);">Updater</label>
                      <select
                        class="input-text"
                        style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--bg-dark); color: var(--text-bright);"
                        value={memo.updater || 'user'}
                        onChange={(e) => updateMemoField(memo.id, { updater: e.currentTarget.value })}
                      >
                        <option value="user">User</option>
                        <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
                      </select>
                    </div>
                  </div>

                  {/* Target Audiences checklist */}
                  <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <label style="font-size: 0.7rem; color: var(--text-muted);">Target Audiences</label>
                    <div class="checklist-group" style="max-height: 80px; padding: 0.5rem;">
                      <label class="checklist-item">
                        <input
                          type="checkbox"
                          checked={(memo.targetAudiences || []).includes('user')}
                          onChange={() => toggleExistingAudience(memo.id, 'user')}
                        />
                        <span style="font-size: 0.75rem;">User</span>
                      </label>
                      <For each={agents()}>
                        {(a) => (
                          <label class="checklist-item">
                            <input
                              type="checkbox"
                              checked={(memo.targetAudiences || []).includes(a.name)}
                              onChange={() => toggleExistingAudience(memo.id, a.name)}
                            />
                            <span style="font-size: 0.75rem;">{a.name}</span>
                          </label>
                        )}
                      </For>
                    </div>
                  </div>

                  {/* Content textarea */}
                  <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <label style="font-size: 0.7rem; color: var(--text-muted);">Content</label>
                    <textarea
                      class="input-text"
                      rows={3}
                      style="resize: vertical; font-size: 0.85rem; padding: 0.5rem;"
                      placeholder="Content..."
                      value={memo.content}
                      onInput={(e) => updateMemoField(memo.id, { content: e.currentTarget.value })}
                    />
                  </div>

                </div>
              )}
            </For>

            {userMemos().length === 0 && (
              <div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; grid-column: 1 / -1; padding: 2rem;">
                No memos created yet. Use the form above to add a new memo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
