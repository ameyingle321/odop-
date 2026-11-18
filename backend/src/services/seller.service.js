/**
 * Seller service.
 *
 * Handles seller profile retrieval, profile updates, and dashboard metrics.
 *
 * See: Development Rules §9 — Services, §11 — Critical Business Rules
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, PRODUCT_STATUS } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Fetch seller profile by user UUID.
 *
 * @param {string} userId - UUID from auth user
 * @returns {Promise<object>} seller_profile record
 */
export async function getSellerByUserId(userId) {
  const { data: seller, error } = await supabaseAdmin
    .from('seller_profiles')
    .select('*, districts:district_id (id, name, state, slug, odop_product_name)')
    .eq('user_id', userId)
    .single();

  if (error || !seller) {
    logger.warn('getSellerByUserId: Seller profile not found', { userId });
    throw new AppError('Seller profile not found.', HTTP.NOT_FOUND);
  }

  return seller;
}

/**
 * Get comprehensive seller profile with user details.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getSellerProfile(userId) {
  const seller = await getSellerByUserId(userId);

  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, avatar_url, created_at')
    .eq('id', userId)
    .single();

  return {
    ...seller,
    user: userProfile || null,
  };
}

/**
 * Update seller profile fields.
 *
 * Note: district_id cannot be changed because product relationships
 * depend on the seller's registered district (District Integrity).
 *
 * @param {string} userId
 * @param {object} updateData
 * @returns {Promise<object>}
 */
export async function updateSellerProfile(userId, updateData) {
  const existingSeller = await getSellerByUserId(userId);

  const allowedUpdates = {};
  if (updateData.business_name !== undefined) allowedUpdates.business_name = updateData.business_name;
  if (updateData.phone !== undefined) allowedUpdates.phone = updateData.phone;
  if (updateData.address !== undefined) allowedUpdates.address = updateData.address;
  if (updateData.state !== undefined) allowedUpdates.state = updateData.state;

  if (Object.keys(allowedUpdates).length === 0) {
    return existingSeller;
  }

  const { data: updated, error } = await supabaseAdmin
    .from('seller_profiles')
    .update(allowedUpdates)
    .eq('id', existingSeller.id)
    .select('*, districts:district_id (id, name, state, slug, odop_product_name)')
    .single();

  if (error) {
    logger.error('updateSellerProfile failed', { userId, error: error.message });
    throw new AppError('Failed to update seller profile.', HTTP.INTERNAL_SERVER_ERROR);
  }

  logger.info('Seller profile updated', { sellerId: existingSeller.id, userId });

  return updated;
}

/**
 * Get seller dashboard metrics and overview.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getSellerDashboard(userId) {
  const seller = await getSellerByUserId(userId);

  // 1. Get product counts by status
  const { data: products, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, status, created_at')
    .eq('seller_id', seller.id);

  if (productError) {
    logger.error('getSellerDashboard: product query failed', { sellerId: seller.id, error: productError.message });
    throw new AppError('Failed to load dashboard data.', HTTP.INTERNAL_SERVER_ERROR);
  }

  const allProducts = products || [];
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter(p => p.status === PRODUCT_STATUS.ACTIVE).length;
  const draftProducts = allProducts.filter(p => p.status === PRODUCT_STATUS.DRAFT).length;
  const inactiveProducts = allProducts.filter(p => p.status === PRODUCT_STATUS.INACTIVE).length;
  const outOfStockProducts = allProducts.filter(p => p.stock === 0).length;

  // 2. Fetch latest 5 products
  const { data: recentProducts } = await supabaseAdmin
    .from('products')
    .select(`
      id,
      name,
      slug,
      price,
      stock,
      status,
      created_at,
      categories:category_id (id, name),
      product_images (image_url, display_order)
    `)
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    seller: {
      id: seller.id,
      business_name: seller.business_name,
      verification_status: seller.verification_status,
      district: seller.districts,
    },
    metrics: {
      total_products: totalProducts,
      active_products: activeProducts,
      draft_products: draftProducts,
      inactive_products: inactiveProducts,
      out_of_stock_products: outOfStockProducts,
    },
    recent_products: recentProducts || [],
  };
}
