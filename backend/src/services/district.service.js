/**
 * District reference service.
 *
 * Provides district-based ODOP discovery.
 *
 * See: TRD §11 — Product Discovery System, Master Plan — Phase 5
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP } from '../constants/index.js';
import logger from '../utils/logger.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * List active ODOP districts with optional search and state filter.
 *
 * @param {object} params
 * @param {string} [params.search]
 * @param {string} [params.state]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @returns {Promise<{ districts: object[], total: number, page: number, total_pages: number }>}
 */
export async function getDistricts({ search, state, page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('districts')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (state) {
    query = query.ilike('state', `%${state}%`);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,odop_product_name.ilike.%${search}%,state.ilike.%${search}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(from, to);

  const { data: districts, error, count } = await query;

  if (error) {
    logger.error('getDistricts query failed', { error: error.message });
    throw new AppError('Failed to fetch districts.', HTTP.INTERNAL_SERVER_ERROR);
  }

  const total = count || 0;
  return {
    districts: districts || [],
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * Get district details by UUID or slug.
 *
 * @param {string} identifier - UUID or district slug (e.g. 'pune', 'varanasi')
 * @returns {Promise<object>}
 */
export async function getDistrictByIdOrSlug(identifier) {
  const isUuid = UUID_REGEX.test(identifier);

  let query = supabaseAdmin
    .from('districts')
    .select('*')
    .eq('is_active', true);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier.toLowerCase().trim());
  }

  const { data: district, error } = await query.single();

  if (error || !district) {
    throw new AppError('District not found.', HTTP.NOT_FOUND);
  }

  // Get active products count for this district
  const { count: productCount } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('district_id', district.id)
    .eq('status', 'active');

  return {
    ...district,
    active_products_count: productCount || 0,
  };
}
