import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken } from '../utils/auth';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1';

export const toggleSaleFavorite = createAsyncThunk(
  'saleFavorites/toggle',
  async (saleAdId, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/sale-favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ saleAdId })
      });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to toggle favorite');
      return { saleAdId, active: json.data.active };
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const fetchMySaleFavorites = createAsyncThunk(
  'saleFavorites/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/sale-favorites/my`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to load favorites');
      return json.data.favorites;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const saleFavoritesSlice = createSlice({
  name: 'saleFavorites',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMySaleFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMySaleFavorites.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchMySaleFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading favorites';
      })
      .addCase(toggleSaleFavorite.fulfilled, (state, action) => {
        const { saleAdId, active } = action.payload;
        if (!active) {
          state.items = state.items.filter(f => f.saleAdId?._id !== saleAdId && f.saleAdId !== saleAdId);
        }
      });
  }
});

export default saleFavoritesSlice.reducer;


