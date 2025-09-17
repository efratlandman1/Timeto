import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1';

export const fetchSaleAds = createAsyncThunk(
  'saleAds/fetchSaleAds',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/sale-ads?${qs}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to fetch sale ads');
      return json.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const createSaleAd = createAsyncThunk(
  'saleAds/createSaleAd',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/sale-ads`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to create sale ad');
      return json.data.ad;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const initialState = {
  items: [],
  pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false },
  loading: false,
  error: null,
  filters: { q: '', categoryId: '', minPrice: '', maxPrice: '', sort: 'newest' }
};

const saleAdsSlice = createSlice({
  name: 'saleAds',
  initialState,
  reducers: {
    setSaleAdsFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSaleAds(state) {
      state.items = [];
      state.pagination = { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleAds.fulfilled, (state, action) => {
        const { ads, pagination } = action.payload;
        // Infinite scroll append
        if (pagination.page > 1) {
          state.items = [...state.items, ...ads];
        } else {
          state.items = ads;
        }
        state.pagination = pagination;
        state.loading = false;
      })
      .addCase(fetchSaleAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading sale ads';
      })
      .addCase(createSaleAd.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      });
  }
});

export const { setSaleAdsFilters, clearSaleAds } = saleAdsSlice.actions;
export default saleAdsSlice.reducer;


