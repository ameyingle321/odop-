/**
 * ODOP Nexus — Phase 6: Cart & Order System Integration Tests
 *
 * Verifies Acceptance Criteria & Business Invariants:
 *   1. Complete Buyer Journey: Product -> Add to Cart -> Cart -> Checkout -> Order -> History
 *   2. Cart Operations:
 *      - Add item to cart (POST /api/cart/items)
 *      - Add same item again (increments quantity)
 *      - Exceeding product stock on add is rejected (400 Bad Request)
 *      - View cart (GET /api/cart) with server-calculated subtotal & checkout eligibility
 *      - Update item quantity (PUT /api/cart/items/:id)
 *      - Exceeding stock on update is rejected (400 Bad Request)
 *      - Remove item from cart (DELETE /api/cart/items/:id)
 *      - Clear entire cart (DELETE /api/cart)
 *   3. Authoritative Order Creation:
 *      - Create order from cart (POST /api/orders)
 *      - Server-calculated total_amount & immutable price snapshotting
 *      - Product inventory decrement
 *      - Automatic cart clearing upon order completion
 *      - Attempting order with insufficient stock rejected (400)
 *      - Attempting order with empty cart rejected (400)
 *   4. Buyer Security & Ownership:
 *      - View order history (GET /api/orders)
 *      - View single order (GET /api/orders/:id)
 *      - Buyer isolation: Buyer 2 cannot view Buyer 1 order (404 Not Found)
 *   5. Seller Fulfillment & Item Isolation:
 *      - Seller views fulfilled orders (GET /api/seller/orders)
 *      - Multi-seller order isolation: Seller only sees their fulfilled items and subtotal
 *      - Seller single order view (GET /api/seller/orders/:id)
 *   6. Order Lifecycle & Inventory Restoration:
 *      - Valid transitions (pending_payment -> confirmed -> processing -> shipped -> delivered)
 *      - Invalid transition jump rejected (400 Bad Request)
 *      - Cancellation restores product stock
 *
 * Usage: node tests/cart_order.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';
import { ORDER_STATUS } from '../src/constants/index.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('ODOP Nexus — Phase 6 Cart & Order Integration Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ ${testName}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  let seller1Token = null;
  let seller1UserId = null;
  let seller1ProfileId = null;

  let seller2Token = null;
  let seller2UserId = null;
  let seller2ProfileId = null;

  let buyer1Token = null;
  let buyer1UserId = null;

  let buyer2Token = null;
  let buyer2UserId = null;

  let product1 = null; // Owned by Seller 1 (price 1200, stock 10)
  let product2 = null; // Owned by Seller 2 (price 800, stock 5)
  let productOutOfStock = null; // Owned by Seller 1 (stock 0)

  // Delivery payload for checkout
  const validDeliveryInfo = {
    delivery_name: 'Tanvi Shinde',
    delivery_phone: '+919876543210',
    delivery_address: '42 Heritage Lane, Shivaji Nagar',
    delivery_city: 'Pune',
    delivery_district: 'Pune',
    delivery_state: 'Maharashtra',
    delivery_pincode: '411005',
  };

  try {
    // ------------------------------------------------------------------
    // Setup Reference Data & Test Users
    // ------------------------------------------------------------------
    const { data: districts } = await supabaseAdmin
      .from('districts')
      .select('id, name')
      .in('name', ['Pune', 'Kolhapur'])
      .limit(2);

    const puneDist = districts.find((d) => d.name === 'Pune') || districts[0];
    const kolhapurDist = districts.find((d) => d.name === 'Kolhapur') || districts[1] || districts[0];

    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('id')
      .limit(1)
      .single();

    // 1. Setup Seller 1 (Pune)
    const s1Email = `seller1.cart.${timestamp}@gmail.com`;
    const s1RegRes = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pune Artisan 1',
        email: s1Email,
        password: 'Password123!',
        phone: '9876543201',
        district_id: puneDist.id,
        business_name: 'Pune Heritage Crafts',
        address: '10 Heritage Lane',
        state: 'Maharashtra',
      }),
    });
    const s1Data = await s1RegRes.json();
    if (!s1Data.success) throw new Error(`Seller 1 registration failed: ${s1Data.message}`);
    seller1UserId = s1Data.data.user.id;
    seller1Token = s1Data.data.session.access_token;
    seller1ProfileId = s1Data.data.user.seller_profile_id;

    // 2. Setup Seller 2 (Kolhapur)
    const s2Email = `seller2.cart.${timestamp}@gmail.com`;
    const s2RegRes = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kolhapur Craftsman',
        email: s2Email,
        password: 'Password123!',
        phone: '9876543202',
        district_id: kolhapurDist.id,
        business_name: 'Kolhapur Chappal Artisans',
        address: '20 Market Street',
        state: 'Maharashtra',
      }),
    });
    const s2Data = await s2RegRes.json();
    if (!s2Data.success) throw new Error(`Seller 2 registration failed: ${s2Data.message}`);
    seller2UserId = s2Data.data.user.id;
    seller2Token = s2Data.data.session.access_token;
    seller2ProfileId = s2Data.data.user.seller_profile_id;

    // 3. Setup Buyer 1 & Buyer 2
    const b1Email = `buyer1.cart.${timestamp}@gmail.com`;
    const b1RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Buyer One',
        email: b1Email,
        password: 'Password123!',
      }),
    });
    const b1Data = await b1RegRes.json();
    if (!b1Data.success) throw new Error(`Buyer 1 registration failed: ${b1Data.message}`);
    buyer1UserId = b1Data.data.user.id;
    buyer1Token = b1Data.data.session.access_token;

    const b2Email = `buyer2.cart.${timestamp}@gmail.com`;
    const b2RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Buyer Two',
        email: b2Email,
        password: 'Password123!',
      }),
    });
    const b2Data = await b2RegRes.json();
    if (!b2Data.success) throw new Error(`Buyer 2 registration failed: ${b2Data.message}`);
    buyer2UserId = b2Data.data.user.id;
    buyer2Token = b2Data.data.session.access_token;

    // 4. Create Test Products
    // Prod 1: Seller 1, price 1200, stock 10, status: active
    const resP1 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        name: `Puneri Paithani Weave ${timestamp}`,
        description: 'Authentic pure silk weave',
        price: 1200.0,
        stock: 10,
        category_id: category.id,
        district_id: puneDist.id,
        status: 'active',
      }),
    });
    const dataP1 = await resP1.json();
    product1 = dataP1.data;

    // Prod 2: Seller 2, price 800, stock 5, status: active
    const resP2 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller2Token}` },
      body: JSON.stringify({
        name: `Kolhapuri Leather Footwear ${timestamp}`,
        description: 'Handmade leather crafts',
        price: 800.0,
        stock: 5,
        category_id: category.id,
        district_id: kolhapurDist.id,
        status: 'active',
      }),
    });
    const dataP2 = await resP2.json();
    product2 = dataP2.data;

    // Prod Out of Stock: Seller 1, stock 0, status: active
    const resP3 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
      body: JSON.stringify({
        name: `Puneri Vintage Lamp ${timestamp}`,
        description: 'Antique brass lamp',
        price: 2500.0,
        stock: 0,
        category_id: category.id,
        district_id: puneDist.id,
        status: 'active',
      }),
    });
    const dataP3 = await resP3.json();
    productOutOfStock = dataP3.data;

    // ------------------------------------------------------------------
    // TEST 1: Cart Access & Unauthenticated Rejection
    // ------------------------------------------------------------------
    console.log('--- 1. Cart Authentication & Initial State ---');
    {
      const unauthRes = await fetch(`${BASE_URL}/cart`);
      assert(unauthRes.status === 401, 'Unauthenticated GET /cart returns 401 Unauthorized');

      const b1CartRes = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const b1Cart = await b1CartRes.json();
      assert(b1CartRes.status === 200, 'Buyer GET /cart returns 200 OK');
      assert(b1Cart.data.items.length === 0, 'Initial cart is empty');
      assert(b1Cart.data.subtotal === 0, 'Initial subtotal is 0');
      assert(b1Cart.data.total_items === 0, 'Initial total_items is 0');
    }

    // ------------------------------------------------------------------
    // TEST 2: Add Items to Cart
    // ------------------------------------------------------------------
    console.log('\n--- 2. Add to Cart Operations ---');
    let cartItemId1 = null;
    {
      // Add Product 1 (quantity 2)
      const addRes1 = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product1.id, quantity: 2 }),
      });
      const addData1 = await addRes1.json();
      assert(addRes1.status === 201, 'POST /cart/items returns 201 Created');
      assert(addData1.data.cart_item.quantity === 2, 'Added quantity is 2');
      assert(addData1.data.cart.subtotal === 2400, 'Cart subtotal matches 2 * 1200 = 2400');
      assert(addData1.data.cart.total_items === 2, 'Cart total_items is 2');
      cartItemId1 = addData1.data.cart_item.id;

      // Add same product again (increments quantity by 1 -> total 3)
      const addRes1Again = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product1.id, quantity: 1 }),
      });
      const addData1Again = await addRes1Again.json();
      assert(addData1Again.data.cart_item.quantity === 3, 'Incremented existing item quantity to 3');
      assert(addData1Again.data.cart.subtotal === 3600, 'Updated subtotal matches 3 * 1200 = 3600');

      // Add Product 2 from different seller (quantity 1) -> Multi-seller cart
      const addRes2 = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product2.id, quantity: 1 }),
      });
      const addData2 = await addRes2.json();
      assert(addRes2.status === 201, 'Added Product 2 from Seller 2 to cart');
      assert(addData2.data.cart.total_items === 4, 'Cart total_items is 4 (3 + 1)');
      assert(addData2.data.cart.subtotal === 4400, 'Authoritative subtotal: 3600 + 800 = 4400');
      assert(addData2.data.cart.is_checkout_ready === true, 'Cart is ready for checkout');

      // Attempt to add out-of-stock product
      const addOutOfStockRes = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: productOutOfStock.id, quantity: 1 }),
      });
      assert(addOutOfStockRes.status === 400, 'Adding out-of-stock product returns 400 Bad Request');

      // Attempt to exceed product 2 stock (available stock 5, adding 10)
      const exceedStockRes = await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product2.id, quantity: 10 }),
      });
      assert(exceedStockRes.status === 400, 'Exceeding available stock returns 400 Bad Request');
    }

    // ------------------------------------------------------------------
    // TEST 3: Update and Remove Cart Items
    // ------------------------------------------------------------------
    console.log('\n--- 3. Update & Remove Cart Items ---');
    {
      // Update quantity of Product 1 to 2
      const updateRes = await fetch(`${BASE_URL}/cart/items/${cartItemId1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ quantity: 2 }),
      });
      const updateData = await updateRes.json();
      assert(updateRes.status === 200, 'PUT /cart/items/:id returns 200 OK');
      assert(updateData.data.cart_item.quantity === 2, 'Quantity updated to 2');
      assert(updateData.data.cart.subtotal === 3200, 'Subtotal updated: 2 * 1200 + 1 * 800 = 3200');

      // Exceeding stock on update is rejected
      const exceedUpdateRes = await fetch(`${BASE_URL}/cart/items/${cartItemId1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ quantity: 99 }),
      });
      assert(exceedUpdateRes.status === 400, 'Exceeding stock on PUT returns 400 Bad Request');

      // Buyer 2 cannot update Buyer 1 cart item (isolation)
      const isolateRes = await fetch(`${BASE_URL}/cart/items/${cartItemId1}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer2Token}` },
        body: JSON.stringify({ quantity: 1 }),
      });
      assert(isolateRes.status === 404, 'Buyer 2 cannot update Buyer 1 cart item (404 Not Found)');

      // Remove Product 2 from cart
      const b1Cart = await (await fetch(`${BASE_URL}/cart`, { headers: { Authorization: `Bearer ${buyer1Token}` } })).json();
      const p2CartItem = b1Cart.data.items.find((i) => i.product_id === product2.id);

      const removeRes = await fetch(`${BASE_URL}/cart/items/${p2CartItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const removeData = await removeRes.json();
      assert(removeRes.status === 200, 'DELETE /cart/items/:id returns 200 OK');
      assert(removeData.data.items.length === 1, 'Only 1 item remaining in cart');
      assert(removeData.data.subtotal === 2400, 'Cart subtotal matches remaining product: 2400');
    }

    // ------------------------------------------------------------------
    // TEST 4: Clear Cart & Repopulate for Checkout
    // ------------------------------------------------------------------
    console.log('\n--- 4. Clear Cart & Repopulate for Checkout ---');
    {
      const clearRes = await fetch(`${BASE_URL}/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      assert(clearRes.status === 200, 'DELETE /cart clears the cart');

      const emptyCart = await (await fetch(`${BASE_URL}/cart`, { headers: { Authorization: `Bearer ${buyer1Token}` } })).json();
      assert(emptyCart.data.items.length === 0, 'Cart is confirmed empty');

      // Repopulate with Product 1 (qty: 2) & Product 2 (qty: 1)
      await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product1.id, quantity: 2 }),
      });
      await fetch(`${BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ product_id: product2.id, quantity: 1 }),
      });
      console.log('  Repopulated Buyer 1 cart: 2x Prod1 (2400) + 1x Prod2 (800) = 3200');
    }

    // ------------------------------------------------------------------
    // TEST 5: Order Creation from Cart (Complete Journey)
    // ------------------------------------------------------------------
    console.log('\n--- 5. Order Creation (Checkout from Cart) ---');
    let createdOrder = null;
    {
      const initialStockP1 = 10;
      const initialStockP2 = 5;

      const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify(validDeliveryInfo),
      });
      const orderData = await orderRes.json();
      assert(orderRes.status === 201, 'POST /orders returns 201 Created');
      assert(orderData.success === true, 'Order creation response success is true');
      createdOrder = orderData.data;

      // Verify Authoritative Calculations
      assert(Number(createdOrder.total_amount) === 3200, 'Authoritative total_amount is 3200.00');
      assert(createdOrder.order_status === ORDER_STATUS.PENDING_PAYMENT, 'Initial status is pending_payment');
      assert(createdOrder.payment_status === 'pending', 'Initial payment_status is pending');
      assert(createdOrder.items.length === 2, 'Contains exactly 2 order_items snapshots');

      // Verify Line Item Snapshots
      const item1 = createdOrder.items.find((i) => i.product_id === product1.id);
      const item2 = createdOrder.items.find((i) => i.product_id === product2.id);
      assert(item1 && Number(item1.unit_price) === 1200 && item1.quantity === 2 && Number(item1.subtotal) === 2400, 'Item 1 price snapshot is accurate');
      assert(item2 && Number(item2.unit_price) === 800 && item2.quantity === 1 && Number(item2.subtotal) === 800, 'Item 2 price snapshot is accurate');
      assert(item1.seller_id === seller1ProfileId, 'Item 1 belongs to Seller 1');
      assert(item2.seller_id === seller2ProfileId, 'Item 2 belongs to Seller 2');

      // Verify Stock Decrement
      const { data: updatedP1 } = await supabaseAdmin.from('products').select('stock').eq('id', product1.id).single();
      const { data: updatedP2 } = await supabaseAdmin.from('products').select('stock').eq('id', product2.id).single();
      assert(updatedP1.stock === initialStockP1 - 2, `Product 1 stock decremented from ${initialStockP1} to ${updatedP1.stock}`);
      assert(updatedP2.stock === initialStockP2 - 1, `Product 2 stock decremented from ${initialStockP2} to ${updatedP2.stock}`);

      // Verify Cart Cleared
      const postOrderCart = await (await fetch(`${BASE_URL}/cart`, { headers: { Authorization: `Bearer ${buyer1Token}` } })).json();
      assert(postOrderCart.data.items.length === 0, 'Cart is automatically cleared after placing order');
    }

    // ------------------------------------------------------------------
    // TEST 6: Order Invariant - Empty Cart Checkout Rejection
    // ------------------------------------------------------------------
    console.log('\n--- 6. Empty Cart Checkout Rejection ---');
    {
      const emptyOrderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify(validDeliveryInfo),
      });
      assert(emptyOrderRes.status === 400, 'Placing order with empty cart returns 400 Bad Request');
    }

    // ------------------------------------------------------------------
    // TEST 7: Buyer Order History & Detail View
    // ------------------------------------------------------------------
    console.log('\n--- 7. Buyer Order History & Ownership Isolation ---');
    {
      // Buyer 1 retrieves orders
      const b1OrdersRes = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const b1Orders = await b1OrdersRes.json();
      assert(b1OrdersRes.status === 200, 'GET /orders returns 200 OK');
      assert(b1Orders.data.orders.length === 1, 'Buyer 1 sees exactly 1 order in history');
      assert(b1Orders.data.orders[0].id === createdOrder.id, 'Order ID matches created order');

      // Buyer 1 retrieves single order details
      const b1SingleOrderRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}`, {
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const b1SingleOrder = await b1SingleOrderRes.json();
      assert(b1SingleOrderRes.status === 200, 'GET /orders/:id returns 200 OK');
      assert(b1SingleOrder.data.delivery_address === validDeliveryInfo.delivery_address, 'Address snapshot returned');

      // Buyer 2 tries to access Buyer 1 order (Isolation check)
      const b2AccessRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}`, {
        headers: { Authorization: `Bearer ${buyer2Token}` },
      });
      assert(b2AccessRes.status === 404, 'Buyer 2 attempting to view Buyer 1 order returns 404 Not Found');

      // Buyer 2 sees 0 orders in their own history
      const b2OrdersRes = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${buyer2Token}` },
      });
      const b2Orders = await b2OrdersRes.json();
      assert(b2Orders.data.orders.length === 0, 'Buyer 2 history is completely empty (strict isolation)');
    }

    // ------------------------------------------------------------------
    // TEST 8: Seller Fulfillment & Multi-Seller Isolation
    // ------------------------------------------------------------------
    console.log('\n--- 8. Seller Fulfillment & Multi-Seller Isolation ---');
    {
      // Seller 1 fetches orders
      const s1OrdersRes = await fetch(`${BASE_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${seller1Token}` },
      });
      const s1Orders = await s1OrdersRes.json();
      assert(s1OrdersRes.status === 200, 'Seller 1 GET /seller/orders returns 200 OK');
      assert(s1Orders.data.orders.length === 1, 'Seller 1 sees 1 order containing their product');

      const s1OrderEntry = s1Orders.data.orders[0];
      assert(s1OrderEntry.items.length === 1, 'Seller 1 ONLY sees 1 line item (their product)');
      assert(s1OrderEntry.items[0].product_id === product1.id, 'Seller 1 item is product 1');
      assert(s1OrderEntry.seller_subtotal === 2400, 'Seller 1 subtotal is strictly their share: 2400 (not 3200)');

      // Seller 2 fetches orders
      const s2OrdersRes = await fetch(`${BASE_URL}/seller/orders`, {
        headers: { Authorization: `Bearer ${seller2Token}` },
      });
      const s2Orders = await s2OrdersRes.json();
      assert(s2OrdersRes.status === 200, 'Seller 2 GET /seller/orders returns 200 OK');
      assert(s2Orders.data.orders.length === 1, 'Seller 2 sees 1 order containing their product');

      const s2OrderEntry = s2Orders.data.orders[0];
      assert(s2OrderEntry.items.length === 1, 'Seller 2 ONLY sees 1 line item (their product)');
      assert(s2OrderEntry.items[0].product_id === product2.id, 'Seller 2 item is product 2');
      assert(s2OrderEntry.seller_subtotal === 800, 'Seller 2 subtotal is strictly their share: 800 (not 3200)');

      // Seller 1 single order view
      const s1DetailRes = await fetch(`${BASE_URL}/seller/orders/${createdOrder.id}`, {
        headers: { Authorization: `Bearer ${seller1Token}` },
      });
      const s1Detail = await s1DetailRes.json();
      assert(s1DetailRes.status === 200, 'Seller 1 GET /seller/orders/:id returns 200 OK');
      assert(s1Detail.data.items.length === 1, 'Seller 1 detail view strictly contains only their line item');
    }

    // ------------------------------------------------------------------
    // TEST 9: Order Lifecycle & Status Progression
    // ------------------------------------------------------------------
    console.log('\n--- 9. Order Status Progression & Transitions ---');
    {
      // 1. Invalid transition jump: pending_payment -> delivered (rejected)
      const invalidJumpRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.DELIVERED }),
      });
      assert(invalidJumpRes.status === 400, 'Illegal transition jump (pending_payment -> delivered) rejected with 400');

      // 2. Step 1: pending_payment -> confirmed
      const confirmRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.CONFIRMED }),
      });
      const confirmData = await confirmRes.json();
      assert(confirmRes.status === 200, 'Transition to CONFIRMED returns 200 OK');
      assert(confirmData.data.order_status === ORDER_STATUS.CONFIRMED, 'Order status updated to confirmed');

      // 3. Step 2: confirmed -> processing
      const processRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.PROCESSING }),
      });
      assert(processRes.status === 200, 'Transition to PROCESSING returns 200 OK');

      // 4. Step 3: processing -> shipped
      const shipRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.SHIPPED }),
      });
      assert(shipRes.status === 200, 'Transition to SHIPPED returns 200 OK');

      // 5. Step 4: shipped -> delivered
      const deliverRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.DELIVERED }),
      });
      assert(deliverRes.status === 200, 'Transition to DELIVERED returns 200 OK');

      // 6. Delivered order cannot be transitioned further
      const postDeliveredRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seller1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.CANCELLED }),
      });
      assert(postDeliveredRes.status === 400, 'Transition from DELIVERED to CANCELLED rejected with 400');
    }

    // ------------------------------------------------------------------
    // TEST 10: Cancellation & Inventory Restoration
    // ------------------------------------------------------------------
    console.log('\n--- 10. Order Cancellation & Inventory Restoration ---');
    {
      // Create a new direct order for Buyer 1 with 2 units of Product 2
      const stockBefore = (await supabaseAdmin.from('products').select('stock').eq('id', product2.id).single()).data.stock;

      const directOrderRes = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          ...validDeliveryInfo,
          items: [{ product_id: product2.id, quantity: 2 }],
        }),
      });
      const directOrder = (await directOrderRes.json()).data;
      assert(directOrderRes.status === 201, 'Direct order created successfully');

      const stockAfterOrder = (await supabaseAdmin.from('products').select('stock').eq('id', product2.id).single()).data.stock;
      assert(stockAfterOrder === stockBefore - 2, 'Stock decremented by 2 upon direct order placement');

      // Buyer cancels this pending_payment order
      const cancelRes = await fetch(`${BASE_URL}/orders/${directOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_status: ORDER_STATUS.CANCELLED }),
      });
      const cancelData = await cancelRes.json();
      assert(cancelRes.status === 200, 'Buyer cancellation returns 200 OK');
      assert(cancelData.data.order_status === ORDER_STATUS.CANCELLED, 'Order status set to cancelled');

      // Verify Inventory Restoration
      const stockAfterCancel = (await supabaseAdmin.from('products').select('stock').eq('id', product2.id).single()).data.stock;
      assert(stockAfterCancel === stockBefore, `Stock restored back to original level: ${stockAfterCancel}`);
    }

    // ------------------------------------------------------------------
    // Cleanup Test Users & Data
    // ------------------------------------------------------------------
    console.log('\n--- Cleanup Test Users & Data ---');
    if (product1?.id) await supabaseAdmin.from('products').delete().eq('id', product1.id);
    if (product2?.id) await supabaseAdmin.from('products').delete().eq('id', product2.id);
    if (productOutOfStock?.id) await supabaseAdmin.from('products').delete().eq('id', productOutOfStock.id);

    if (seller1UserId) await supabaseAdmin.auth.admin.deleteUser(seller1UserId);
    if (seller2UserId) await supabaseAdmin.auth.admin.deleteUser(seller2UserId);
    if (buyer1UserId) await supabaseAdmin.auth.admin.deleteUser(buyer1UserId);
    if (buyer2UserId) await supabaseAdmin.auth.admin.deleteUser(buyer2UserId);
    console.log('  🧹 Cleaned up test orders, cart items, products, and users');
  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
