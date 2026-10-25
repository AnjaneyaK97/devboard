import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import uiReducer from './slices/uiSlice.js';
import jobReducer from './slices/jobSlice.js';
import applicationReducer from './slices/applicationSlice.js';
import notificationReducer from './slices/notificationSlice.js';
import { injectStore } from '../services/api.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    jobs: jobReducer,
    applications: applicationReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

injectStore(store);
