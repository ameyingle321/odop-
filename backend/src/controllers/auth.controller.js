/**
 * Authentication controller.
 *
 * Thin controller layer — reads request data, calls the auth service,
 * and returns the response. No business logic here.
 *
 * See: Development Rules §9 — Controllers
 */

import * as authService from '../services/auth.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';
import { HTTP } from '../constants/index.js';

/**
 * POST /api/auth/register
 * Register a new buyer account.
 */
export const registerBuyer = catchAsync(async (req, res) => {
  const result = await authService.registerBuyer(req.body);

  sendSuccess(res, result, HTTP.CREATED, 'Registration successful.');
});

/**
 * POST /api/auth/register/seller
 * Register a new seller account.
 */
export const registerSeller = catchAsync(async (req, res) => {
  const result = await authService.registerSeller(req.body);

  sendSuccess(res, result, HTTP.CREATED, 'Seller registration successful.');
});

/**
 * POST /api/auth/login
 * Log in with email and password.
 */
export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);

  sendSuccess(res, result, HTTP.OK, 'Login successful.');
});

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile.
 * Requires: authenticate middleware.
 */
export const getProfile = catchAsync(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);

  sendSuccess(res, profile);
});

/**
 * POST /api/auth/logout
 * Log out the current user session.
 * Requires: authenticate middleware.
 */
export const logout = catchAsync(async (_req, res) => {
  sendSuccess(res, null, HTTP.OK, 'Logged out successfully.');
});

