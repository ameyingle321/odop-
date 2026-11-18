/**
 * Product service.
 *
 * Enforces critical business rules:
 *   1. District Integrity: Seller District = Product District
 *   2. Seller Ownership: Sellers can only modify/delete their own products
 *
 * See: Development Rules §11 — Critical Business Rules, TRD §10 — Critical District Validation
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, PRODUCT_STATUS } from '../constants/index.js';
import { getSellerByUserId } from './seller.service.js';
import logger from '../utils/logger.js';

/**
 * Generate a unique URL slug from a product name.
 *
 * @param {string} name
 * @returns {string}
 */
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${uniqueSuffix}`;
}

/**
 * Create a new product.
 *
 * Enforces:
 *   - Seller District = Product District
 *   - Valid category check
 *   - Automatic slug generation
 *   - Image associations in product_images
 *
 * @param {string} sellerUserId - Authenticated user ID (seller)
 * @param {object} productData
 * @returns {Promise<object>} Created product record
 */
export async function createProduct(sellerUserId, productData) {
  // 1. Fetch authenticated seller record
  const seller = await getSellerByUserId(sellerUserId);

  // 2. Enforce Critical Business Rule: District Integrity
  if (productData.district_id) {
    if (productData.district_id !== seller.district_id) {
      logger.warn('createProduct: District mismatch rejected', {
        sellerId: seller.id,
        sellerDistrictId: seller.district_id,
        requestedDistrictId: productData.district_id,
      });
      throw new AppError(
        'District mismatch: Product district must match seller registered district.',
        HTTP.BAD_REQUEST,
      );
    }
  } else {
    // Default to seller's registered district
    productData.district_id = seller.district_id;
  }

  // 3. Verify category exists and is active
  const { data: category, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id, is_active')
    .eq('id', productData.category_id)
    .single();

  if (categoryError || !category) {
    throw new AppError('Invalid category ID.', HTTP.BAD_REQUEST);
  }

  // 4. Generate unique slug
  const slug = generateSlug(productData.name);

  // 5. Insert product record
  const newProductPayload = {
    seller_id: seller.id,
    district_id: seller.district_id,
    category_id: productData.category_id,
    name: productData.name,
    slug,
    description: productData.description || null,
    price: productData.price,
    stock: productData.stock !== undefined ? productData.stock : 0,
    status: productData.status || PRODUCT_STATUS.ACTIVE,
    odop_product_name: productData.odop_product_name || null,
  };

  const { data: product, error: insertError } = await supabaseAdmin
    .from('products')
    .insert(newProductPayload)
    .select(`
      *,
      districts:district_id (id, name, state, slug, odop_product_name),
      categories:category_id (id, name, slug)
    `)
    .single();

  if (insertError) {
    logger.error('createProduct: Insert failed', { error: insertError.message });
    throw new AppError('Failed to create product.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 6. Handle image records if provided
  let images = [];
  if (Array.isArray(productData.images) && productData.images.length > 0) {
    const imagePayloads = productData.images.map((img, index) => ({
      product_id: product.id,
      image_url: typeof img === 'string' ? img : img.image_url,
      display_order: typeof img === 'object' && img.display_order !== undefined ? img.display_order : index,
    }));

    const { data: insertedImages, error: imgError } = await supabaseAdmin
      .from('product_images')
      .insert(imagePayloads)
      .select('id, image_url, display_order');

    if (!imgError && insertedImages) {
      images = insertedImages;
    }
  }

  logger.info('Product created', { productId: product.id, sellerId: seller.id, slug });

  return {
    ...product,
    images,
  };
}

/**
 * Get product details by ID.
 *
 * @param {string} productId
 * @returns {Promise<object>}
 */
export async function getProductById(productId) {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      districts:district_id (id, name, state, slug, odop_product_name),
      categories:category_id (id, name, slug),
      seller_profiles:seller_id (id, business_name, state, district_id),
      product_images (id, image_url, display_order)
    `)
    .eq('id', productId)
    .single();

  if (error || !product) {
    throw new AppError('Product not found.', HTTP.NOT_FOUND);
  }

  return product;
}

/**
 * Update an existing product.
 *
 * Enforces:
 *   - Ownership: Only the owning seller can update their product
 *   - District Integrity: If district_id is updated, it must match seller district
 *
 * @param {string} productId
 * @param {string} sellerUserId - Authenticated user ID (seller)
 * @param {object} updateData
 * @returns {Promise<object>}
 */
export async function updateProduct(productId, sellerUserId, updateData) {
  const seller = await getSellerByUserId(sellerUserId);

  // 1. Verify product exists
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, seller_id, district_id')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw new AppError('Product not found.', HTTP.NOT_FOUND);
  }

  // 2. Enforce Ownership
  if (product.seller_id !== seller.id) {
    logger.warn('updateProduct: Ownership check failed', {
      productId,
      ownerSellerId: product.seller_id,
      attemptingSellerId: seller.id,
    });
    throw new AppError('You do not have permission to modify this product.', HTTP.FORBIDDEN);
  }

  // 3. Enforce District Integrity if district is in update payload
  if (updateData.district_id && updateData.district_id !== seller.district_id) {
    throw new AppError(
      'District mismatch: Product district must match seller registered district.',
      HTTP.BAD_REQUEST,
    );
  }

  // 4. Verify category if changing
  if (updateData.category_id) {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('id', updateData.category_id)
      .single();

    if (!category) {
      throw new AppError('Invalid category ID.', HTTP.BAD_REQUEST);
    }
  }

  // 5. Build update payload
  const allowedFields = ['name', 'description', 'price', 'stock', 'category_id', 'status', 'odop_product_name'];
  const updatePayload = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updatePayload[field] = updateData[field];
    }
  }

  let updatedProduct = product;
  if (Object.keys(updatePayload).length > 0) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select(`
        *,
        districts:district_id (id, name, state, slug, odop_product_name),
        categories:category_id (id, name, slug)
      `)
      .single();

    if (updateError) {
      logger.error('updateProduct failed', { productId, error: updateError.message });
      throw new AppError('Failed to update product.', HTTP.INTERNAL_SERVER_ERROR);
    }
    updatedProduct = updated;
  }

  // 6. Handle image updates if specified
  if (Array.isArray(updateData.images)) {
    // Delete existing images
    await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (updateData.images.length > 0) {
      const imagePayloads = updateData.images.map((img, index) => ({
        product_id: productId,
        image_url: typeof img === 'string' ? img : img.image_url,
        display_order: typeof img === 'object' && img.display_order !== undefined ? img.display_order : index,
      }));

      await supabaseAdmin.from('product_images').insert(imagePayloads);
    }
  }

  // Fetch updated images
  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('id, image_url, display_order')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  logger.info('Product updated', { productId, sellerId: seller.id });

  return {
    ...updatedProduct,
    images: images || [],
  };
}

/**
 * Delete a product.
 *
 * Enforces ownership.
 *
 * @param {string} productId
 * @param {string} sellerUserId
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId, sellerUserId) {
  const seller = await getSellerByUserId(sellerUserId);

  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, seller_id')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw new AppError('Product not found.', HTTP.NOT_FOUND);
  }

  if (product.seller_id !== seller.id) {
    throw new AppError('You do not have permission to delete this product.', HTTP.FORBIDDEN);
  }

  // Check if product is part of any orders
  const { data: orderItem } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
    .single();

  if (orderItem) {
    // Product has historical orders: soft-delete by deactivating
    await supabaseAdmin
      .from('products')
      .update({ status: PRODUCT_STATUS.INACTIVE })
      .eq('id', productId);

    logger.info('Product soft-deleted (status set to inactive due to order history)', { productId });
    return { message: 'Product deactivated successfully.' };
  }

  // Hard delete if no order dependencies
  const { error: deleteError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', productId);

  if (deleteError) {
    logger.error('deleteProduct failed', { productId, error: deleteError.message });
    throw new AppError('Failed to delete product.', HTTP.INTERNAL_SERVER_ERROR);
  }

  logger.info('Product deleted', { productId, sellerId: seller.id });
  return { message: 'Product deleted successfully.' };
}

/**
 * List products for the authenticated seller.
 *
 * @param {string} sellerUserId
 * @param {object} options
 * @returns {Promise<{ products: object[], total: number, page: number, total_pages: number }>}
 */
export async function getSellerProducts(sellerUserId, {
  page = 1,
  limit = 20,
  status,
  sort_by = 'created_at',
  sort_order = 'desc',
} = {}) {
  const seller = await getSellerByUserId(sellerUserId);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('products')
    .select(`
      *,
      districts:district_id (id, name, state, slug, odop_product_name),
      categories:category_id (id, name, slug),
      product_images (id, image_url, display_order)
    `, { count: 'exact' })
    .eq('seller_id', seller.id);

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(from, to);

  const { data: products, error, count } = await query;

  if (error) {
    logger.error('getSellerProducts failed', { sellerId: seller.id, error: error.message });
    throw new AppError('Failed to retrieve products.', HTTP.INTERNAL_SERVER_ERROR);
  }

  const total = count || 0;
  return {
    products: products || [],
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * Public catalog discovery & product search.
 *
 * Implements Product-First Discovery:
 *   - Buyers can search products by name/description without knowing the district
 *   - Each returned product exposes the linked district, category, and seller
 *   - CRITICAL VISIBILITY RULE: Excludes non-active products (status !== 'active')
 *
 * @param {object} options
 * @returns {Promise<{ products: object[], total: number, page: number, total_pages: number }>}
 */
export async function searchProducts({
  search,
  category_id,
  category,
  district_id,
  district,
  min_price,
  max_price,
  in_stock,
  page = 1,
  limit = 20,
  sort_by = 'created_at',
  sort_order = 'desc',
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  // Resolve category (UUID, slug, or name)
  let targetCategoryId = category_id;
  if (!targetCategoryId && category) {
    if (isUuid(category)) {
      targetCategoryId = category;
    } else {
      const { data: catRecord } = await supabaseAdmin
        .from('categories')
        .select('id')
        .or(`slug.eq.${category.toLowerCase().trim()},name.ilike.%${category.trim()}%`)
        .limit(1)
        .maybeSingle();
      if (catRecord) targetCategoryId = catRecord.id;
    }
  }

  // Resolve district (UUID, slug, or name)
  let targetDistrictId = district_id;
  if (!targetDistrictId && district) {
    if (isUuid(district)) {
      targetDistrictId = district;
    } else {
      const { data: distRecord } = await supabaseAdmin
        .from('districts')
        .select('id')
        .or(`slug.eq.${district.toLowerCase().trim()},name.ilike.%${district.trim()}%`)
        .limit(1)
        .maybeSingle();
      if (distRecord) targetDistrictId = distRecord.id;
    }
  }

  // Build base query — ENFORCE VISIBILITY: only status = 'active'
  let query = supabaseAdmin
    .from('products')
    .select(`
      *,
      districts:district_id (id, name, state, slug, odop_product_name),
      categories:category_id (id, name, slug),
      seller_profiles:seller_id (id, business_name, state),
      product_images (id, image_url, display_order)
    `, { count: 'exact' })
    .eq('status', PRODUCT_STATUS.ACTIVE);

  // Search keyword (case-insensitive across product name, description, and odop_product_name)
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,odop_product_name.ilike.%${search}%`);
  }

  if (targetCategoryId) {
    query = query.eq('category_id', targetCategoryId);
  }

  if (targetDistrictId) {
    const aurangabadId = '269fa4e2-8260-4cd2-b61a-182b9a4c7fe4';
    const sambhajinagarId = '393b7011-d829-486c-ac15-b0b9cf7b4061';
    if (targetDistrictId === aurangabadId || targetDistrictId === sambhajinagarId) {
      query = query.in('district_id', [aurangabadId, sambhajinagarId]);
    } else {
      query = query.eq('district_id', targetDistrictId);
    }
  }

  if (min_price !== undefined) {
    query = query.gte('price', min_price);
  }

  if (max_price !== undefined) {
    query = query.lte('price', max_price);
  }

  if (in_stock === true) {
    query = query.gt('stock', 0);
  }

  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(from, to);

  const { data: products, error, count } = await query;

  if (error) {
    logger.error('searchProducts failed', { error: error.message });
    throw new AppError('Failed to search products.', HTTP.INTERNAL_SERVER_ERROR);
  }

  const total = count || 0;
  return {
    products: products || [],
    total,
    page: Number(page),
    limit: Number(limit),
    total_pages: Math.ceil(total / limit),
  };
}

