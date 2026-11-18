/**
 * Authentication routes.
 *
 * Endpoints:
 *   POST /api/auth/register        — Register a buyer
 *   POST /api/auth/register/seller  — Register a seller
 *   POST /api/auth/login            — Log in
 *   GET  /api/auth/profile          — Get authenticated user profile
 *
 * See: TRD §6 — Authentication, System Design §22
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerBuyerSchema,
  registerSellerSchema,
  loginSchema,
} from '../validators/auth.validator.js';

const router = Router();

// --- Public routes ---
router.post('/auth/register', validate(registerBuyerSchema), authController.registerBuyer);
router.post('/auth/register/seller', validate(registerSellerSchema), authController.registerSeller);
router.post('/auth/login', validate(loginSchema), authController.login);

// --- Protected routes ---
router.get('/auth/profile', authenticate, authController.getProfile);
router.post('/auth/logout', authenticate, authController.logout);

export default router;
