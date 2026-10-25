import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Notification } from '../../src/models/Notification.js';
import { SavedSearch } from '../../src/models/SavedSearch.js';
import { setupTestDB } from '../setup.js';

describe('Notification & Saved Search API Integration Tests', () => {
  setupTestDB();

  let seekerToken;
  let seekerUser;

  beforeEach(async () => {

    // Register test seeker
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Notification Seeker',
        email: 'jane.notif@example.com',
        password: 'Password123!',
        role: 'seeker',
      });

    seekerToken = res.body.data.accessToken;
    seekerUser = res.body.data.user;
  });

  describe('GET /api/v1/notifications', () => {
    it('should return empty list when no notifications exist', async () => {
      // Clear welcome notification to test baseline
      await Notification.deleteMany({ user: seekerUser._id });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.unreadCount).toBe(0);
    });

    it('should return welcome notification created at registration', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.notifications[0].title).toBe('Welcome to DevBoard!');
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark a specific notification as read and update unread count', async () => {
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${seekerToken}`);

      const notifId = listRes.body.data.notifications[0]._id;

      const updateRes = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.notification.read).toBe(true);
      expect(updateRes.body.data.unreadCount).toBe(0);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      await Notification.create({
        user: seekerUser._id,
        type: 'system',
        title: 'System Notice',
        message: 'Maintenance tonight',
      });

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.unreadCount).toBe(0);

      const checkRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(checkRes.body.data.unreadCount).toBe(0);
      expect(checkRes.body.data.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('Saved Searches API', () => {
    it('should create and retrieve a saved search', async () => {
      const createRes = await request(app)
        .post('/api/v1/saved-searches')
        .set('Authorization', `Bearer ${seekerToken}`)
        .send({
          title: 'Fullstack Remote Alert',
          criteria: {
            keyword: 'fullstack',
            remote: true,
            salaryMin: 90000,
          },
          alertFrequency: 'immediate',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.savedSearch.title).toBe('Fullstack Remote Alert');

      const getRes = await request(app)
        .get('/api/v1/saved-searches')
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.savedSearches.length).toBe(1);
      expect(getRes.body.data.savedSearches[0].criteria.remote).toBe(true);

      const searchId = getRes.body.data.savedSearches[0]._id;

      // Delete saved search
      const delRes = await request(app)
        .delete(`/api/v1/saved-searches/${searchId}`)
        .set('Authorization', `Bearer ${seekerToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.success).toBe(true);
    });
  });
});
