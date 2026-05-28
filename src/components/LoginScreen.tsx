import { createSignal, Show, For } from 'solid-js';
import { loginUser, registerUser } from '../store/appState';
import './LoginScreen.css';

export function LoginScreen() {
  const [activeTab, setActiveTab] = createSignal<'login' | 'register'>('login');
  
  // Login fields
  const [loginUsername, setLoginUsername] = createSignal('');
  const [loginPassword, setLoginPassword] = createSignal('');
  
  // Register fields
  const [regUsername, setRegUsername] = createSignal('');
  const [regPassword, setRegPassword] = createSignal('');
  const [regAvatar, setRegAvatar] = createSignal('👤');
  
  const [loading, setLoading] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal('');
  const [successMsg, setSuccessMsg] = createSignal('');

  const avatarOptions = ['👤', '👑', '🚀', '🐱', '🐼', '🦊', '🤖', '👾'];

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    const username = loginUsername().trim();
    const pw = loginPassword().trim();
    if (!username || !pw) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await loginUser(username, pw);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'ログインに失敗しました。');
    }
  };

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    const username = regUsername().trim();
    const pw = regPassword().trim();
    if (!username || !pw) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await registerUser(username, pw, regAvatar());
    setLoading(false);
    if (res.success) {
      setSuccessMsg('新規登録が完了しました！ログインタブからログインしてください。');
      setRegUsername('');
      setRegPassword('');
      setActiveTab('login');
      // Autofill login username
      setLoginUsername(username);
    } else {
      setErrorMsg(res.error || 'ユーザーの登録に失敗しました。');
    }
  };

  return (
    <div class="login-wrapper">
      <div class="login-card">
        
        {/* Title */}
        <div style="text-align: center; margin-bottom: 2rem;">
          <div class="login-header-logo">U</div>
          <h2 class="login-title">Ultraviolet Chat</h2>
          <p class="login-subtitle">AUTHENTICATION PORTAL</p>
        </div>

        {/* Tabs */}
        <div class="login-tab-container">
          <button
            type="button"
            class={`login-tab-btn ${activeTab() === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            🔑 ログイン
          </button>
          <button
            type="button"
            class={`login-tab-btn ${activeTab() === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            ➕ 新規登録
          </button>
        </div>

        {/* Message Notifications */}
        <Show when={errorMsg()}>
          <div class="login-notification error">
            ⚠️ {errorMsg()}
          </div>
        </Show>
        <Show when={successMsg()}>
          <div class="login-notification success">
            ✅ {successMsg()}
          </div>
        </Show>

        {/* Form switcher */}
        <Show when={activeTab() === 'login'}>
          <form onSubmit={handleLogin} class="login-form">
            <div class="login-field-group">
              <label class="login-field-label">Username</label>
              <input
                type="text"
                class="input-text login-field-input"
                placeholder="ユーザー名を入力してください"
                value={loginUsername()}
                onInput={(e) => setLoginUsername(e.currentTarget.value)}
                required
                disabled={loading()}
              />
            </div>
            <div class="login-field-group">
              <label class="login-field-label">Password</label>
              <input
                type="password"
                class="input-text login-field-input"
                placeholder="パスワードを入力してください"
                value={loginPassword()}
                onInput={(e) => setLoginPassword(e.currentTarget.value)}
                required
                disabled={loading()}
              />
            </div>
            
            <button
              type="submit"
              class="btn-primary"
              disabled={loading()}
              style="width: 100%; padding: 0.75rem; font-size: 0.9rem; font-weight: 700; border-radius: var(--radius-md); display: flex; justify-content: center; align-items: center; height: auto;"
            >
              <Show when={loading()} fallback="🔑 ログイン">
                <span class="loading-spinner"></span>
              </Show>
            </button>
          </form>
        </Show>

        <Show when={activeTab() === 'register'}>
          <form onSubmit={handleRegister} class="login-form">
            <div class="login-field-group">
              <label class="login-field-label">Username</label>
              <input
                type="text"
                class="input-text login-field-input"
                placeholder="半角英数字で入力してください"
                value={regUsername()}
                onInput={(e) => setRegUsername(e.currentTarget.value)}
                required
                disabled={loading()}
              />
            </div>
            <div class="login-field-group">
              <label class="login-field-label">Password</label>
              <input
                type="password"
                class="input-text login-field-input"
                placeholder="パスワードを設定してください"
                value={regPassword()}
                onInput={(e) => setRegPassword(e.currentTarget.value)}
                required
                disabled={loading()}
              />
            </div>
            
            {/* Avatar picker */}
            <div class="login-field-group">
              <label class="login-avatar-picker-label">Choose Avatar</label>
              <div class="login-avatar-grid">
                <For each={avatarOptions}>
                  {(emoji) => (
                    <button
                      type="button"
                      onClick={() => setRegAvatar(emoji)}
                      class={`login-avatar-btn ${regAvatar() === emoji ? 'selected' : ''}`}
                      title="Select Avatar"
                      disabled={loading()}
                    >
                      {emoji}
                    </button>
                  )}
                </For>
              </div>
            </div>
            
            <button
              type="submit"
              class="btn-primary"
              disabled={loading()}
              style="width: 100%; padding: 0.75rem; font-size: 0.9rem; font-weight: 700; border-radius: var(--radius-md); display: flex; justify-content: center; align-items: center; height: auto;"
            >
              <Show when={loading()} fallback="👤 新規登録">
                <span class="loading-spinner"></span>
              </Show>
            </button>
          </form>
        </Show>

        {/* Demo Credentials Tip */}
        <div class="login-credentials-tip">
          <p class="login-credentials-text">
            💡 <strong style="color: #fff;">デモ用アカウント:</strong><br />
            ユーザー名: <span class="login-credentials-highlight">admin</span> / パスワード: <span class="login-credentials-highlight">admin</span><br />
            ユーザー名: <span class="login-credentials-highlight">user1</span> / パスワード: <span class="login-credentials-highlight">user1</span>
          </p>
        </div>

      </div>
    </div>
  );
}

