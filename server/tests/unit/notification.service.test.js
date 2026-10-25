import mongoose from 'mongoose';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../../src/services/notification.service.js';
import { Notification } from '../../src/models/Notification.js';
import { setupTestDB } from '../setup.js';

describe('Notification Service Unit Tests', () => {
  setupTestDB();

  const userId = new mongoose.Types.ObjectId();

  it('should create and persist a notification with unread status', async () => {
    const notif = await createNotification({
      user: userId,
      type: 'application_received',
      title: 'New Applicant',
      message: 'Jane Doe applied for Lead Architect',
      link: '/dashboard/employer',
    });

    expect(notif).toBeDefined();
    expect(notif.read).toBe(false);
    expect(notif.title).toBe('New Applicant');

    const inDb = await Notification.findById(notif._id);
    expect(inDb).not.toBeNull();
    expect(inDb.user.toString()).toBe(userId.toString());
  });

  it('should return paginated notifications and accurate unread count', async () => {
    await createNotification({ user: userId, type: 'system', title: 'Note 1', message: 'M1' });
    await createNotification({ user: userId, type: 'system', title: 'Note 2', message: 'M2' });
    const n3 = await createNotification({ user: userId, type: 'system', title: 'Note 3', message: 'M3' });

    // Mark n3 as read
    await Notification.findByIdAndUpdate(n3._id, { read: true });

    const result = await getUserNotifications(userId, { page: 1, limit: 10 });
    expect(result.notifications.length).toBe(3);
    expect(result.unreadCount).toBe(2);
    expect(result.pagination.total).toBe(3);
  });

  it('should mark a single notification as read', async () => {
    const notif = await createNotification({ user: userId, type: 'system', title: 'Read me', message: 'M' });
    expect(notif.read).toBe(false);

    const { notification, unreadCount } = await markAsRead(notif._id, userId);
    expect(notification.read).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it('should mark all notifications as read', async () => {
    await createNotification({ user: userId, type: 'system', title: '1', message: '1' });
    await createNotification({ user: userId, type: 'system', title: '2', message: '2' });

    const res = await markAllAsRead(userId);
    expect(res.success).toBe(true);
    expect(res.unreadCount).toBe(0);

    const unreadRemaining = await Notification.countDocuments({ user: userId, read: false });
    expect(unreadRemaining).toBe(0);
  });

  it('should delete a notification', async () => {
    const notif = await createNotification({ user: userId, type: 'system', title: 'To Delete', message: 'D' });
    const res = await deleteNotification(notif._id, userId);
    expect(res.success).toBe(true);

    const check = await Notification.findById(notif._id);
    expect(check).toBeNull();
  });
});
