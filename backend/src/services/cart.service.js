/**
 * Cart Service.
 *
 * Implements server-side authoritative cart management:
 *   - Automatic calculation of item subtotals and cart total
 *   - Verification that products exist, are active, and have sufficient stock
 *   - Buyer isolation: users can only manage their own cart
 *   - Ready-for-checkout status inspection
 *
 * See: TRD §13 — Cart System
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, PRODUCT_STATUS } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Format a numeric amount to 2 decimal places.
 *
 * @param {number|string} val
 * @returns {number}
 */
function roundMoney(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}

/**
 * Fetch a buyer's cart with full product details, computed subtotals, and checkout readiness.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @returns {Promise<object>} Cart summary with items, subtotal, and checkout eligibility
 */
export async function getCart(buyerId) {
  const { data: cartItems, error } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      buyer_id,
      product_id,
      quantity,
      created_at,
      updated_at,
      products:product_id (
        id,
        name,
        slug,
        price,
        stock,
        status,
        district_id,
        seller_id,
        districts:district_id (id, name, state),
        seller_profiles:seller_id (id, business_name),
        product_images (id, image_url, display_order)
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch cart items', { error, buyerId });
    throw new AppError('Failed to fetch cart items', HTTP.INTERNAL_SERVER_ERROR);
  }

  let subtotal = 0;
  let totalItems = 0;
  let isCheckoutReady = true;

  const items = (cartItems || []).map((item) => {
    const product = item.products;
    const isAvailable = product && product.status === PRODUCT_STATUS.ACTIVE && product.stock >= item.quantity;
    
    if (!isAvailable) {
      isCheckoutReady = false;
    }

    const unitPrice = product ? Number(product.price) : 0;
    const itemSubtotal = roundMoney(unitPrice * item.quantity);

    subtotal += itemSubtotal;
    totalItems += item.quantity;

    // Sort product images by display_order
    const images = (product?.product_images || []).sort(
      (a, b) => a.display_order - b.display_order
    );

    return {
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: product
        ? {
            id: product.id,
            name: product.name,
            title: product.name,
            slug: product.slug,
            price: Number(product.price),
            stock: product.stock,
            status: product.status,
            district: product.districts || null,
            seller: product.seller_profiles || null,
            images,
          }
        : null,
      unit_price: unitPrice,
      subtotal: itemSubtotal,
      is_available: isAvailable,
    };
  });

  return {
    items,
    total_items: totalItems,
    subtotal: roundMoney(subtotal),
    is_checkout_ready: items.length > 0 && isCheckoutReady,
  };
}

/**
 * Add a product to the buyer's cart.
 * If the product is already in the cart, the quantity is incremented.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {object} itemData - { product_id, quantity }
 * @returns {Promise<object>} Added/updated cart item with latest cart summary
 */
export async function addToCart(buyerId, { product_id, quantity = 1 }) {
  // 1. Verify product exists, is active, and has sufficient stock
  const { data: product, error: productErr } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, status')
    .eq('id', product_id)
    .maybeSingle();

  if (productErr || !product) {
    throw new AppError('Product not found', HTTP.NOT_FOUND);
  }

  if (product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('This product is not currently available for purchase', HTTP.BAD_REQUEST);
  }

  // 2. Check if product already in buyer's cart
  const { data: existingItem, error: existingErr } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('buyer_id', buyerId)
    .eq('product_id', product_id)
    .maybeSingle();

  if (existingErr) {
    logger.error('Failed to check existing cart item', { existingErr, buyerId, product_id });
    throw new AppError('Failed to inspect cart', HTTP.INTERNAL_SERVER_ERROR);
  }

  const desiredQuantity = existingItem ? existingItem.quantity + quantity : quantity;

  if (desiredQuantity > product.stock) {
    throw new AppError(
      `Cannot add ${quantity} item(s). Available stock is ${product.stock} (current in cart: ${existingItem?.quantity || 0})`,
      HTTP.BAD_REQUEST
    );
  }

  let savedItem;
  if (existingItem) {
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('cart_items')
      .update({
        quantity: desiredQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (updateErr) {
      logger.error('Failed to update cart item quantity', { updateErr, id: existingItem.id });
      throw new AppError('Failed to update cart item', HTTP.INTERNAL_SERVER_ERROR);
    }
    savedItem = updated;
  } else {
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('cart_items')
      .insert({
        buyer_id: buyerId,
        product_id,
        quantity,
      })
      .select()
      .single();

    if (insertErr) {
      logger.error('Failed to insert cart item', { insertErr, buyerId, product_id });
      throw new AppError('Failed to add product to cart', HTTP.INTERNAL_SERVER_ERROR);
    }
    savedItem = inserted;
  }

  const updatedCart = await getCart(buyerId);

  return {
    cart_item: savedItem,
    cart: updatedCart,
  };
}

/**
 * Update the quantity of a specific cart item.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {string} cartItemId - Cart item UUID
 * @param {number} newQuantity - Desired quantity (>= 1)
 * @returns {Promise<object>} Updated cart item with latest cart summary
 */
export async function updateCartItem(buyerId, cartItemId, newQuantity) {
  // 1. Verify item exists and belongs to the buyer
  const { data: cartItem, error: itemErr } = await supabaseAdmin
    .from('cart_items')
    .select('id, buyer_id, product_id, quantity, products:product_id (id, stock, status)')
    .eq('id', cartItemId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (itemErr || !cartItem) {
    throw new AppError('Cart item not found', HTTP.NOT_FOUND);
  }

  const product = cartItem.products;
  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('This product is no longer active', HTTP.BAD_REQUEST);
  }

  if (newQuantity > product.stock) {
    throw new AppError(
      `Requested quantity (${newQuantity}) exceeds available stock (${product.stock})`,
      HTTP.BAD_REQUEST
    );
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('cart_items')
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cartItemId)
    .select()
    .single();

  if (updateErr) {
    logger.error('Failed to update cart item', { updateErr, cartItemId });
    throw new AppError('Failed to update cart item', HTTP.INTERNAL_SERVER_ERROR);
  }

  const updatedCart = await getCart(buyerId);

  return {
    cart_item: updated,
    cart: updatedCart,
  };
}

/**
 * Remove an item from the cart.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {string} cartItemId - Cart item UUID
 * @returns {Promise<object>} Updated cart summary
 */
export async function removeCartItem(buyerId, cartItemId) {
  const { data: existing, error: findErr } = await supabaseAdmin
    .from('cart_items')
    .select('id')
    .eq('id', cartItemId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (findErr || !existing) {
    throw new AppError('Cart item not found', HTTP.NOT_FOUND);
  }

  const { error: deleteErr } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (deleteErr) {
    logger.error('Failed to remove cart item', { deleteErr, cartItemId });
    throw new AppError('Failed to remove cart item', HTTP.INTERNAL_SERVER_ERROR);
  }

  return getCart(buyerId);
}

/**
 * Clear all items from a buyer's cart.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @returns {Promise<void>}
 */
export async function clearCart(buyerId) {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('buyer_id', buyerId);

  if (error) {
    logger.error('Failed to clear cart', { error, buyerId });
    throw new AppError('Failed to clear cart', HTTP.INTERNAL_SERVER_ERROR);
  }
}
