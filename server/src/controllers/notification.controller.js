import { asyncWrapper } from '../utils/asyncWrapper.js';
import * as notificationService from '../services/notification.service.js';

/**
 * GET /api/v1/notifications
 */
export const getMyNotifications = asyncWrapper(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user._id, req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
export const markNotificationRead = asyncWrapper(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * PATCH /api/v1/notifications/read-all
 */
export const markAllNotificationsRead = asyncWrapper(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * DELETE /api/v1/notifications/:id
 */
export const deleteNotification = asyncWrapper(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user._id);
  res.status(200).json({
    success: true,
    data: result,
  });
});
