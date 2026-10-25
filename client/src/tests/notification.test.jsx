import { describe, it, expect } from 'vitest';
import notificationReducer, {
  notificationReceived,
  unreadCountUpdated,
  toggleDropdown,
  closeDropdown,
} from '../redux/slices/notificationSlice.js';

describe('Notification Redux Slice Tests', () => {
  const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isOpen: false,
  };

  it('should handle notificationReceived by prepending notification and incrementing unreadCount', () => {
    const newNotif = {
      _id: 'notif-1',
      type: 'application_received',
      title: 'New Applicant',
      message: 'John Doe applied',
      read: false,
    };

    const nextState = notificationReducer(initialState, notificationReceived(newNotif));

    expect(nextState.notifications.length).toBe(1);
    expect(nextState.notifications[0]._id).toBe('notif-1');
    expect(nextState.unreadCount).toBe(1);
  });

  it('should handle unreadCountUpdated', () => {
    const nextState = notificationReducer(initialState, unreadCountUpdated(5));
    expect(nextState.unreadCount).toBe(5);
  });

  it('should toggle and close notification dropdown', () => {
    let state = notificationReducer(initialState, toggleDropdown());
    expect(state.isOpen).toBe(true);

    state = notificationReducer(state, toggleDropdown());
    expect(state.isOpen).toBe(false);

    state = notificationReducer(state, toggleDropdown());
    expect(state.isOpen).toBe(true);

    state = notificationReducer(state, closeDropdown());
    expect(state.isOpen).toBe(false);
  });
});
