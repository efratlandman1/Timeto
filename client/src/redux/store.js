import { configureStore } from '@reduxjs/toolkit';
import businessReducer from './businessSlice';
import userReducer from './userSlice';

const store = configureStore({
    reducer: {
        business: businessReducer,
        user: userReducer,
    }
});

export default store;
