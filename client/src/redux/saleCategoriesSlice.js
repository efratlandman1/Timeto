import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1';

export const fetchSaleCategories = createAsyncThunk(
  'saleCategories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/sale-categories`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return rejectWithValue(json?.message || 'Failed to load sale categories');
      return json.data.categories;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const saleCategoriesSlice = createSlice({
  name: 'saleCategories',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleCategories.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchSaleCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error loading categories';
      });
  }
});

export default saleCategoriesSlice.reducer;


