import { useState } from 'react';
import { authApi } from '../api/index.js';
import { authStore } from '../auth/store.js';
import { DEMO_ACCOUNTS } from '../demo/seed.js';
import '../demo/demo.css';

// Demo mode only: sign in as a ready-made account with one click.
export default function DemoLogins() {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const go = async (key) => {
    const acct = DEMO_ACCOUNTS[key];
    setBusy(key);
    setError('');
    try {
      const { token } = await authApi.login(acct.username, acct.password);
      authStore.signIn(token);
      window.location.hash = '#/';
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  };

  return (
    <div className="demo-logins">
      <p className="demo-or"><span>or explore instantly</span></p>
      <div className="demo-login-row">
        <button type="button" className="btn wide" disabled={!!busy} onClick={() => go('admin')}>{busy === 'admin' ? 'Opening…' : 'Try as Admin'}</button>
        <button type="button" className="btn wide" disabled={!!busy} onClick={() => go('student')}>{busy === 'student' ? 'Opening…' : 'Try as Student'}</button>
      </div>
      {error && <p className="ai-error" role="alert">{error}</p>}
      <p className="muted demo-creds">Or type them: <b>admin</b> / Admin@123 · <b>student</b> / Student@123</p>
    </div>
  );
}
