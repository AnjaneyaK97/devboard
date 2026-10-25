import { io } from 'socket.io-client';
import { notificationReceived, unreadCountUpdated } from '../redux/slices/notificationSlice.js';
import { addToast } from '../redux/slices/uiSlice.js';

let socket = null;

const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
  : 'http://localhost:5000';

/**
 * Initialize socket connection and register room listeners
 */
export const connectSocket = (userId, dispatch) => {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join_user', userId);
    }
  });

  // Real-time Notification received
  socket.on('notification:new', (notification) => {
    if (dispatch) {
      dispatch(notificationReceived(notification));
      dispatch(
        addToast({
          type: 'info',
          message: notification.title,
        })
      );
    }
  });

  // Unread count update
  socket.on('notification:unread_count', ({ unreadCount }) => {
    if (dispatch) {
      dispatch(unreadCountUpdated(unreadCount));
    }
  });

  // New application alert for employer
  socket.on('application:new', (data) => {
    if (dispatch) {
      dispatch(
        addToast({
          type: 'info',
          message: `New applicant for ${data.jobTitle}: ${data.applicant?.name || 'Candidate'}`,
        })
      );
    }
  });

  // Application status update for candidate
  socket.on('application:status_updated', (data) => {
    if (dispatch) {
      const formattedStatus = data.newStatus.replace('_', ' ').toUpperCase();
      dispatch(
        addToast({
          type: 'success',
          message: `Application update: ${data.jobTitle} is now ${formattedStatus}`,
        })
      );
    }
  });

  return socket;
};

/**
 * Disconnect socket on user logout
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
