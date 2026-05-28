import { Show, For, createSignal } from 'solid-js';
import {
  users,
  activeUser,
  switchUser,
  addUser,
  deleteUser
} from '../../store/appState';

export function UserSettings() {
  const [newUserName, setNewUserName] = createSignal('');
  const [newUserRole, setNewUserRole] = createSignal<'admin' | 'user'>('user');
  const [newUserAvatar, setNewUserAvatar] = createSignal('👤');

  const avatarOptions = ['👤', '👑', '🚀', '🐱', '🐼', '🦊', '🤖', '👾'];

  const handleAddUser = (e: Event) => {
    e.preventDefault();
    const name = newUserName().trim();
    if (!name) return;
    addUser(name, newUserRole(), newUserAvatar());
    setNewUserName('');
    setNewUserRole('user');
    setNewUserAvatar('👤');
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`ユーザー「${name}」を削除してもよろしいですか？`)) {
      const success = deleteUser(id);
      if (!success) {
        alert('現在アクティブなユーザーは削除できません。');
      }
    }
  };

  return (
    <div class="settings-content">
      <h2 style="font-family: var(--font-family-display); font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
        👤 User Settings & Switching
      </h2>
      <p class="settings-info" style="margin-bottom: 1.5rem;">
        Switch the active profile or manage users. Administrative access is required to add or delete profiles.
      </p>

      {/* Current Profile Card / Info */}
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(5px);">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="user-avatar-circle" style="background: rgba(124,58,237,0.15); border-color: var(--color-primary); font-size: 1.5rem; width: 3rem; height: 3rem;">
            {activeUser().avatar}
          </div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
              {activeUser().name}
              <span style="font-size: 0.72rem; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.3); padding: 2px 8px; border-radius: 4px; color: #c084fc; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
                {activeUser().role}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Currently active profile
            </div>
          </div>
        </div>
        <span style="color: var(--color-success); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
          <span style="display:inline-block; width: 8px; height: 8px; background: var(--color-success); border-radius: 50%; box-shadow: 0 0 8px var(--color-success)"></span>
          Active
        </span>
      </div>

      {/* User Switcher list */}
      <h3 class="sidebar-title" style="margin-bottom: 0.75rem; color: #fff;">Switch User Profile</h3>
      <div class="user-switcher-cards" style="margin-bottom: 1rem;">
        <For each={users()}>
          {(u) => (
            <div
              class={`user-select-card ${u.id === activeUser().id ? 'active' : ''}`}
              onClick={() => switchUser(u.id)}
            >
              <div class="user-avatar-circle">
                {u.avatar}
              </div>
              <div class="user-meta-info">
                <span class="user-meta-name">{u.name}</span>
                <span class="user-meta-role">{u.role}</span>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Admin Management (Only visible if activeUser has admin role) */}
      <Show when={activeUser().role === 'admin'}>
        <div class="admin-section">
          <h3 class="admin-header">
            👥 User Management <span style="font-size: 0.72rem; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); color: #22d3ee; padding: 2px 8px; border-radius: 9999px; margin-left: 0.5rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Admin Privileges</span>
          </h3>
          
          {/* User List Table */}
          <div class="user-table-wrapper">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <For each={users()}>
                  {(u) => (
                    <tr style={u.id === activeUser().id ? "background: rgba(124, 58, 237, 0.05);" : ""}>
                      <td>
                        <span style="font-size: 1.25rem;">{u.avatar}</span>
                      </td>
                      <td>
                        <span style="font-weight: 600; color: #fff;">{u.name}</span>
                        <Show when={u.id === activeUser().id}>
                          <span style="font-size: 0.75rem; color: var(--color-primary); margin-left: 0.5rem; font-style: italic;">(You)</span>
                        </Show>
                      </td>
                      <td>
                        <span style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.5px;">
                          {u.role}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button
                          type="button"
                          class="btn-glass"
                          style="color: var(--color-error); border-color: rgba(239,68,68,0.2); padding: 0.25rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"
                          disabled={u.id === activeUser().id}
                          title={u.id === activeUser().id ? "You cannot delete yourself" : "Delete user"}
                          onClick={() => handleDeleteUser(u.id, u.name)}
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

          {/* User Add Form */}
          <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 0.75rem; font-weight: 600;">➕ Add New User Profile</h4>
          <form class="user-add-form" onSubmit={handleAddUser}>
            <div class="form-group-inline">
              <label class="settings-label" style="margin-bottom: 0.25rem;">Username</label>
              <input
                type="text"
                class="input-text"
                placeholder="e.g., alex"
                value={newUserName()}
                onInput={(e) => setNewUserName(e.currentTarget.value)}
                required
              />
            </div>

            <div class="form-group-inline">
              <label class="settings-label" style="margin-bottom: 0.25rem;">Role</label>
              <select
                class="settings-select"
                value={newUserRole()}
                onChange={(e) => setNewUserRole(e.currentTarget.value as 'admin' | 'user')}
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
                      class={`avatar-option ${newUserAvatar() === emoji ? 'selected' : ''}`}
                      onClick={() => setNewUserAvatar(emoji)}
                      title="Select Avatar"
                    >
                      {emoji}
                    </div>
                  )}
                </For>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="padding: 0.65rem 1.25rem; font-size: 0.87rem; height: 38px;">
              ➕ Create User
            </button>
          </form>
        </div>
      </Show>
    </div>
  );
}
