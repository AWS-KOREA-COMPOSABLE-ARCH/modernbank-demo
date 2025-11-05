// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import customerReducer from './customerSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        customer: customerReducer,
    },
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools only in development
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
