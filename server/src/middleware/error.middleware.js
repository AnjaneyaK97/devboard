import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Log error
  logger.error(err.message, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  });

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new AppError(message, 404);
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new AppError(message, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    const message = `Validation error: ${messages.join(', ')}`;
    error = new AppError(message, 400, messages);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please authenticate again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401);
  }

  // Send response
  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message || 'An unexpected server error occurred',
    errors: error.details || null,
    requestId: req.requestId,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
