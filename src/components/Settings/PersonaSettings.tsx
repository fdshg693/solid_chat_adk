import { Show, For, createSignal } from 'solid-js';
import {
  personas,
  activePersona,
  switchPersona,
  addPersona,
  deletePersona
} from '../../store/appState';

export function PersonaSettings() {
  const [newPersonaName, setNewPersonaName] = createSignal('');
  const [newPersonaRole, setNewPersonaRole] = createSignal<'admin' | 'user'>('user');
  const [newPersonaAvatar, setNewPersonaAvatar] = createSignal('👤');

  const avatarOptions = ['👤', '👑', '🚀', '🐱', '🐼', '🦊', '🤖', '👾'];

  const handleAddPersona = (e: Event) => {
    e.preventDefault();
    const name = newPersonaName().trim();
    if (!name) return;
    addPersona(name, newPersonaRole(), newPersonaAvatar());
    setNewPersonaName('');
    newPersonaRole(); // Trigger reactive track if any
    setNewPersonaRole('user');
    setNewPersonaAvatar('👤');
  };

  const handleDeletePersona = (id: string, name: string) => {
    if (confirm(`ペルソナ「${name}」を削除してもよろしいですか？`)) {
      const success = deletePersona(id);
      if (!success) {
        alert('現在アクティブなペルソナは削除できません。');
      }
    }
  };

  return (
    <div class="settings-content">
      <h2 style="font-family: var(--font-family-display); font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
        👤 Persona Settings & Switching
      </h2>
      <p class="settings-info" style="margin-bottom: 1.5rem;">
        Switch the active chat persona or manage personas. Administrative access is required to add or delete personas.
      </p>

      {/* Current Persona Card / Info */}
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(5px);">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="user-avatar-circle" style="background: rgba(124,58,237,0.15); border-color: var(--color-primary); font-size: 1.5rem; width: 3rem; height: 3rem;">
            {activePersona().avatar}
          </div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
              {activePersona().name}
              <span style="font-size: 0.72rem; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3); padding: 2px 8px; border-radius: 4px; color: #c084fc; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
                {activePersona().role}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Currently active persona
            </div>
          </div>
        </div>
        <span style="color: var(--color-success); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
          <span style="display:inline-block; width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; box-shadow: 0 0 8px var(--color-success)"></span>
          Active
        </span>
      </div>

      {/* Persona Switcher list */}
      <h3 class="sidebar-title" style="margin-bottom: 0.75rem; color: #fff;">Switch Chat Persona</h3>
      <div class="user-switcher-cards" style="margin-bottom: 1rem;">
        <For each={personas()}>
          {(p) => (
            <div
              class={`user-select-card ${p.id === activePersona().id ? 'active' : ''}`}
              onClick={() => switchPersona(p.id)}
            >
              <div class="user-avatar-circle">
                {p.avatar}
              </div>
              <div class="user-meta-info">
                <span class="user-meta-name">{p.name}</span>
                <span class="user-meta-role">{p.role}</span>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Admin Management (Only visible if activePersona has admin role) */}
      <Show when={activePersona().role === 'admin'}>
        <div class="admin-section">
          <h3 class="admin-header">
            👥 Persona Management <span style="font-size: 0.72rem; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; padding: 2px 8px; border-radius: 9999px; margin-left: 0.5rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Admin Privileges</span>
          </h3>
          
          {/* Persona List Table */}
          <div class="user-table-wrapper">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Persona Name</th>
                  <th>Persona Role</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <For each={personas()}>
                  {(p) => (
                    <tr style={p.id === activePersona().id ? "background: rgba(124, 58, 237, 0.05);" : ""}>
                      <td>
                        <span style="font-size: 1.25rem;">{p.avatar}</span>
                      </td>
                      <td>
                        <span style="font-weight: 600; color: #fff;">{p.name}</span>
                        <Show when={p.id === activePersona().id}>
                          <span style="font-size: 0.75rem; color: var(--color-primary); margin-left: 0.5rem; font-style: italic;">(Active)</span>
                        </Show>
                      </td>
                      <td>
                        <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">
                          {p.role}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button
                          type="button"
                          class="btn-glass"
                          style="color: var(--color-error); border-color: rgba(239,68,68,0.2); padding: 0.25rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"
                          disabled={p.id === activePersona().id}
                          title={p.id === activePersona().id ? "You cannot delete active persona" : "Delete persona"}
                          onClick={() => handleDeletePersona(p.id, p.name)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          {/* Persona Add Form */}
          <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 0.75rem; font-weight: 600;">➕ Add New Persona Profile</h4>
          <form class="user-add-form" onSubmit={handleAddPersona}>
            <div class="form-group-inline">
              <label class="settings-label" style="margin-bottom: 0.25rem;">Persona Name</label>
              <input
                type="text"
                class="input-text"
                placeholder="e.g., alex"
                value={newPersonaName()}
                onInput={(e) => setNewPersonaName(e.currentTarget.value)}
                required
              />
            </div>

            <div class="form-group-inline">
              <label class="settings-label" style="margin-bottom: 0.25rem;">Persona Role</label>
              <select
                class="settings-select"
                value={newPersonaRole()}
                onChange={(e) => setNewPersonaRole(e.currentTarget.value as 'admin' | 'user')}
              >
                <option value="user">User (Standard)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>

            <div class="form-group-inline avatar-select">
              <label class="settings-label" style="margin-bottom: 0.25rem;">Avatar</label>
              <div class="avatar-grid">
                <For each={avatarOptions}>
                  {(emoji) => (
                    <div
                      class={`avatar-option ${newPersonaAvatar() === emoji ? 'selected' : ''}`}
                      onClick={() => setNewPersonaAvatar(emoji)}
                      title="Select Avatar"
                    >
                      {emoji}
                    </div>
                  )}
                </For>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="padding: 0.65rem 1.25rem; font-size: 0.87rem; height: 38px;">
              ➕ Create Persona
            </button>
          </form>
        </div>
      </Show>
    </div>
  );
}
