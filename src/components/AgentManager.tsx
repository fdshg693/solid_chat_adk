import { For, createSignal } from 'solid-js';
import { agents, setAgents, type Agent, authFetch } from '../store/appState';
import './AgentManager.css';

export function AgentManager() {
  const [editingId, setEditingId] = createSignal<string | null>(null);
  const [editName, setEditName] = createSignal('');
  const [editPrompt, setEditPrompt] = createSignal('');
  const [editAvatar, setEditAvatar] = createSignal('🤖');

  const [newName, setNewName] = createSignal('');
  const [newPrompt, setNewPrompt] = createSignal('');
  const [newAvatar, setNewAvatar] = createSignal('🤖');

  const avatarOptions = ['🤖', '👾', '🧙‍♂️', '🦸‍♀️', '🕵️‍♂️', '🎓', '🎨', '🚀', '🧠', '💼', '🏥', '🔬'];

  const startEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setEditName(agent.name);
    setEditPrompt(agent.systemPrompt);
    setEditAvatar(agent.avatar || '🤖');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrompt('');
    setEditAvatar('🤖');
  };

  const saveEdit = async () => {
    const id = editingId();
    if (!id || !editName().trim() || !editPrompt().trim()) return;

    try {
      const response = await authFetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName().trim(), systemPrompt: editPrompt().trim(), avatar: editAvatar() })
      });
      const data = await response.json();
      if (data.success) {
        setAgents(agents().map(a => a.id === id ? data.agent : a));
        cancelEdit();
      }
    } catch (e) {
      console.error('Failed to update agent', e);
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('このエージェントを削除してもよろしいですか？')) return;
    try {
      await authFetch(`/api/agents/${id}`, { method: 'DELETE' });
      setAgents(agents().filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete agent', e);
    }
  };

  const createAgent = async () => {
    if (!newName().trim() || !newPrompt().trim()) return;
    const id = `agent-${Date.now()}`;
    try {
      const response = await authFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName().trim(), systemPrompt: newPrompt().trim(), avatar: newAvatar() })
      });
      const data = await response.json();
      if (data.success) {
        setAgents([...agents(), data.agent]);
        setNewName('');
        setNewPrompt('');
        setNewAvatar('🤖');
      }
    } catch (e) {
      console.error('Failed to create agent', e);
    }
  };

  return (
    <div class="agent-manager-view">
      <div class="agent-manager-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h2 style="margin: 0; color: var(--text-primary); font-family: var(--font-family-display); font-size: 1.8rem;">Agent Manager</h2>
        </div>

        <div style="margin-bottom: 2rem;">
          <h3 style="color: var(--text-bright); margin-bottom: 0.5rem;">Create New Agent</h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <input
              type="text"
              class="input-text"
              placeholder="Agent Name"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
            />
            <textarea
              class="input-text"
              rows={3}
              placeholder="System Prompt (e.g., 'You are a helpful translation assistant...')"
              value={newPrompt()}
              onInput={(e) => setNewPrompt(e.currentTarget.value)}
              style="resize: vertical;"
            />
            
            {/* Avatar Select Panel */}
            <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem;">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Select Agent Avatar</span>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                <For each={avatarOptions}>
                  {(emoji) => (
                    <button
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      style={{
                        padding: '0.4rem',
                        'font-size': '1.25rem',
                        background: newAvatar() === emoji ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: newAvatar() === emoji ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                        'border-radius': '6px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {emoji}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <button class="btn-primary" onClick={createAgent} disabled={!newName().trim() || !newPrompt().trim()}>
              Create Agent
            </button>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <h3 style="color: var(--text-bright); margin-bottom: 0.5rem;">Existing Agents</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <For each={agents()}>
              {(agent) => (
                <div class="sidebar-card" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem;">
                  {editingId() === agent.id ? (
                    <>
                      <input
                        type="text"
                        class="input-text"
                        value={editName()}
                        onInput={(e) => setEditName(e.currentTarget.value)}
                      />
                      <textarea
                        class="input-text"
                        rows={3}
                        value={editPrompt()}
                        onInput={(e) => setEditPrompt(e.currentTarget.value)}
                        style="resize: vertical;"
                      />
                      {/* Edit Avatar Select Panel */}
                      <div style="display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem;">
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">Edit Agent Avatar</span>
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                          <For each={avatarOptions}>
                            {(emoji) => (
                              <button
                                type="button"
                                onClick={() => setEditAvatar(emoji)}
                                style={{
                                  padding: '0.3rem',
                                  'font-size': '1.1rem',
                                  background: editAvatar() === emoji ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                  border: editAvatar() === emoji ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                                  'border-radius': '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.25s ease',
                                }}
                              >
                                {emoji}
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button class="btn-secondary" onClick={cancelEdit}>Cancel</button>
                        <button class="btn-primary" onClick={saveEdit}>Save</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span style="font-size: 1.25rem;">{agent.avatar || '🤖'}</span>
                          <strong style="color: var(--accent-cyan);">{agent.name}</strong>
                        </div>
                        <div style="display: flex; gap: 0.3rem;">
                          <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onClick={() => startEdit(agent)}>Edit</button>
                          <button class="btn-delete-session" style="padding: 0.2rem 0.5rem;" onClick={() => deleteAgent(agent.id)}>🗑️</button>
                        </div>
                      </div>
                      <div style="font-size: 0.8rem; color: var(--text-muted); white-space: pre-wrap;">
                        {agent.systemPrompt}
                      </div>
                    </>
                  )}
                </div>
              )}
            </For>
            {agents().length === 0 && (
              <div style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem;">
                No agents created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
