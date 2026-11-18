/**
 * Role-based authorization middleware.
 *
 * Must be used AFTER the authenticate middleware (req.user must exist).
 *
 * Usage:
 *   router.delete('/admin/users/:id', authenticate, authorize(ROLES.ADMIN), controller);
 *   router.post('/products', authenticate, authorize(ROLES.SELLER), controller);
 *   router.get('/orders', authenticate, authorize(ROLES.BUYER, ROLES.SELLER), controller);
 *
 * See: Development Rules §15 — Authorization Rules
 *      System Design §6 — Role-Based Access Control
 */

import { AppError } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * Creates a middleware that checks if req.user.role is one of the allowed roles.
 *
 * @param  {...string} allowedRoles - One or more roles from ROLES constant.
 * @returns {import('express').RequestHandler}
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required.', HTTP.UNAUTHORIZED),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          HTTP.FORBIDDEN,
        ),
      );
    }

    next();
  };
};

export default authorize;
