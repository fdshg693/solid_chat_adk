import { For } from 'solid-js';
import { agents, users, type UserMemo } from '../../store/appState';

interface MemoCardProps {
  memo: UserMemo;
  onUpdate: (id: string, updates: Partial<UserMemo>) => void;
  onDelete: (id: string) => void;
  toggleAudience: (id: string, name: string) => void;
}

export function MemoCard(props: MemoCardProps) {
  return (
    <div class="sidebar-card" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: rgba(18, 20, 32, 0.5); border: 1px solid rgba(124, 58, 237, 0.15);">
      
      {/* Title & Delete button */}
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
        <input
          type="text"
          class="input-text"
          style="font-weight: 600; font-size: 0.95rem; padding: 0.35rem 0.6rem; border-color: rgba(255,255,255,0.05);"
          value={props.memo.title}
          placeholder="Memo Title..."
          onInput={(e) => props.onUpdate(props.memo.id, { title: e.currentTarget.value })}
        />
        <button
          class="btn-delete-session"
          onClick={() => props.onDelete(props.memo.id)}
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
            value={props.memo.creator}
            onChange={(e) => props.onUpdate(props.memo.id, { creator: e.currentTarget.value })}
          >
            <For each={users()}>{(u) => <option value={u.name}>{u.name}</option>}</For>
            <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
          </select>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.25rem;">
          <label style="font-size: 0.7rem; color: var(--text-muted);">Updater</label>
          <select
            class="input-text"
            style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--bg-dark); color: var(--text-bright);"
            value={props.memo.updater}
            onChange={(e) => props.onUpdate(props.memo.id, { updater: e.currentTarget.value })}
          >
            <For each={users()}>{(u) => <option value={u.name}>{u.name}</option>}</For>
            <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
          </select>
        </div>
      </div>

      {/* Target Audiences checklist */}
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <label style="font-size: 0.7rem; color: var(--text-muted);">Target Audiences</label>
        <div class="checklist-group" style="max-height: 80px; padding: 0.5rem;">
          <For each={users()}>
            {(u) => (
              <label class="checklist-item">
                <input
                  type="checkbox"
                  checked={(props.memo.targetAudiences || []).includes(u.name)}
                  onChange={() => props.toggleAudience(props.memo.id, u.name)}
                />
                <span style="font-size: 0.75rem;">{u.name}</span>
              </label>
            )}
          </For>
          <For each={agents()}>
            {(a) => (
              <label class="checklist-item">
                <input
                  type="checkbox"
                  checked={(props.memo.targetAudiences || []).includes(a.name)}
                  onChange={() => props.toggleAudience(props.memo.id, a.name)}
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
          value={props.memo.content}
          onInput={(e) => props.onUpdate(props.memo.id, { content: e.currentTarget.value })}
        />
      </div>

    </div>
  );
}
