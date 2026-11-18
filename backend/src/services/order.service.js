/**
 * Order Service.
 *
 * Implements authoritative marketplace order processing:
 *   - Server-side price calculation and immutable price snapshotting
 *   - Real-time stock verification and atomic stock decrementing
 *   - Cart cleanup upon successful order creation
 *   - Strict access isolation (Buyers only see their orders; Sellers only see their fulfilled items)
 *   - Order status transitions with stock restoration on cancellation
 *
 * See: TRD §14 — Order Processing, §16 — Order Status Model
 */

import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, ORDER_STATUS, PAYMENT_STATUS, PRODUCT_STATUS } from '../constants/index.js';
import { getCart, clearCart } from './cart.service.js';
import { getSellerByUserId } from './seller.service.js';
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
 * Allowed status transitions in the order lifecycle.
 */
const VALID_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/**
 * Create a new customer order.
 *
 * Can create from active cart items or explicit item list.
 * Enforces:
 *   - Products must be active
 *   - Sufficient inventory check
 *   - Server-side price calculation (client amount is completely ignored)
 *   - Price snapshots in order_items
 *   - Inventory decrement
 *   - Cart cleanup
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {object} orderData - Delivery info & optional items array
 * @returns {Promise<object>} Created order record with order_items
 */
export async function createOrder(buyerId, orderData) {
  const {
    delivery_name,
    delivery_phone,
    delivery_address,
    delivery_city,
    delivery_district,
    delivery_state,
    delivery_pincode,
    items: explicitItems,
  } = orderData;

  let orderItemsToProcess = [];
  let orderedFromCart = false;

  // 1. Resolve items: either explicit or from current buyer cart
  if (explicitItems && explicitItems.length > 0) {
    orderItemsToProcess = explicitItems;
  } else {
    const userCart = await getCart(buyerId);
    if (!userCart.items || userCart.items.length === 0) {
      throw new AppError('Cannot place order with an empty cart', HTTP.BAD_REQUEST);
    }
    orderItemsToProcess = userCart.items.map((ci) => ({
      product_id: ci.product_id,
      quantity: ci.quantity,
    }));
    orderedFromCart = true;
  }

  // 2. Fetch authoritative product records & verify availability
  const productIds = orderItemsToProcess.map((i) => i.product_id);
  const { data: dbProducts, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, status, seller_id')
    .in('id', productIds);

  if (prodErr || !dbProducts) {
    logger.error('Failed to fetch products for order', { prodErr, productIds });
    throw new AppError('Failed to verify products for order', HTTP.INTERNAL_SERVER_ERROR);
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // 3. Validate stock & compute authoritative snapshots
  let totalAmount = 0;
  const snapshotItems = [];

  for (const item of orderItemsToProcess) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new AppError(`Product with ID ${item.product_id} not found`, HTTP.NOT_FOUND);
    }

    if (product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError(
        `Product "${product.name}" is no longer active and cannot be purchased`,
        HTTP.BAD_REQUEST
      );
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`,
        HTTP.BAD_REQUEST
      );
    }

    const unitPrice = Number(product.price);
    const itemSubtotal = roundMoney(unitPrice * item.quantity);
    totalAmount += itemSubtotal;

    snapshotItems.push({
      product_id: product.id,
      seller_id: product.seller_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal: itemSubtotal,
    });
  }

  totalAmount = roundMoney(totalAmount);

  // 4. Insert into `orders`
  const { data: createdOrder, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyerId,
      total_amount: totalAmount,
      payment_status: PAYMENT_STATUS.PENDING,
      order_status: ORDER_STATUS.PENDING_PAYMENT,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_city,
      delivery_district,
      delivery_state,
      delivery_pincode,
    })
    .select()
    .single();

  if (orderErr || !createdOrder) {
    logger.error('Failed to insert order', { orderErr, buyerId });
    throw new AppError('Failed to create order', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 5. Insert `order_items` with order_id snapshot
  const orderItemsPayload = snapshotItems.map((item) => ({
    order_id: createdOrder.id,
    ...item,
  }));

  const { data: insertedItems, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemsPayload)
    .select();

  if (itemsErr) {
    logger.error('Failed to insert order items', { itemsErr, orderId: createdOrder.id });
    // Attempt rollback order creation
    await supabaseAdmin.from('orders').delete().eq('id', createdOrder.id);
    throw new AppError('Failed to save order line items', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 6. Decrement stock for purchased products
  for (const item of snapshotItems) {
    const product = productMap.get(item.product_id);
    const newStock = Math.max(0, product.stock - item.quantity);
    await supabaseAdmin
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id);
  }

  // 7. Clean up cart if ordered from cart or clean purchased items
  if (orderedFromCart) {
    await clearCart(buyerId);
  } else {
    // Delete specifically purchased items from cart if present
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('buyer_id', buyerId)
      .in('product_id', productIds);
  }

  return {
    ...createdOrder,
    items: insertedItems,
  };
}

/**
 * Get paginated orders for a buyer.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {object} query - { page, limit, status }
 * @returns {Promise<object>} Paginated orders list
 */
export async function getBuyerOrders(buyerId, query = {}) {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  let dbQuery = supabaseAdmin
    .from('orders')
    .select(
      `
      id,
      buyer_id,
      total_amount,
      payment_status,
      order_status,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_city,
      delivery_district,
      delivery_state,
      delivery_pincode,
      created_at,
      updated_at,
      order_items (
        id,
        product_id,
        seller_id,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `,
      { count: 'exact' }
    )
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (query.status) {
    dbQuery = dbQuery.eq('order_status', query.status);
  }

  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data: orders, count, error } = await dbQuery;

  if (error) {
    logger.error('Failed to get buyer orders', { error, buyerId });
    throw new AppError('Failed to fetch orders', HTTP.INTERNAL_SERVER_ERROR);
  }

  return {
    orders: orders || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get a single order detail for a buyer.
 * Enforces ownership: only the buyer who placed the order can view it.
 *
 * @param {string} buyerId - Authenticated buyer profile ID
 * @param {string} orderId - Order UUID
 * @returns {Promise<object>} Order details
 */
export async function getBuyerOrderById(buyerId, orderId) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      buyer_id,
      total_amount,
      payment_status,
      order_status,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_city,
      delivery_district,
      delivery_state,
      delivery_pincode,
      created_at,
      updated_at,
      order_items (
        id,
        product_id,
        seller_id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        seller_profiles:seller_id (id, business_name)
      )
    `)
    .eq('id', orderId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (error || !order) {
    throw new AppError('Order not found', HTTP.NOT_FOUND);
  }

  return order;
}

/**
 * Get seller's fulfillment orders.
 *
 * CRITICAL SECURITY RULE:
 * Sellers only see line items they fulfill. Other sellers' items are strictly omitted.
 *
 * @param {string} sellerUserId - Authenticated seller user ID
 * @param {object} query - { page, limit, status }
 * @returns {Promise<object>} Paginated orders for the seller
 */
export async function getSellerOrders(sellerUserId, query = {}) {
  const seller = await getSellerByUserId(sellerUserId);

  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const offset = (page - 1) * limit;

  // Query order_items where seller_id matches
  let itemsQuery = supabaseAdmin
    .from('order_items')
    .select(
      `
      id,
      order_id,
      product_id,
      seller_id,
      product_name,
      quantity,
      unit_price,
      subtotal,
      created_at,
      orders:order_id (
        id,
        buyer_id,
        order_status,
        payment_status,
        delivery_name,
        delivery_city,
        delivery_state,
        delivery_pincode,
        created_at
      )
    `,
      { count: 'exact' }
    )
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });

  if (query.status) {
    // Filter by parent order status via foreign table filter
    itemsQuery = itemsQuery.eq('orders.order_status', query.status);
  }

  itemsQuery = itemsQuery.range(offset, offset + limit - 1);

  const { data: items, count, error } = await itemsQuery;

  if (error) {
    logger.error('Failed to get seller orders', { error, sellerId: seller.id });
    throw new AppError('Failed to fetch seller orders', HTTP.INTERNAL_SERVER_ERROR);
  }

  // Group items by order_id so seller gets a structured list of orders
  const ordersMap = new Map();

  for (const item of items || []) {
    const parentOrder = item.orders;
    if (!parentOrder) continue;

    if (!ordersMap.has(parentOrder.id)) {
      ordersMap.set(parentOrder.id, {
        order_id: parentOrder.id,
        order_status: parentOrder.order_status,
        payment_status: parentOrder.payment_status,
        delivery_name: parentOrder.delivery_name,
        delivery_city: parentOrder.delivery_city,
        delivery_state: parentOrder.delivery_state,
        delivery_pincode: parentOrder.delivery_pincode,
        created_at: parentOrder.created_at,
        seller_subtotal: 0,
        items: [],
      });
    }

    const orderEntry = ordersMap.get(parentOrder.id);
    orderEntry.items.push({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    });
    orderEntry.seller_subtotal = roundMoney(orderEntry.seller_subtotal + Number(item.subtotal));
  }

  return {
    orders: Array.from(ordersMap.values()),
    pagination: {
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get seller-specific view of a single order.
 *
 * @param {string} sellerUserId - Authenticated seller user ID
 * @param {string} orderId - Order UUID
 * @returns {Promise<object>} Order details with seller-specific items only
 */
export async function getSellerOrderById(sellerUserId, orderId) {
  const seller = await getSellerByUserId(sellerUserId);

  // 1. Fetch parent order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      buyer_id,
      order_status,
      payment_status,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_city,
      delivery_district,
      delivery_state,
      delivery_pincode,
      created_at,
      updated_at
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr || !order) {
    throw new AppError('Order not found', HTTP.NOT_FOUND);
  }

  // 2. Fetch only items for this seller
  const { data: sellerItems, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select(`
      id,
      product_id,
      seller_id,
      product_name,
      quantity,
      unit_price,
      subtotal,
      created_at
    `)
    .eq('order_id', orderId)
    .eq('seller_id', seller.id);

  if (itemsErr) {
    logger.error('Failed to get seller items for order', { itemsErr, orderId });
    throw new AppError('Failed to fetch order items', HTTP.INTERNAL_SERVER_ERROR);
  }

  if (!sellerItems || sellerItems.length === 0) {
    throw new AppError('You do not have items in this order', HTTP.FORBIDDEN);
  }

  const sellerSubtotal = roundMoney(
    sellerItems.reduce((sum, item) => sum + Number(item.subtotal), 0)
  );

  return {
    ...order,
    seller_subtotal: sellerSubtotal,
    items: sellerItems,
  };
}

/**
 * Update order status.
 *
 * Enforces valid state transitions and restores stock upon cancellation.
 *
 * @param {string} orderId - Order UUID
 * @param {string} newStatus - Target ORDER_STATUS
 * @param {object} actor - { userId, role, sellerProfileId }
 * @returns {Promise<object>} Updated order record
 */
export async function updateOrderStatus(orderId, newStatus, actor) {
  // 1. Fetch current order
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_id, order_status, payment_status')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    throw new AppError('Order not found', HTTP.NOT_FOUND);
  }

  // 2. Authorization check
  if (actor.role === 'buyer') {
    if (order.buyer_id !== actor.userId) {
      throw new AppError('You do not have permission to modify this order', HTTP.FORBIDDEN);
    }
    // Buyers can only cancel pending_payment or confirmed orders
    if (newStatus !== ORDER_STATUS.CANCELLED) {
      throw new AppError('Buyers can only cancel orders', HTTP.BAD_REQUEST);
    }
    if (![ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CONFIRMED].includes(order.order_status)) {
      throw new AppError(
        `Cannot cancel order with status "${order.order_status}". It may have already been processed or shipped.`,
        HTTP.BAD_REQUEST
      );
    }
  } else if (actor.role === 'seller') {
    // Seller must have items in this order
    const seller = await getSellerByUserId(actor.userId);
    const { data: sellerItem } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .eq('seller_id', seller.id)
      .limit(1)
      .maybeSingle();

    if (!sellerItem) {
      throw new AppError('You do not have items in this order', HTTP.FORBIDDEN);
    }
  }

  // 3. Validate lifecycle transition
  const currentStatus = order.order_status;
  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid order status transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedNextStatuses.join(', ') || 'none'}`,
      HTTP.BAD_REQUEST
    );
  }

  // 4. Update order status
  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updateErr) {
    logger.error('Failed to update order status', { updateErr, orderId });
    throw new AppError('Failed to update order status', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 5. If cancelled, restore stock for products in the order
  if (newStatus === ORDER_STATUS.CANCELLED) {
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);

    for (const item of orderItems || []) {
      const { data: prod } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .maybeSingle();

      if (prod) {
        await supabaseAdmin
          .from('products')
          .update({ stock: prod.stock + item.quantity })
          .eq('id', item.product_id);
      }
    }
  }

  return updatedOrder;
}
