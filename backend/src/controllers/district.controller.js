/**
 * District controller.
 *
 * Thin controller for district reference endpoints.
 */

import * as districtService from '../services/district.service.js';
import { catchAsync, sendSuccess } from '../utils/index.js';

/**
 * GET /api/districts
 * List active ODOP districts (filterable by state and search keyword).
 */
export const listDistricts = catchAsync(async (req, res) => {
  const result = await districtService.getDistricts(req.query);
  sendSuccess(res, result);
});

/**
 * GET /api/districts/:idOrSlug
 * Get district details by ID or slug.
 */
export const getDistrict = catchAsync(async (req, res) => {
  const district = await districtService.getDistrictByIdOrSlug(req.params.idOrSlug);
  sendSuccess(res, district);
});
