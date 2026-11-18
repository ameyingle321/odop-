/**
 * Central error handling middleware.
 *
 * All unhandled errors pass through here for a controlled API response.
 * Raw error details are logged server-side but never exposed to clients.
 *
 * Handles:
 *   - AppError   → uses its statusCode + message
 *   - Joi errors → 422 with field-level details
 *   - Unknown    → generic 500 message
 *
 * See: Development Rules §18 — Error Handling
 */

import logger from '../utils/logger.js';
import { HTTP } from '../constants/index.js';

const errorMiddleware = (err, req, res, _next) => {
  // ── Log the full error server-side ─────────────────────────────────
  logger.error(`${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  // ── AppError (intentional throws from services / controllers) ──────
  if (err.name === 'AppError') {
    const body = {
      success: false,
      message: err.message,
    };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // ── Joi validation error (if thrown outside the validate middleware) ─
  if (err.isJoi) {
    const errors = {};
    for (const detail of err.details) {
      const key = detail.path.join('.') || detail.context?.key || 'unknown';
      errors[key] = detail.message;
    }
    return res.status(HTTP.UNPROCESSABLE).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  // ── Supabase / PostgREST errors ────────────────────────────────────
  if (err.code && typeof err.code === 'string' && err.code.startsWith('PGRST')) {
    return res.status(HTTP.BAD_REQUEST).json({
      success: false,
      message: 'A database request error occurred.',
    });
  }

  // ── Unknown / unhandled errors → safe 500 ──────────────────────────
  res.status(HTTP.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'An internal server error occurred.',
  });
};

export default errorMiddleware;
