import { logger } from '../utils/logger.js';

let ioInstance = null;

/**
 * Register the initialized Socket.IO server instance
 */
export const setIO = (io) => {
  ioInstance = io;
  logger.info('Socket.IO instance successfully registered in socketService');
};

/**
 * Retrieve the current Socket.IO instance
 */
export const getIO = () => {
  return ioInstance;
};

/**
 * Emit an event to a specific user's private room
 * @param {string|ObjectId} userId
 * @param {string} event
 * @param {any} data
 */
export const emitToUser = (userId, event, data) => {
  if (!ioInstance) {
    logger.debug(`Socket.IO not initialized; skipping emit to user:${userId} event:${event}`);
    return;
  }

  const room = `user:${userId.toString()}`;
  ioInstance.to(room).emit(event, data);
  logger.debug(`Socket emitted ${event} to room ${room}`);
};

/**
 * Emit an event to all connected sockets
 * @param {string} event
 * @param {any} data
 */
export const broadcast = (event, data) => {
  if (!ioInstance) {
    logger.debug(`Socket.IO not initialized; skipping broadcast event:${event}`);
    return;
  }

  ioInstance.emit(event, data);
  logger.debug(`Socket broadcast ${event}`);
};
