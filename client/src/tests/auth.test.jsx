import { describe, it, expect } from 'vitest';
import uiReducer, { toggleTheme, setTheme } from '../redux/slices/uiSlice.js';
import authReducer, { setCredentials, logoutAction } from '../redux/slices/authSlice.js';

describe('Redux Slices Unit Tests', () => {
  describe('UI Slice (Theme & Dark Mode)', () => {
    it('should toggle theme from light to dark', () => {
      const initialState = { theme: 'light', toast: null };
      const nextState = uiReducer(initialState, toggleTheme());
      expect(nextState.theme).toBe('dark');
    });

    it('should explicitly set theme', () => {
      const initialState = { theme: 'light', toast: null };
      const nextState = uiReducer(initialState, setTheme('dark'));
      expect(nextState.theme).toBe('dark');
    });
  });

  describe('Auth Slice (Session & Token Management)', () => {
    it('should set credentials upon successful login', () => {
      const initialState = {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

      const mockPayload = {
        user: { _id: '123', name: 'Test User', email: 'test@example.com', role: 'seeker' },
        accessToken: 'mock_jwt_access_token_xyz',
      };

      const nextState = authReducer(initialState, setCredentials(mockPayload));
      expect(nextState.isAuthenticated).toBe(true);
      expect(nextState.user.name).toBe('Test User');
      expect(nextState.accessToken).toBe('mock_jwt_access_token_xyz');
    });

    it('should clear state on logout', () => {
      const loggedInState = {
        user: { name: 'Active User' },
        accessToken: 'token_abc',
        isAuthenticated: true,
        loading: false,
        error: null,
      };

      const nextState = authReducer(loggedInState, logoutAction());
      expect(nextState.isAuthenticated).toBe(false);
      expect(nextState.user).toBeNull();
      expect(nextState.accessToken).toBeNull();
    });
  });
});
