import { useState } from 'react';
import './auth-extra.css';
import { authApi } from '../api/index.js';
import { authStore } from '../auth/store.js';
import { useAuth } from '../hooks/useAuth.js';
import Icon from '../components/Icon.jsx';
import AuthHero from '../components/AuthHero.jsx';
import { DEMO } from '../demo/mockApi.js';
import DemoLogins from '../components/DemoLogins.jsx';
import DemoInbox from '../components/DemoInbox.jsx';

// New accounts are always created as students by the gateway. Admins are promoted in the database.
const ROLE_PICKER = false; // the gateway now ignores any role sent by the client
const EMAIL_OK = /^\S+@\S+\.\S{2,}$/;

// mode: 'login' | 'register' | 'forgot'
export default function Auth({ mode }) {
  const register = mode === 'register';
  const forgot = mode === 'forgot';
  const { notice } = useAuth();
  const [v, setV] = useState({ username: '', email: '', password: '', confirm: '', identifier: '', role: 'ROLE_STUDENT' });
  const [err, setErr] = useState({});
  const [serverError, setServerError] = useState('');
  const [sent, setSent] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (forgot) {
      const identifier = v.identifier.trim();
      if (!identifier) { setErr({ identifier: 'Enter your username or e-mail' }); return; }
      setErr({});
      setBusy(true);
      try {
        const r = await authApi.forgotPassword(identifier);
        setSent(r.message);
      } catch (ex) {
        setServerError(ex.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    const next = {};
    if (v.username.trim().length < 3) next.username = 'Use at least 3 characters';
    if (!v.password) next.password = 'Password is required';
    else if (register && v.password.length < 6) next.password = 'Use at least 6 characters';
    if (register && v.confirm !== v.password) next.confirm = 'Passwords do not match';
    if (register && v.email.trim() && !EMAIL_OK.test(v.email.trim())) next.email = 'Enter a valid e-mail address';
    setErr(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const username = v.username.trim();
      if (register) {
        await authApi.register({ username, password: v.password, ...(v.email.trim() ? { email: v.email.trim() } : {}), ...(ROLE_PICKER ? { role: v.role } : {}) });
      }
      const { token } = await authApi.login(username, v.password);
      authStore.signIn(token);
      window.location.hash = '#/';
    } catch (ex) {
      setServerError(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const heading = forgot ? 'Forgot your password?' : register ? 'Create your account' : 'Welcome back';
  const subtitle = forgot
    ? 'Enter your username or the e-mail address you registered with. We will send you a link to choose a new password.'
    : register ? 'Register to use the student management dashboard.' : 'Sign in to manage students and courses.';

  return (
    <div className="auth-wrap">
      <AuthHero />
      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <span>Student<b>Hub</b></span>
        </div>
        <h1>{heading}</h1>
        <p className="muted">{subtitle}</p>

        {!register && !forgot && notice && <div className="banner"><Icon name="alert" size={18} /><span>{notice}</span></div>}
        {serverError && <div className="banner danger" role="alert"><Icon name="alert" size={18} /><span>{serverError}</span></div>}

        {forgot ? (
          sent ? (
            <div role="status">
              <div className="banner ok"><Icon name="check" size={18} /><span>{sent}</span></div>
              {DEMO && <DemoInbox identifier={v.identifier.trim()} />}
              <p className="muted auth-hint">The link works once and expires soon. Nothing arrived after a few minutes? Check your spam folder, or try again.</p>
              <div className="auth-actions">
                <a className="btn primary wide" href="#/login">Back to sign in</a>
              </div>
            </div>
          ) : (
            <>
              <label className="field">
                <span>Username or e-mail</span>
                <input value={v.identifier} onChange={set('identifier')} autoComplete="username" autoFocus />
                {err.identifier && <em>{err.identifier}</em>}
              </label>
              <p className="muted auth-hint">Accounts created without an e-mail address cannot receive a link. Ask your administrator for help in that case.</p>
              {DEMO && <p className="muted auth-hint">Demo site: no real e-mail is sent. After you click the button, a simulated inbox shows the e-mail with a working reset link. Try the e-mail you used at sign-up, or <b>admin</b> / <b>student</b>.</p>}
              <button className="btn primary wide" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Send reset link'}</button>
              <p className="auth-switch muted">Remembered it? <a href="#/login">Back to sign in</a></p>
            </>
          )
        ) : (
          <>
            <label className="field">
              <span>Username</span>
              <input value={v.username} onChange={set('username')} autoComplete="username" autoFocus />
              {err.username && <em>{err.username}</em>}
            </label>
            {register && (
              <label className="field">
                <span>E-mail <small className="muted">(optional, used only to reset your password)</small></span>
                <input type="email" value={v.email} onChange={set('email')} autoComplete="email" />
                {err.email && <em>{err.email}</em>}
              </label>
            )}
            <label className="field">
              <span>Password</span>
              <input type="password" value={v.password} onChange={set('password')} autoComplete={register ? 'new-password' : 'current-password'} />
              {err.password && <em>{err.password}</em>}
            </label>
            {!register && <a className="forgot-link" href="#/forgot-password">Forgot password?</a>}
            {register && (
              <label className="field">
                <span>Confirm password</span>
                <input type="password" value={v.confirm} onChange={set('confirm')} autoComplete="new-password" />
                {err.confirm && <em>{err.confirm}</em>}
              </label>
            )}
            {DEMO && register && <p className="muted auth-hint">Demo site: use any made-up password. Accounts are saved only in this browser.</p>}
            {register && ROLE_PICKER && (
              <label className="field">
                <span>Role <small className="muted">(development only)</small></span>
                <select value={v.role} onChange={set('role')}>
                  <option value="ROLE_STUDENT">Student: courses only</option>
                  <option value="ROLE_ADMIN">Admin: students and courses</option>
                </select>
              </label>
            )}

            <button className="btn primary wide" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
            </button>
            {DEMO && !register && <DemoLogins />}
            <p className="auth-switch muted">
              {register ? <>Already have an account? <a href="#/login">Sign in</a></> : <>New here? <a href="#/register">Create an account</a></>}
            </p>
          </>
        )}
      </form>
    </div>
  );
}
