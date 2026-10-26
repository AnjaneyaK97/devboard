import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/error.middleware.js';
import { AppError } from './utils/AppError.js';
import { setupSwagger } from './config/swagger.js';
import { sanitizeInput } from './middleware/sanitize.middleware.js';
import apiRoutes from './routes/index.js';

const app = express();
app.set('trust proxy', 1);

// 1. Correlation Request ID Middleware
app.use((req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
});

// 2. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 3. CORS
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// 4. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', globalLimiter);

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS || 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    success: false,
    status: 'fail',
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
  },
});
app.use(`${env.API_PREFIX}/auth`, authLimiter);

// 5. Body & Cookie Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// 6. Input Sanitization (NoSQL injection and XSS defense)
app.use(sanitizeInput);

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(process.cwd(), '../uploads')));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 6. Request Logging (Morgan -> Winston)
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
  })
);

// 7. Health Check Route
app.get(`${env.API_PREFIX}/health`, (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: dbStatus,
    requestId: req.requestId,
  });
});

// 8. API v1 Routes
app.use(env.API_PREFIX, apiRoutes);

// 9. Swagger Documentation UI
setupSwagger(app);

// 10. 404 Route Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// 9. Centralized Error Handler
app.use(errorHandler);

export default app;
