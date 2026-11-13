import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi, tokenStore } from '../api/client.js';

/** Reads the username and expiry from a token. This only drives the UI; the server is what enforces access. */
function readToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part));
    if (payload.role !== 'admin' || payload.exp * 1000 <= Date.now()) return null;
    return { username: payload.sub, expiresAt: payload.exp * 1000 };
  } catch {
    return null;
  }
}

const restore = () => {
  const token = tokenStore.get();
  const info = token ? readToken(token) : null;
  if (token && !info) tokenStore.clear();
  return info ? { token, username: info.username, expiresAt: info.expiresAt } : { token: '', username: '', expiresAt: 0 };
};

export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const { token, admin } = await authApi.login(username, password);
    tokenStore.set(token);
    return { token, username: admin.username, expiresAt: readToken(token)?.expiresAt ?? 0 };
  } catch (err) {
    return rejectWithValue({ status: err.status, message: err.message, errors: err.errors || {} });
  }
});

/** Asks the server whether the stored token is still accepted (the 401 handler signs out if not). */
export const verifySession = createAsyncThunk('auth/verify', async (_, { getState }) => {
  if (!getState().auth.token) return null;
  await authApi.me();
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { ...restore(), status: 'idle', error: '', fieldErrors: {} },
  reducers: {
    logout(state) {
      tokenStore.clear();
      state.token = '';
      state.username = '';
      state.expiresAt = 0;
    },
    clearAuthError(state) {
      state.error = '';
      state.fieldErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = '';
        state.fieldErrors = {};
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = 'idle';
        state.token = payload.token;
        state.username = payload.username;
        state.expiresAt = payload.expiresAt;
      })
      .addCase(login.rejected, (state, { payload, error }) => {
        state.status = 'idle';
        state.error = payload?.message || error.message;
        state.fieldErrors = payload?.errors || {};
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const selectIsAdmin = (state) => Boolean(state.auth.token && state.auth.username);
export default authSlice.reducer;
