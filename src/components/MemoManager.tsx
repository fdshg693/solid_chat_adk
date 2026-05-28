import { Index } from 'solid-js';
import {
  userMemos,
  setUserMemos,
  activeUser,
  type UserMemo,
} from '../store/appState';
import { CreateMemoForm } from './Memo/CreateMemoForm';
import { MemoCard } from './Memo/MemoCard';

export function MemoManager() {
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
    const updated = { ...memo, ...updates, updater: activeUser() ? activeUser().name : 'admin' };
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

  const createMemo = async (memoData: {
    title: string;
    content: string;
    creator: string;
    updater: string;
    targetAudiences: string[];
  }) => {
    const newMemo: UserMemo = {
      id: `memo-${Date.now()}`,
      ...memoData
    };
    
    // Add to state
    setUserMemos([...userMemos(), newMemo]);

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
        <CreateMemoForm onCreate={createMemo} />

        {/* Existing Memos Section */}
        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <h3 style="color: var(--text-primary); margin-bottom: 1.2rem; font-family: var(--font-family-display); font-size: 1.4rem;">Existing Memos</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.2rem;">
            <Index each={userMemos()}>
              {(memo) => (
                <MemoCard
                  memo={memo()}
                  onUpdate={updateMemoField}
                  onDelete={deleteMemo}
                  toggleAudience={toggleExistingAudience}
                />
              )}
            </Index>

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
