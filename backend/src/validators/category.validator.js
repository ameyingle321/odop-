/**
 * Category validation schemas.
 */

import Joi from 'joi';

export const listCategoriesSchema = Joi.object({
  search: Joi.string().trim().max(100).allow('', null).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
