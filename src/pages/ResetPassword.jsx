import { useEffect, useState } from 'react';
import './auth-extra.css';
import { authApi } from '../api/index.js';
import { authStore } from '../auth/store.js';
import { useAuth } from '../hooks/useAuth.js';
import Icon from '../components/Icon.jsx';
import AuthHero from '../components/AuthHero.jsx';

// Opened from the e-mailed link:  #/reset-password/<token>
export default function ResetPassword({ token }) {
  const { user } = useAuth();
  const [secret] = useState(token || ''); // keep the token in memory, then remove it from the address bar
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [serverError, setServerError] = useState('');
  const [linkProblem, setLinkProblem] = useState(!token);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // the token is not left behind in the browser's address bar or history
    if (window.location.hash !== '#/reset-password') window.history.replaceState(null, '', '#/reset-password');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (pw.length < 6) next.pw = 'Use at least 6 characters';
    else if (pw.length > 72) next.pw = 'Use at most 72 characters';
    if (confirm !== pw) next.confirm = 'Passwords do not match';
    setErr(next);
    setServerError('');
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await authApi.resetPassword(secret, pw);
      if (user) authStore.signOut(); // signed in on this device: ask for the new password
      setDone(true);
    } catch (ex) {
      setServerError(ex.message);
      setLinkProblem(/link/i.test(ex.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <AuthHero />
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <span>Student<b>Hub</b></span>
        </div>

        {done ? (
          <div role="status">
            <h1>Password updated</h1>
            <div className="banner ok"><Icon name="check" size={18} /><span>Your password was changed. Sign in with the new one.</span></div>
            <div className="auth-actions"><a className="btn primary wide" href="#/login">Sign in</a></div>
          </div>
        ) : linkProblem ? (
          <div role="alert">
            <h1>This link cannot be used</h1>
            <div className="banner danger"><Icon name="alert" size={18} /><span>{serverError || 'This reset link is not valid or has expired. Please request a new one.'}</span></div>
            <div className="auth-actions"><a className="btn primary wide" href="#/forgot-password">Request a new link</a></div>
            <p className="auth-switch muted"><a href="#/login">Back to sign in</a></p>
          </div>
        ) : (
          <>
            <h1>Choose a new password</h1>
            <p className="muted">Use at least 6 characters. You will use it the next time you sign in.</p>
            {serverError && <div className="banner danger" role="alert"><Icon name="alert" size={18} /><span>{serverError}</span></div>}

            <label className="field">
              <span>New password</span>
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => { setPw(e.target.value); setErr((x) => ({ ...x, pw: undefined, confirm: undefined })); }} autoComplete="new-password" autoFocus />
              {err.pw && <em>{err.pw}</em>}
            </label>
            <label className="field">
              <span>Confirm new password</span>
              <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); setErr((x) => ({ ...x, confirm: undefined })); }} autoComplete="new-password" />
              {err.confirm && <em>{err.confirm}</em>}
            </label>
            <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>

            <button className="btn primary wide" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Update password'}</button>
            <p className="auth-switch muted"><a href="#/login">Back to sign in</a></p>
          </>
        )}
      </form>
    </div>
  );
}
