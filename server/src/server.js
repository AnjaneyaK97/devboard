import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.js';

import { setIO } from './services/socket.service.js';

const httpServer = http.createServer(app);

// Initialize Socket.IO
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
});

setIO(io);

io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  socket.on('join_user', (userId) => {
    socket.join(`user:${userId}`);
    logger.debug(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Boot server
const startServer = async () => {
  await connectDB();

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 DevBoard API server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Health check available at http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });
};

// Graceful Shutdown Handlers
const handleShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  httpServer.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
