import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

/**
 * Protect middleware: Ensures incoming request has valid Bearer access token
 */
export const protect = asyncWrapper(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token has expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid access token.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
  }

  // Attach user to request object
  req.user = user;
  next();
});

/**
 * Optional protect: Sets req.user if a valid token is provided, but does not block if not
 */
export const optionalAuth = asyncWrapper(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Silently continue for unauthenticated guests
  }

  next();
});
