/**
 * Category reference service.
 *
 * Provides category listing and discovery.
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP } from '../constants/index.js';
import logger from '../utils/logger.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * List active product categories.
 *
 * @param {object} params
 * @param {string} [params.search]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=50]
 * @returns {Promise<{ categories: object[], total: number, page: number, total_pages: number }>}
 */
export async function getCategories({ search, page = 1, limit = 50 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('categories')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(from, to);

  const { data: categories, error, count } = await query;

  if (error) {
    logger.error('getCategories query failed', { error: error.message });
    throw new AppError('Failed to fetch categories.', HTTP.INTERNAL_SERVER_ERROR);
  }

  const total = count || 0;
  return {
    categories: categories || [],
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * Get category details by UUID or slug.
 *
 * @param {string} identifier - UUID or slug (e.g. 'textiles')
 * @returns {Promise<object>}
 */
export async function getCategoryByIdOrSlug(identifier) {
  const isUuid = UUID_REGEX.test(identifier);

  let query = supabaseAdmin
    .from('categories')
    .select('*')
    .eq('is_active', true);

  if (isUuid) {
    query = query.eq('id', identifier);
  } else {
    query = query.eq('slug', identifier.toLowerCase().trim());
  }

  const { data: category, error } = await query.single();

  if (error || !category) {
    throw new AppError('Category not found.', HTTP.NOT_FOUND);
  }

  // Get active products count in this category
  const { count: productCount } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'active');

  return {
    ...category,
    active_products_count: productCount || 0,
  };
}
