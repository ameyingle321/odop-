/**
 * Authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Supabase Auth, and attaches `req.user` with
 * the authenticated user's id, email, and role.
 *
 * Usage:
 *   router.get('/protected', authenticate, controller);
 *
 * See: Development Rules §14, §15 — Authentication & Authorization Rules
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Verify the JWT and populate req.user.
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', HTTP.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please log in.', HTTP.UNAUTHORIZED);
    }

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.debug('Auth middleware: Invalid or expired token', { error: error?.message });
      throw new AppError('Invalid or expired authentication token.', HTTP.UNAUTHORIZED);
    }

    // Fetch the application profile for role information
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Auth middleware: Profile not found for authenticated user', { userId: user.id });
      throw new AppError('User profile not found.', HTTP.UNAUTHORIZED);
    }

    // Attach user info to the request for downstream handlers
    req.user = {
      id: user.id,
      email: user.email,
      name: profile.full_name,
      role: profile.role,
    };

    next();
  } catch (err) {
    // If it's already an AppError, pass it through
    if (err.name === 'AppError') {
      return next(err);
    }
    logger.error('Auth middleware: Unexpected error', { error: err.message });
    next(new AppError('Authentication failed.', HTTP.UNAUTHORIZED));
  }
};

export default authenticate;
