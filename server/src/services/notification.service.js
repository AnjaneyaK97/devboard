import { Notification } from '../models/Notification.js';
import { emitToUser } from './socket.service.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Create and persist a notification, then emit real-time Socket.IO event
 */
export const createNotification = async ({ user, type, title, message, link = '', data = {} }) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    link,
    data,
  });

  // Calculate new unread count
  const unreadCount = await Notification.countDocuments({ user, read: false });

  // Real-time delivery
  try {
    emitToUser(user, 'notification:new', notification);
    emitToUser(user, 'notification:unread_count', { unreadCount });
  } catch (err) {
    logger.warn(`Failed to push real-time notification to user ${user}: ${err.message}`);
  }

  return notification;
};

/**
 * Fetch paginated notifications for user with total unread count
 */
export const getUserNotifications = async (userId, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const unreadOnly = options.unreadOnly === true || options.unreadOnly === 'true';

  const filter = { user: userId };
  if (unreadOnly) {
    filter.read = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  const unreadCount = await Notification.countDocuments({ user: userId, read: false });
  emitToUser(userId, 'notification:unread_count', { unreadCount });

  return { notification, unreadCount };
};

/**
 * Mark all notifications for a user as read
 */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  emitToUser(userId, 'notification:unread_count', { unreadCount: 0 });

  return { success: true, unreadCount: 0 };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  const unreadCount = await Notification.countDocuments({ user: userId, read: false });
  emitToUser(userId, 'notification:unread_count', { unreadCount });

  return { success: true, unreadCount };
};
