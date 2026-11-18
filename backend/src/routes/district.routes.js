/**
 * District reference routes.
 *
 * Public endpoints:
 *   GET /api/districts           — List active districts
 *   GET /api/districts/:idOrSlug — Get district details by ID or slug
 */

import { Router } from 'express';
import * as districtController from '../controllers/district.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { listDistrictsSchema } from '../validators/index.js';

const router = Router();

router.get('/districts', validate(listDistrictsSchema, 'query'), districtController.listDistricts);
router.get('/districts/:idOrSlug', districtController.getDistrict);

export default router;
