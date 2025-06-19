import { configureStore } from '@reduxjs/toolkit';
import businessReducer from './businessSlice';
import userReducer from './userSlice';
import servicesReducer from './servicesSlice';
import locationReducer from './locationSlice';


const store = configureStore({
    reducer: {
        business: businessReducer,
        user: userReducer,
        services: servicesReducer,
        location: locationReducer
    }
});

export default store;
