import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { hotelsApi } from '../api/client.js';

export const PAGE_SIZE = 6;

const asRejection = (err, rejectWithValue) =>
  rejectWithValue({ status: err.status, message: err.message, errors: err.errors || {} });

export const fetchHotels = createAsyncThunk('hotels/fetchList', async (_, { getState, rejectWithValue }) => {
  const { filters, page, pageSize } = getState().hotels;
  try {
    return await hotelsApi.list({
      title: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

export const fetchHotelById = createAsyncThunk('hotels/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return (await hotelsApi.get(id)).data;
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

export const createHotel = createAsyncThunk('hotels/create', async (formData, { rejectWithValue }) => {
  try {
    return (await hotelsApi.create(formData)).data;
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

export const updateHotel = createAsyncThunk('hotels/update', async ({ id, formData }, { rejectWithValue }) => {
  try {
    return (await hotelsApi.update(id, formData)).data;
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

export const deleteHotel = createAsyncThunk('hotels/delete', async (id, { rejectWithValue }) => {
  try {
    await hotelsApi.remove(id);
    return id;
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

export const fetchStats = createAsyncThunk('hotels/fetchStats', async (_, { rejectWithValue }) => {
  try {
    return (await hotelsApi.stats()).data;
  } catch (err) {
    return asRejection(err, rejectWithValue);
  }
});

const emptyFilters = { search: '', minPrice: '', maxPrice: '' };

const initialState = {
  items: [],
  total: 0,
  listStatus: 'idle', // idle | loading | succeeded | failed
  listError: null,
  listRequestId: null,
  filters: { ...emptyFilters },
  page: 1,
  pageSize: PAGE_SIZE,
  current: null,
  currentStatus: 'idle',
  currentError: null,
  saving: false,
  deleting: false,
  stats: null,
};

const hotelsSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    setFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
      state.page = 1;
    },
    resetFilters(state) {
      state.filters = { ...emptyFilters };
      state.page = 1;
    },
    setPage(state, { payload }) {
      state.page = Math.max(1, payload);
    },
    clearCurrent(state) {
      state.current = null;
      state.currentStatus = 'idle';
      state.currentError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchHotels.pending, (state, action) => {
        state.listStatus = 'loading';
        state.listError = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return; // a newer request superseded this one
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.listStatus = 'succeeded';
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.listStatus = 'failed';
        state.listError = action.payload?.message || action.error.message;
      })
      // admin summary
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // single
      .addCase(fetchHotelById.pending, (state) => {
        state.currentStatus = 'loading';
        state.currentError = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.current = action.payload;
        state.currentStatus = 'succeeded';
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.current = null;
        state.currentStatus = 'failed';
        state.currentError = action.payload || { status: 0, message: action.error.message };
      })
      // create / update
      .addCase(createHotel.pending, (state) => {
        state.saving = true;
      })
      .addCase(createHotel.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createHotel.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateHotel.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
      })
      .addCase(updateHotel.rejected, (state) => {
        state.saving = false;
      })
      // delete
      .addCase(deleteHotel.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteHotel.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteHotel.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export const { setFilters, resetFilters, setPage, clearCurrent } = hotelsSlice.actions;
export default hotelsSlice.reducer;
