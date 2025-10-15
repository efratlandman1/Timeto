import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken } from '../utils/auth';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1';

export const fetchPromoAds = createAsyncThunk(
  'promoAds/fetchPromoAds',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryObj = { status: 'all', ...params };
      const qs = new URLSearchParams(queryObj).toString();
      const res = await fetch(`${API_BASE}/promo-ads?${qs}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to fetch promo ads');
      return json.data;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const createPromoAd = createAsyncThunk(
  'promoAds/createPromoAd',
  async (formData, { rejectWithValue }) => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/promo-ads`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData
      });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to create promo ad');
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
  error: null
};

const promoAdsSlice = createSlice({
  name: 'promoAds',
  initialState,
  reducers: {
    clearPromoAds(state) {
      state.items = [];
      state.pagination = { total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromoAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromoAds.fulfilled, (state, action) => {
        const { ads, pagination } = action.payload;
        if (pagination.page > 1) {
          state.items = [...state.items, ...ads];
        } else {
          state.items = ads;
        }
        state.pagination = pagination;
        state.loading = false;
      })
      .addCase(fetchPromoAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading promo ads';
      })
      .addCase(createPromoAd.fulfilled, (state, action) => {
        state.items = [action.payload, ...state.items];
      });
  }
});

export const { clearPromoAds } = promoAdsSlice.actions;
export default promoAdsSlice.reducer;


