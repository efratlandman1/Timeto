import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  services: [],            // רשימת כל השירותים עם id + name
  selectedServices: [],    // שירותים שנבחרו (אובייקטים עם id + name)
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices(state, action) {
      state.services = action.payload;
    },
    selectService(state, action) {
      // action.payload = { id, name }
      if (!state.selectedServices.find(s => s.id === action.payload.id)) {
        state.selectedServices.push(action.payload);
      }
    },
    deselectService(state, action) {
      // action.payload = { id }
      state.selectedServices = state.selectedServices.filter(s => s.id !== action.payload.id);
    },
    clearSelectedServices(state) {
      state.selectedServices = [];
    },
  },
});

export const { setServices, selectService, deselectService, clearSelectedServices } = servicesSlice.actions;

export default servicesSlice.reducer;
