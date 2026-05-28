import { For, createSignal, createEffect } from 'solid-js';
import { agents, personas, type UserMemo } from '../../store/appState';

interface MemoCardProps {
  memo: UserMemo;
  onSave: (id: string, updates: Partial<UserMemo>) => void;
  onDelete: (id: string) => void;
}

export function MemoCard(props: MemoCardProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);
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
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTitle(props.memo.title);
    setContent(props.memo.content);
    setTargetAudiences(props.memo.targetAudiences || []);
    setIsExpanded(false);
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
    <>
      {!isExpanded() ? (
        /* Collapsed Read-Only Bar */
        <div
          class="sidebar-card memo-card-collapsed"
          onClick={() => setIsExpanded(true)}
        >
          <div class="memo-card-title-container">
            <span class="memo-card-title-icon">📝</span>
            <span class="memo-card-title-text">
              {props.memo.title || 'Untitled Memo'}
            </span>
          </div>
          <div class="memo-card-meta-container">
            {props.memo.updater && (
              <span 
                class="memo-card-badge"
                title={`Last updated by ${props.memo.updater}`}
              >
                👤 {props.memo.updater}
              </span>
            )}
            <span class="memo-card-chevron">▶</span>
          </div>
        </div>
      ) : (
        /* Expanded Editing Form Card */
        <div
          class={`sidebar-card memo-card-expanded ${hasChanges() ? 'changed' : ''}`}
        >
          {/* Title & Controls */}
          <div class="memo-card-row-between">
            <input
              type="text"
              class="input-text memo-card-input-title"
              value={title()}
              placeholder="Memo Title..."
              onInput={(e) => setTitle(e.currentTarget.value)}
            />
            <div class="memo-card-controls">
              <button
                class="btn-delete-session memo-card-btn-collapse"
                onClick={() => setIsExpanded(false)}
                title="Collapse Memo"
              >
                ▼
              </button>
              <button
                class="btn-delete-session memo-card-btn-delete"
                onClick={() => props.onDelete(props.memo.id)}
                title="Delete Memo"
              >
                🗑️
              </button>
            </div>
          </div>

          {/* Creator / Updater Display (Read-Only) */}
          <div class="memo-card-metadata-grid">
            <div class="memo-card-metadata-col">
              <span class="memo-card-metadata-label">Creator</span>
              <span class="memo-card-metadata-value">
                {props.memo.creator || 'None'}
              </span>
            </div>
            <div class="memo-card-metadata-col">
              <span class="memo-card-metadata-label">Updater</span>
              <span class="memo-card-metadata-value">
                {props.memo.updater || 'None'}
              </span>
            </div>
          </div>

          {/* Target Audiences checklist */}
          <div class="memo-card-field-group">
            <label class="memo-card-field-label">Target Audiences</label>
            <div class="checklist-group memo-card-checklist">
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
          <div class="memo-card-field-group">
            <label class="memo-card-field-label">Content</label>
            <textarea
              class="input-text memo-card-textarea"
              rows={3}
              placeholder="Content..."
              value={content()}
              onInput={(e) => setContent(e.currentTarget.value)}
            />
          </div>

          {/* Save & Cancel Buttons */}
          <div class="memo-card-actions">
            <button
              class="btn-glass memo-card-btn-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              class="btn-primary memo-card-btn-save"
              onClick={handleSave}
              disabled={!hasChanges()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}
