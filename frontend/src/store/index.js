import { configureStore } from '@reduxjs/toolkit';
import auth, { logout } from './authSlice.js';
import hotels from './hotelsSlice.js';
import ui from './uiSlice.js';
import { setUnauthorizedHandler } from '../api/client.js';

export const store = configureStore({ reducer: { auth, hotels, ui } });

// When the server rejects a stored token (expired or revoked), sign out so the UI stops offering admin actions.
setUnauthorizedHandler(() => store.dispatch(logout()));
