import { configureStore } from '@reduxjs/toolkit';
import businessReducer from './businessSlice';
import userReducer from './userSlice';
import servicesReducer from './servicesSlice';


const store = configureStore({
    reducer: {
        business: businessReducer,
        user: userReducer,
        services: servicesReducer
    }
});

export default store;
