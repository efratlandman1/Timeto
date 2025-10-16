import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken } from '../utils/auth';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1';

export const togglePromoFavorite = createAsyncThunk(
  'promoFavorites/toggle',
  async (promoAdId, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/promo-favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ promoAdId })
      });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to toggle favorite');
      return { promoAdId, active: json.data.active };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchMyPromoFavorites = createAsyncThunk(
  'promoFavorites/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/promo-favorites/my`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to load favorites');
      return json.data.favorites;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const promoFavoritesSlice = createSlice({
  name: 'promoFavorites',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPromoFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPromoFavorites.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchMyPromoFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading favorites';
      })
      .addCase(togglePromoFavorite.fulfilled, (state, action) => {
        const { promoAdId, active } = action.payload;
        if (!active) {
          state.items = state.items.filter(f => f.promoAdId?._id !== promoAdId && f.promoAdId !== promoAdId);
        }
      });
  }
});

export default promoFavoritesSlice.reducer;


