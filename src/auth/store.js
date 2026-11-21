// Tiny auth store (no library): keeps the JWT, decodes display info from it, and auto-signs-out at expiry.
// The token lives in sessionStorage so it is cleared when the tab closes.
// Note: the decoded role is for the UI only. The gateway is what actually enforces access.
const KEY = 'studenthub.token';

function b64urlToString(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function decodeToken(token) {
  try {
    const claims = JSON.parse(b64urlToString(token.split('.')[1]));
    if (!claims.exp) return null;
    return { username: claims.sub || 'user', role: claims.role || 'ROLE_STUDENT', exp: claims.exp * 1000 };
  } catch {
    return null;
  }
}

let state = { token: null, user: null, notice: '' };
const listeners = new Set();
let timer = null;

function set(next) {
  state = next;
  listeners.forEach((l) => l());
}

function schedule(exp) {
  clearTimeout(timer);
  const ms = Math.min(Math.max(exp - Date.now(), 0), 2 ** 31 - 1);
  timer = setTimeout(() => authStore.signOut('Your session has expired. Please sign in again.'), ms);
}

export const authStore = {
  getSnapshot: () => state,
  getToken: () => state.token,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  signIn(token) {
    const user = decodeToken(token);
    if (!user || user.exp <= Date.now()) throw new Error('The server returned an invalid token.');
    try { sessionStorage.setItem(KEY, token); } catch { /* storage unavailable */ }
    schedule(user.exp);
    set({ token, user, notice: '' });
  },
  signOut(notice = '') {
    clearTimeout(timer);
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    set({ token: null, user: null, notice });
  },
};

// restore a still-valid session after a page refresh
try {
  const saved = sessionStorage.getItem(KEY);
  const user = saved && decodeToken(saved);
  if (user && user.exp > Date.now()) {
    schedule(user.exp);
    state = { token: saved, user, notice: '' };
  }
} catch { /* ignore */ }
