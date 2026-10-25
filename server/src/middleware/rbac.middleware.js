import { AppError } from '../utils/AppError.js';

/**
 * RBAC guard middleware: Restricts route to specific user roles
 * @param  {...string} allowedRoles
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required to verify permissions.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Role '${req.user.role}' does not have permission to perform this action`,
          403
        )
      );
    }

    next();
  };
};
