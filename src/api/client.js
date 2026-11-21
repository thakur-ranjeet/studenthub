import { authStore } from '../auth/store.js';
import { DEMO, demoFetch } from '../demo/mockApi.js';

const BASE = import.meta.env.VITE_API_BASE_URL || '';
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function friendlyMessage(data, status) {
  // gateway errors: { status, error, message, path }  ·  auth errors: { error }  ·  services: { message }
  const raw = data && typeof data === 'object' ? data.message || data.error : typeof data === 'string' ? data : '';
  if (raw === 'No value present') return 'Record not found.';
  if (raw && raw.length < 200) return raw;
  if (status === 401) return 'You are not signed in.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'Not found.';
  if (status === 502 || status === 503 || status === 504) {
    return 'The service is unavailable. Check that it is running and registered in Eureka.';
  }
  return `Request failed (${status}).`;
}

// auth: false is used for /auth/login and /auth/register (no token, and a 401 there just means "wrong password")
export async function request(path, { method = 'GET', body, auth = true, timeoutMs = TIMEOUT_MS } = {}) {
  // Demo mode (GitHub Pages, no server): the in-browser mock answers with the same JSON as the gateway.
  if (DEMO) {
    try {
      return await demoFetch(path, { method, body, token: auth ? authStore.getToken() : null });
    } catch (e) {
      if (e.status === 401 && auth) authStore.signOut('Your session has expired. Please sign in again.');
      throw new ApiError(e.message, e.status || 500);
    }
  }

  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const token = authStore.getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  // Never spin forever: give up if the gateway or a service does not answer in time.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  let text;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    text = await res.text();
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. The API gateway or one of the services may be down or stuck.', 0);
    }
    throw new ApiError('Cannot reach the API gateway (port 8083). Is the backend running?', 0);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      // expired or invalid token: drop the session so the app shows the sign-in page
      authStore.signOut('Your session has expired. Please sign in again.');
    }
    throw new ApiError(friendlyMessage(data, res.status), res.status);
  }
  return data;
}
