import { For, createSignal } from 'solid-js';
import { agents, users, activeUser } from '../../store/appState';

interface CreateMemoFormProps {
  onCreate: (memo: {
    title: string;
    content: string;
    creator: string;
    updater: string;
    targetAudiences: string[];
  }) => void;
}

export function CreateMemoForm(props: CreateMemoFormProps) {
  const [newTitle, setNewTitle] = createSignal('');
  const [newContent, setNewContent] = createSignal('');
  const [newCreator, setNewCreator] = createSignal(activeUser() ? activeUser().name : 'admin');
  const [newUpdater, setNewUpdater] = createSignal(activeUser() ? activeUser().name : 'admin');
  const [newTargetAudiences, setNewTargetAudiences] = createSignal<string[]>([]);

  // Helper to toggle audience in new memo state
  const toggleNewAudience = (name: string) => {
    const current = newTargetAudiences();
    if (current.includes(name)) {
      setNewTargetAudiences(current.filter(x => x !== name));
    } else {
      setNewTargetAudiences([...current, name]);
    }
  };

  const handleSubmit = () => {
    if (!newTitle().trim()) return;
    props.onCreate({
      title: newTitle().trim(),
      content: newContent().trim(),
      creator: newCreator(),
      updater: newUpdater(),
      targetAudiences: newTargetAudiences()
    });

    // Reset inputs
    setNewTitle('');
    setNewContent('');
    setNewCreator(activeUser() ? activeUser().name : 'admin');
    setNewUpdater(activeUser() ? activeUser().name : 'admin');
    setNewTargetAudiences([]);
  };

  return (
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
              <For each={users()}>{(u) => <option value={u.name}>{u.name}</option>}</For>
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
              <For each={users()}>{(u) => <option value={u.name}>{u.name}</option>}</For>
              <For each={agents()}>{(a) => <option value={a.name}>{a.name}</option>}</For>
            </select>
          </div>

        </div>

        {/* Checklist for Multi-Select Target Audiences */}
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">Target Audiences (Multiple Select)</label>
          <div class="checklist-group">
            <For each={users()}>
              {(u) => (
                <label class="checklist-item">
                  <input
                    type="checkbox"
                    checked={newTargetAudiences().includes(u.name)}
                    onChange={() => toggleNewAudience(u.name)}
                  />
                  <span>{u.name}</span>
                </label>
              )}
            </For>
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
          onClick={handleSubmit} 
          disabled={!newTitle().trim()}
          style="align-self: flex-start;"
        >
          Create Memo
        </button>
      </div>
    </div>
  );
}
