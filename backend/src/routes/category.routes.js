/**
 * Category reference routes.
 *
 * Public endpoints:
 *   GET /api/categories           — List active categories
 *   GET /api/categories/:idOrSlug — Get category details by ID or slug
 */

import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { listCategoriesSchema } from '../validators/index.js';

const router = Router();

router.get('/categories', validate(listCategoriesSchema, 'query'), categoryController.listCategories);
router.get('/categories/:idOrSlug', categoryController.getCategory);

export default router;
