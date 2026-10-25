import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, AuditLog } from '../models/index.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { emailService } from './email.service.js';
import { createNotification } from './notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Generate short-lived Access Token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

/**
 * Generate long-lived Refresh Token with unique jti
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Register a new user
 */
export const registerUser = async (userData, meta = {}) => {
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    throw new AppError('An account with this email address already exists', 409);
  }

  const user = await User.create(userData);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Calculate refresh token expiry (7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens.push({ token: refreshToken, expiresAt });
  await user.save();

  // Audit Log
  await AuditLog.create({
    actor: user._id,
    action: 'USER_REGISTERED',
    entity: 'User',
    entityId: user._id,
    meta: { role: user.role, email: user.email },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  // Welcome email & in-app notification (async)
  try {
    emailService.sendWelcomeEmail(user);
    await createNotification({
      user: user._id,
      type: 'system',
      title: 'Welcome to DevBoard!',
      message: user.role === 'employer' 
        ? 'Welcome! You can now publish tech roles and manage candidates.' 
        : 'Welcome! Complete your profile and upload your resume to discover matching jobs.',
      link: user.role === 'employer' ? '/jobs/post' : '/profile',
    });
  } catch (err) {
    logger.warn(`Failed to dispatch welcome notification for user ${user._id}: ${err.message}`);
  }

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticate existing user
 */
export const loginUser = async (email, password, meta = {}) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Prune expired refresh tokens and add the new one
  const now = new Date();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.expiresAt > now);
  user.refreshTokens.push({ token: refreshToken, expiresAt });
  await user.save();

  // Audit Log
  await AuditLog.create({
    actor: user._id,
    action: 'USER_LOGIN',
    entity: 'Auth',
    entityId: user._id,
    meta: { role: user.role },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh token rotation
 */
export const rotateRefreshToken = async (oldRefreshToken, _meta = {}) => {
  if (!oldRefreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError('User belonging to this token no longer exists', 401);
  }

  // Check if refresh token is in user's active tokens
  const tokenRecord = user.refreshTokens.find((rt) => rt.token === oldRefreshToken);
  if (!tokenRecord) {
    // Suspected token reuse! Invalidate all sessions for security
    user.refreshTokens = [];
    await user.save();
    throw new AppError('Security violation: Reused refresh token detected. Please log in again.', 401);
  }

  // Remove used refresh token
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== oldRefreshToken);

  // Issue new token pair
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshTokens.push({ token: newRefreshToken, expiresAt });
  await user.save();

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout and invalidate refresh token
 */
export const logoutUser = async (userId, refreshToken) => {
  if (!userId) return;
  const user = await User.findById(userId);
  if (user) {
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);
    } else {
      user.refreshTokens = [];
    }
    await user.save();
  }
};
