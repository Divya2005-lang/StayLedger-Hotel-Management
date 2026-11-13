const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const imageUrl = (path) => {
  if (!path) return '';
  return /^https?:\/\//i.test(path) ? path : `${BASE}${path}`;
};
const TOKEN_KEY = 'stayledger.token';
let memoryToken = '';

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY) || memoryToken;
    } catch {
      return memoryToken;
    }
  },
  set(token) {
    memoryToken = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode: the token lives in memory until the tab closes */
    }
  },
  clear() {
    memoryToken = '';
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to do */
    }
  },
};
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};
async function request(path, { auth = true, headers: extra, ...options } = {}) {
  const headers = new Headers(extra);
  const token = auth ? tokenStore.get() : '';
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw { status: 0, message: 'Cannot reach the server. Check that the API is running.', errors: {} };
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStore.clear();
      onUnauthorized();
    }
    throw {
      status: response.status,
      message: body?.message || `Request failed (${response.status}).`,
      errors: body?.errors || {},
    };
  }
  return body;
}

const toQuery = (params) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') qs.set(key, value);
  });
  const text = qs.toString();
  return text ? `?${text}` : '';
};

export const authApi = {
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      auth: false,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  me: () => request('/api/auth/me'),
};

export const hotelsApi = {
  list: (params) => request(`/api/hotels${toQuery(params)}`, { auth: false }),
  get: (id) => request(`/api/hotels/${id}`, { auth: false }),
  stats: () => request('/api/hotels/stats'),
  create: (formData) => request('/api/hotels', { method: 'POST', body: formData }),
  update: (id, formData) => request(`/api/hotels/${id}`, { method: 'PUT', body: formData }),
  remove: (id) => request(`/api/hotels/${id}`, { method: 'DELETE' }),
};
