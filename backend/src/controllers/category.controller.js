/**
 * Category controller.
 *
 * Thin controller for category reference endpoints.
 */

import * as categoryService from '../services/category.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';

/**
 * GET /api/categories
 * List active product categories.
 */
export const listCategories = catchAsync(async (req, res) => {
  const result = await categoryService.getCategories(req.query);
  sendSuccess(res, result);
});

/**
 * GET /api/categories/:idOrSlug
 * Get category details by ID or slug.
 */
export const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryByIdOrSlug(req.params.idOrSlug);
  sendSuccess(res, category);
});
