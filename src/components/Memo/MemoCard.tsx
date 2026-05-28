import { For, createSignal, createEffect } from 'solid-js';
import { agents, personas, type UserMemo } from '../../store/appState';

interface MemoCardProps {
  memo: UserMemo;
  onSave: (id: string, updates: Partial<UserMemo>) => void;
  onDelete: (id: string) => void;
}

export function MemoCard(props: MemoCardProps) {
  const [title, setTitle] = createSignal(props.memo.title);
  const [content, setContent] = createSignal(props.memo.content);
  const [targetAudiences, setTargetAudiences] = createSignal<string[]>(props.memo.targetAudiences || []);

  // Sync state if props.memo changes from outside
  createEffect(() => {
    setTitle(props.memo.title);
  });
  createEffect(() => {
    setContent(props.memo.content);
  });
  createEffect(() => {
    setTargetAudiences(props.memo.targetAudiences || []);
  });

  const hasChanges = () => {
    const tChanged = title() !== props.memo.title;
    const cChanged = content() !== props.memo.content;
    
    const a1 = [...targetAudiences()].sort();
    const a2 = [...(props.memo.targetAudiences || [])].sort();
    const aChanged = a1.length !== a2.length || a1.some((v, i) => v !== a2[i]);
    
    return tChanged || cChanged || aChanged;
  };

  const handleSave = () => {
    props.onSave(props.memo.id, {
      title: title(),
      content: content(),
      targetAudiences: targetAudiences(),
    });
  };

  const handleCancel = () => {
    setTitle(props.memo.title);
    setContent(props.memo.content);
    setTargetAudiences(props.memo.targetAudiences || []);
  };

  const toggleLocalAudience = (name: string) => {
    const current = targetAudiences();
    if (current.includes(name)) {
      setTargetAudiences(current.filter(x => x !== name));
    } else {
      setTargetAudiences([...current, name]);
    }
  };

  return (
    <div
      class="sidebar-card"
      style={`display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; background: rgba(18, 20, 32, 0.5); border: ${hasChanges() ? '1px solid var(--color-secondary)' : '1px solid rgba(124, 58, 237, 0.15)'}; box-shadow: ${hasChanges() ? '0 0 10px rgba(6, 182, 212, 0.15)' : 'none'}; transition: all 0.25s ease;`}
    >
      
      {/* Title & Delete button */}
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
        <input
          type="text"
          class="input-text"
          style="font-weight: 600; font-size: 0.95rem; padding: 0.35rem 0.6rem; border-color: rgba(255,255,255,0.05);"
          value={title()}
          placeholder="Memo Title..."
          onInput={(e) => setTitle(e.currentTarget.value)}
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

      {/* Creator / Updater Display (Read-Only) */}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: rgba(0, 0, 0, 0.15); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid rgba(255, 255, 255, 0.03);">
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Creator</span>
          <span style="font-size: 0.8rem; color: var(--text-bright); font-weight: 500;">{props.memo.creator}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Updater</span>
          <span style="font-size: 0.8rem; color: var(--text-bright); font-weight: 500;">{props.memo.updater}</span>
        </div>
      </div>

      {/* Target Audiences checklist */}
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <label style="font-size: 0.7rem; color: var(--text-muted);">Target Audiences</label>
        <div class="checklist-group" style="max-height: 80px; padding: 0.5rem;">
          <For each={personas()}>
            {(p) => (
              <label class="checklist-item">
                <input
                  type="checkbox"
                  checked={targetAudiences().includes(p.name)}
                  onChange={() => toggleLocalAudience(p.name)}
                />
                <span style="font-size: 0.75rem;">{p.name}</span>
              </label>
            )}
          </For>
          <For each={agents()}>
            {(a) => (
              <label class="checklist-item">
                <input
                  type="checkbox"
                  checked={targetAudiences().includes(a.name)}
                  onChange={() => toggleLocalAudience(a.name)}
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
          value={content()}
          onInput={(e) => setContent(e.currentTarget.value)}
        />
      </div>

      {/* Save & Cancel Buttons (Shown only when changes exist) */}
      {hasChanges() && (
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; animation: fadeIn 0.25s ease;">
          <button
            class="btn-glass"
            style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.2); color: #fca5a5;"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            class="btn-primary"
            style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%);"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      )}

    </div>
  );
}
