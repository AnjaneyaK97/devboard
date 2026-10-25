import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  logoutUser,
} from '../services/auth.service.js';
import { User, AuditLog } from '../models/index.js';
import { env } from '../config/env.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

const COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const { user, accessToken, refreshToken } = await registerUser(req.body, meta);

  res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      accessToken,
    },
    requestId: req.requestId,
  });
});

/**
 * Log in user
 * POST /api/v1/auth/login
 */
export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const { user, accessToken, refreshToken } = await loginUser(email, password, meta);

  res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user,
      accessToken,
    },
    requestId: req.requestId,
  });
});

/**
 * Rotate refresh token and issue new access token
 * POST /api/v1/auth/refresh
 */
export const refresh = asyncWrapper(async (req, res) => {
  // Read token from cookie or body
  const currentToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const { user, accessToken, refreshToken } = await rotateRefreshToken(currentToken, meta);

  res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

  res.status(200).json({
    success: true,
    message: 'Session refreshed successfully',
    data: {
      user,
      accessToken,
    },
    requestId: req.requestId,
  });
});

/**
 * Log out user
 * POST /api/v1/auth/logout
 */
export const logout = asyncWrapper(async (req, res) => {
  const currentToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;
  const userId = req.user ? req.user._id : null;

  await logoutUser(userId, currentToken);

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    requestId: req.requestId,
  });
});

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
export const getMe = asyncWrapper(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
    requestId: req.requestId,
  });
});

/**
 * Update authenticated user profile
 * PATCH /api/v1/auth/profile
 */
export const updateProfile = asyncWrapper(async (req, res) => {
  const allowedFields = [
    'name',
    'bio',
    'location',
    'skills',
    'experienceYears',
    'companyName',
    'companyWebsite',
    'companyLogo',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await AuditLog.create({
    actor: req.user._id,
    action: 'USER_PROFILE_UPDATED',
    entity: 'User',
    entityId: req.user._id,
    meta: { updatedFields: Object.keys(updates) },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: updatedUser.toSafeObject(),
    },
    requestId: req.requestId,
  });
});
