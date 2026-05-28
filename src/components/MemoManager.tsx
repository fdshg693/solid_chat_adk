import { Index, For } from 'solid-js';
import {
  userMemos,
  activePersona,
  type UserMemo,
  authFetch,
  memoTotalCount,
  memoCurrentPage,
  memoPageSize,
  fetchMemos,
} from '../store/appState';
import { CreateMemoForm } from './Memo/CreateMemoForm';
import { MemoCard } from './Memo/MemoCard';

export function MemoManager() {
  const saveMemoEdits = async (id: string, updates: Partial<UserMemo>) => {
    const memo = userMemos().find(m => m.id === id);
    if (!memo) return;
    const updated = { ...memo, ...updates, updater: activePersona() ? activePersona().name : 'admin' };

    try {
      const res = await authFetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchMemos(memoCurrentPage());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMemo = async (id: string) => {
    if (!confirm('このメモを削除してもよろしいですか？')) return;
    try {
      const res = await authFetch(`/api/memos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const newTotal = memoTotalCount() - 1;
        const maxPages = Math.max(1, Math.ceil(newTotal / memoPageSize));
        const targetPage = memoCurrentPage() > maxPages ? maxPages : memoCurrentPage();
        await fetchMemos(targetPage);
      }
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

    try {
      const res = await authFetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemo)
      });
      if (res.ok) {
        await fetchMemos(1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalPages = () => Math.max(1, Math.ceil(memoTotalCount() / memoPageSize));

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
                  onSave={saveMemoEdits}
                  onDelete={deleteMemo}
                />
              )}
            </Index>

            {userMemos().length === 0 && (
              <div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; grid-column: 1 / -1; padding: 2rem;">
                No memos created yet. Use the form above to add a new memo.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages() > 1 && (
            <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem; margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.05); animation: fadeIn 0.2s ease;">
              <button
                class="btn-glass"
                disabled={memoCurrentPage() === 1}
                onClick={() => fetchMemos(memoCurrentPage() - 1)}
                style={`padding: 0.4rem 0.8rem; font-size: 0.85rem; opacity: ${memoCurrentPage() === 1 ? 0.4 : 1}; cursor: ${memoCurrentPage() === 1 ? 'not-allowed' : 'pointer'};`}
              >
                ◀ Prev
              </button>
              
              <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
                {(p) => (
                  <button
                    class={`btn-glass ${memoCurrentPage() === p ? 'active' : ''}`}
                    onClick={() => fetchMemos(p)}
                    style="padding: 0.4rem 0.8rem; font-size: 0.85rem; min-width: 34px; justify-content: center;"
                  >
                    {p}
                  </button>
                )}
              </For>

              <button
                class="btn-glass"
                disabled={memoCurrentPage() === totalPages()}
                onClick={() => fetchMemos(memoCurrentPage() + 1)}
                style={`padding: 0.4rem 0.8rem; font-size: 0.85rem; opacity: ${memoCurrentPage() === totalPages() ? 0.4 : 1}; cursor: ${memoCurrentPage() === totalPages() ? 'not-allowed' : 'pointer'};`}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
