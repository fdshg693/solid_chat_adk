import { createSignal, Show, For } from 'solid-js';
import { loginUser, registerUser } from '../store/appState';

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
    <div class="login-wrapper" style="display: flex; justify-content: center; align-items: center; min-height: calc(100vh - var(--header-height)); padding: 2rem; position: relative; z-index: 10;">
      <div class="login-card" style="background: rgba(26,22,37,0.45); border: 1px solid rgba(124,58,237,0.2); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); width: 100%; max-width: 440px; border-radius: var(--radius-lg); box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05); padding: 2.5rem; transition: transform 0.3s ease, border-color 0.3s ease;">
        
        {/* Title */}
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="display: inline-flex; width: 3.5rem; height: 3.5rem; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); border-radius: 12px; align-items: center; justify-content: center; font-family: var(--font-family-display); font-size: 1.75rem; font-weight: 900; color: #fff; margin-bottom: 0.75rem; box-shadow: 0 0 20px rgba(124,58,237,0.4);">U</div>
          <h2 style="font-family: var(--font-family-display); font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0;">Ultraviolet Chat</h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.5px;">AUTHENTICATION PORTAL</p>
        </div>

        {/* Tabs */}
        <div style="display: flex; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); padding: 4px; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.03);">
          <button
            type="button"
            style={`flex: 1; padding: 0.5rem; border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; background: ${activeTab() === 'login' ? 'rgba(124,58,237,0.15)' : 'transparent'}; color: ${activeTab() === 'login' ? '#fff' : 'var(--text-muted)'}; border: ${activeTab() === 'login' ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent'}; text-shadow: ${activeTab() === 'login' ? '0 0 10px rgba(124,58,237,0.5)' : 'none'};`}
            onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            🔑 ログイン
          </button>
          <button
            type="button"
            style={`flex: 1; padding: 0.5rem; border: none; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; background: ${activeTab() === 'register' ? 'rgba(124,58,237,0.15)' : 'transparent'}; color: ${activeTab() === 'register' ? '#fff' : 'var(--text-muted)'}; border: ${activeTab() === 'register' ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent'}; text-shadow: ${activeTab() === 'register' ? '0 0 10px rgba(124,58,237,0.5)' : 'none'};`}
            onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            ➕ 新規登録
          </button>
        </div>

        {/* Message Notifications */}
        <Show when={errorMsg()}>
          <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); padding: 0.75rem 1rem; border-radius: var(--radius-md); color: #f87171; font-size: 0.85rem; margin-bottom: 1.25rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; animation: fadeIn 0.3s ease;">
            ⚠️ {errorMsg()}
          </div>
        </Show>
        <Show when={successMsg()}>
          <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 0.75rem 1rem; border-radius: var(--radius-md); color: #34d399; font-size: 0.85rem; margin-bottom: 1.25rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; animation: fadeIn 0.3s ease;">
            ✅ {successMsg()}
          </div>
        </Show>

        {/* Form switcher */}
        <Show when={activeTab() === 'login'}>
          <form onSubmit={handleLogin} style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Username</label>
              <input
                type="text"
                class="input-text"
                placeholder="ユーザー名を入力してください"
                value={loginUsername()}
                onInput={(e) => setLoginUsername(e.currentTarget.value)}
                required
                disabled={loading()}
                style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); width: 100%; box-sizing: border-box;"
              />
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Password</label>
              <input
                type="password"
                class="input-text"
                placeholder="パスワードを入力してください"
                value={loginPassword()}
                onInput={(e) => setLoginPassword(e.currentTarget.value)}
                required
                disabled={loading()}
                style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); width: 100%; box-sizing: border-box;"
              />
            </div>
            
            <button
              type="submit"
              class="btn-primary"
              disabled={loading()}
              style="width: 100%; padding: 0.75rem; font-size: 0.9rem; font-weight: 700; border-radius: var(--radius-md); display: flex; justify-content: center; align-items: center; height: auto;"
            >
              <Show when={loading()} fallback="🔑 ログイン">
                <span class="loading-spinner" style="display: inline-block; width: 1.2rem; height: 1.2rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s infinite linear;"></span>
              </Show>
            </button>
          </form>
        </Show>

        <Show when={activeTab() === 'register'}>
          <form onSubmit={handleRegister} style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Username</label>
              <input
                type="text"
                class="input-text"
                placeholder="半角英数字で入力してください"
                value={regUsername()}
                onInput={(e) => setRegUsername(e.currentTarget.value)}
                required
                disabled={loading()}
                style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); width: 100%; box-sizing: border-box;"
              />
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Password</label>
              <input
                type="password"
                class="input-text"
                placeholder="パスワードを設定してください"
                value={regPassword()}
                onInput={(e) => setRegPassword(e.currentTarget.value)}
                required
                disabled={loading()}
                style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); width: 100%; box-sizing: border-box;"
              />
            </div>
            
            {/* Avatar picker */}
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">Choose Avatar</label>
              <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.5rem;">
                <For each={avatarOptions}>
                  {(emoji) => (
                    <button
                      type="button"
                      onClick={() => setRegAvatar(emoji)}
                      style={`font-size: 1.25rem; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: ${regAvatar() === emoji ? 'rgba(124,58,237,0.25)' : 'rgba(0,0,0,0.2)'}; border: ${regAvatar() === emoji ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.08)'}; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; transform: ${regAvatar() === emoji ? 'scale(1.1)' : 'scale(1)'}; box-shadow: ${regAvatar() === emoji ? '0 0 10px rgba(124,58,237,0.3)' : 'none'};`}
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
                <span class="loading-spinner" style="display: inline-block; width: 1.2rem; height: 1.2rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 1s infinite linear;"></span>
              </Show>
            </button>
          </form>
        </Show>

        {/* Demo Credentials Tip */}
        <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.25rem; text-align: center;">
          <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
            💡 <strong style="color: #fff;">デモ用アカウント:</strong><br />
            ユーザー名: <span style="font-family: monospace; color: var(--color-secondary); background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">admin</span> / パスワード: <span style="font-family: monospace; color: var(--color-secondary); background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">admin</span><br />
            ユーザー名: <span style="font-family: monospace; color: var(--color-secondary); background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">user1</span> / パスワード: <span style="font-family: monospace; color: var(--color-secondary); background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">user1</span>
          </p>
        </div>

      </div>
    </div>
  );
}
