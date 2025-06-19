import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to get user location
export const fetchUserLocation = createAsyncThunk(
  'location/fetchUserLocation',
  async (_, { rejectWithValue }) => {
    if (!navigator.geolocation) {
      return rejectWithValue('המכשיר לא תומך במיקום');
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          reject(rejectWithValue('לא ניתן לקבל מיקום. יש לאפשר גישה למיקום בדפדפן.'));
        }
      );
    });
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    coords: null, // { lat, lng }
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLocation.fulfilled, (state, action) => {
        state.coords = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'שגיאה לא ידועה';
      });
  }
});

export default locationSlice.reducer;
