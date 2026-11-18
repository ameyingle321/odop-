/**
 * Shared / common Joi schemas used across multiple validators.
 *
 * These cover fundamental field patterns like UUIDs, emails, pagination, etc.
 * Domain-specific validators (product, order, auth) import from here to
 * avoid duplicating rules.
 */

import Joi from 'joi';

// --- Primitive field schemas ---

/** UUID v4 — used for all primary/foreign keys from Supabase. */
export const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

/** Non-empty trimmed string. */
export const requiredString = Joi.string().trim().min(1);

/** Email — normalised to lowercase. */
export const emailSchema = Joi.string().email().trim().lowercase();

/** Phone — basic international pattern. */
export const phoneSchema = Joi.string()
  .trim()
  .pattern(/^\+?[\d\s-]{7,15}$/)
  .messages({
    'string.pattern.base': 'Phone number must be 7-15 digits and may start with +',
  });

/** Price — positive number, two decimal places max. */
export const priceSchema = Joi.number().positive().precision(2);

/** Stock / quantity — non-negative integer. */
export const quantitySchema = Joi.number().integer().min(0);

/** Rating — integer between 1 and 5. */
export const ratingSchema = Joi.number().integer().min(1).max(5);

// --- Pagination / query schemas ---

/** Standard pagination query parameters. */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().trim().default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});
