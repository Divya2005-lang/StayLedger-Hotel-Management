import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { notice: null },
  reducers: {
    // Each call creates a new object, so repeated notices restart the auto-dismiss timer.
    showNotice(state, { payload }) {
      state.notice = { kind: 'success', ...payload };
    },
    hideNotice(state) {
      state.notice = null;
    },
  },
});

export const { showNotice, hideNotice } = uiSlice.actions;
export default uiSlice.reducer;
