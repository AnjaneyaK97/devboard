import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark notification read');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.patch('/notifications/read-all');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/notifications/${notificationId}`);
      return { id: notificationId, ...res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isOpen: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationReceived: (state, action) => {
      // Prepend incoming notification and increment unread count
      state.notifications = [action.payload, ...state.notifications];
      state.unreadCount += 1;
    },
    unreadCountUpdated: (state, action) => {
      state.unreadCount = action.payload;
    },
    toggleDropdown: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeDropdown: (state) => {
      state.isOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const updated = action.payload.notification;
        state.notifications = state.notifications.map((n) =>
          n._id === updated._id ? { ...n, read: true } : n
        );
        state.unreadCount = action.payload.unreadCount;
      })
      // Mark all read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      // Delete
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter((n) => n._id !== action.payload.id);
        state.unreadCount = action.payload.unreadCount;
      });
  },
});

export const {
  notificationReceived,
  unreadCountUpdated,
  toggleDropdown,
  closeDropdown,
} = notificationSlice.actions;

export default notificationSlice.reducer;
