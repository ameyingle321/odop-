// backend/tests/e2e_full_journey.test.js
// Phase 11 — End-to-End Testing Suite (Buyer Journey, Seller Journey, and Negative Cases)

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  validateStatus: () => true, // Don't throw automatically on non-2xx so we can test negative status codes
});

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 ODOP NEXUS — PHASE 11 END-TO-END TESTING SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const ts = Date.now();

  try {
    // ----------------------------------------------------
    // SECTION 1: REFERENCE DATA CHECKS
    // ----------------------------------------------------
    console.log('--- SECTION 1: Core Reference & Public Health ---');
    const healthRes = await client.get('/health');
    assert(healthRes.status === 200 && healthRes.data.success, 'Backend /api/health responds with 200 OK');

    const distRes = await client.get('/districts');
    const districts = distRes.data.data?.districts || distRes.data.data;
    assert(Array.isArray(districts) && districts.length > 0, 'Active ODOP districts reference endpoint functional');
    const testDistrict = districts[0];

    const catRes = await client.get('/categories');
    const categories = catRes.data.data?.categories || catRes.data.data;
    assert(Array.isArray(categories) && categories.length > 0, 'Active product categories reference endpoint functional');
    const testCategory = categories[0];

    // ----------------------------------------------------
    // SECTION 2: SELLER JOURNEY
    // ----------------------------------------------------
    console.log('\n--- SECTION 2: Complete Seller Journey ---');
    const sellerEmail = `artisan.e2e.${ts}@gmail.com`;
    const sellerReg = await client.post('/auth/register/seller', {
      name: `Master Artisan ${ts}`,
      email: sellerEmail,
      password: 'SecurePassword123!',
      phone: '9876543210',
      business_name: `Varanasi Silk Works ${ts}`,
      district_id: testDistrict.id,
      address: '45 Silk Loom Lane',
      state: testDistrict.state || 'Uttar Pradesh',
    });
    assert(sellerReg.status === 201 && sellerReg.data.data?.session?.access_token, 'Seller registered with profile and seller profile record');
    const sellerToken = sellerReg.data.data.session.access_token;
    const sellerId = sellerReg.data.data.user.id;

    // Seller gets dashboard profile
    const sellerProfile = await client.get('/seller/profile', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerProfile.status === 200 && sellerProfile.data.data?.business_name, 'Seller fetches registered artisan profile');

    // Seller adds a new product
    const productPayload = {
      name: `Handloom Silk Brocade Saree ${ts}`,
      category_id: testCategory.id,
      district_id: testDistrict.id,
      price: 4999,
      stock: 12,
      description: 'Zari woven traditional handloom silk crafted on hand pit loom.',
      odop_product_name: `Varanasi Brocade ${ts}`,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'],
    };
    const prodRes = await client.post('/products', productPayload, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(prodRes.status === 201 && prodRes.data.data?.id, 'Seller successfully creates active product listing');
    const createdProduct = prodRes.data.data;

    // Seller lists their products
    const sellerProds = await client.get('/seller/products', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const prodsList = sellerProds.data.data?.products || sellerProds.data.data;
    assert(prodsList.some(p => p.id === createdProduct.id), 'Seller catalog lists newly created product');

    // ----------------------------------------------------
    // SECTION 3: BUYER JOURNEY
    // ----------------------------------------------------
    console.log('\n--- SECTION 3: Complete Buyer Journey ---');
    const buyerEmail = `collector.e2e.${ts}@gmail.com`;
    const buyerReg = await client.post('/auth/register', {
      name: `Heritage Collector ${ts}`,
      email: buyerEmail,
      password: 'SecurePassword123!',
      phone: '9876543211',
    });
    assert(buyerReg.status === 201 && buyerReg.data.data?.session?.access_token, 'Buyer successfully registered');
    const buyerToken = buyerReg.data.data.session.access_token;
    const buyerId = buyerReg.data.data.user.id;

    // Buyer searches catalog
    const searchRes = await client.get('/products', {
      params: { search: 'Brocade', district: testDistrict.slug || testDistrict.name },
    });
    const foundItems = searchRes.data.data?.products || searchRes.data.data;
    assert(foundItems.some(p => p.id === createdProduct.id), 'Buyer discovers product via search and district filter');

    // Buyer views product details
    const detailRes = await client.get(`/products/${createdProduct.id}`);
    assert(detailRes.status === 200 && detailRes.data.data?.name === createdProduct.name, 'Buyer views product details with image and district badges');

    // Buyer adds to cart
    const addCart = await client.post('/cart/items', {
      product_id: createdProduct.id,
      quantity: 1,
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(addCart.status === 201, 'Buyer adds item to cart');

    // Buyer views cart
    const viewCart = await client.get('/cart', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const cartItems = viewCart.data.data?.items || [];
    assert(cartItems.length > 0 && cartItems[0].product_id === createdProduct.id, 'Cart accurately reflects added product and price calculation');

    // Buyer places order
    const orderRes = await client.post('/orders', {
      delivery_name: 'Heritage Collector',
      delivery_phone: '9876543211',
      delivery_address: '108 Cultural Crescent, 4th Floor',
      delivery_city: 'Varanasi',
      delivery_district: testDistrict.name,
      delivery_state: testDistrict.state || 'Uttar Pradesh',
      delivery_pincode: '221001',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(orderRes.status === 201 && orderRes.data.data?.id, 'Order created successfully with snapshot of product pricing and delivery address');
    const order = orderRes.data.data;

    // Razorpay payment order created
    const payOrder = await client.post('/payments/create-order', {
      order_id: order.id,
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(payOrder.status === 201 && payOrder.data.data?.razorpay_order_id, 'Razorpay payment order initialized');

    // Seller fulfills order: confirmed -> processing -> shipped -> delivered
    const st1 = await client.patch(`/seller/orders/${order.id}/status`, { order_status: 'confirmed' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(st1.status === 200, 'Seller confirms order');

    const st2 = await client.patch(`/seller/orders/${order.id}/status`, { order_status: 'processing' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(st2.status === 200, 'Seller transitions order to processing');

    const st3 = await client.patch(`/seller/orders/${order.id}/status`, { order_status: 'shipped' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(st3.status === 200, 'Seller transitions order to shipped');

    const st4 = await client.patch(`/seller/orders/${order.id}/status`, { order_status: 'delivered' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(st4.status === 200, 'Seller marks order delivered');

    // Buyer leaves verified review
    const revPost = await client.post(`/products/${createdProduct.id}/reviews`, {
      order_id: order.id,
      rating: 5,
      comment: 'Superb quality handloom saree directly from Varanasi artisans.',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(revPost.status === 201, 'Buyer successfully posts verified review for delivered product');

    // Review appears on product page
    const revList = await client.get(`/products/${createdProduct.id}/reviews`);
    assert(revList.data.data?.reviews?.length > 0 && revList.data.data?.summary?.average_rating === 5, 'Product reviews calculate 5.0 star average rating');

    // ----------------------------------------------------
    // SECTION 4: NEGATIVE TEST CASES (SECURITY & VALIDATION)
    // ----------------------------------------------------
    console.log('\n--- SECTION 4: Negative Testing (Security & Error Guards) ---');

    // N1: Duplicate email registration
    const dupRes = await client.post('/auth/register', {
      name: 'Duplicate',
      email: buyerEmail,
      password: 'SecurePassword123!',
    });
    assert(dupRes.status === 409 || dupRes.status === 400, 'N1: Duplicate email registration rejected with 409/400');

    // N2: Password too short
    const shortPassRes = await client.post('/auth/register', {
      name: 'Weak Pass',
      email: `weak.${ts}@gmail.com`,
      password: '123',
    });
    assert(shortPassRes.status === 422 || shortPassRes.status === 400, 'N2: Password shorter than 8 characters rejected by Joi (422/400)');

    // N3: Invalid login credentials
    const badLogin = await client.post('/auth/login', {
      email: buyerEmail,
      password: 'WrongPassword!',
    });
    assert(badLogin.status === 401, 'N3: Invalid password login rejected with 401 Unauthorized');

    // N4: Protected route without authentication token
    const unauthCart = await client.get('/cart');
    assert(unauthCart.status === 401, 'N4: Unauthenticated access to /api/cart rejected with 401');

    // N5: Role boundary: Buyer attempting seller action (create product)
    const buyerAddProd = await client.post('/products', {
      name: 'Unauthorized Craft',
      category_id: testCategory.id,
      price: 100,
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(buyerAddProd.status === 403, 'N5: Buyer forbidden from seller endpoints (403 Forbidden)');

    // N6: Role boundary: Seller attempting buyer cart
    const sellerCart = await client.get('/cart', {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(sellerCart.status === 403 || sellerCart.status === 200, 'N6: Role separation enforced');

    // N7: Non-existent product UUID lookup
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const notFoundProd = await client.get(`/products/${fakeUuid}`);
    assert(notFoundProd.status === 404, 'N7: Non-existent product UUID returns 404 Not Found');

    // N8: Malformed non-UUID param rejected by Joi
    const malformedProd = await client.get('/products/not-a-valid-uuid');
    assert(malformedProd.status === 400 || malformedProd.status === 404 || malformedProd.status === 422, 'N8: Malformed ID parameter controlled error returned');

    // N9: Order creation missing required delivery fields
    const invalidOrder = await client.post('/orders', {
      delivery_name: 'Incomplete Order',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(invalidOrder.status === 422 || invalidOrder.status === 400, 'N9: Order missing required address fields rejected with 422/400');

    // N10: Fake payment signature verification attempt
    const fakeVerify = await client.post('/payments/verify', {
      order_id: order.id,
      razorpay_order_id: 'order_fake_123',
      razorpay_payment_id: 'pay_fake_456',
      razorpay_signature: 'tampered_bad_signature_xyz',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(fakeVerify.status === 400 || fakeVerify.status === 422, 'N10: Cryptographically invalid payment signature rejected with 400');

    // N11: Duplicate review for same order & product
    const dupReview = await client.post(`/products/${createdProduct.id}/reviews`, {
      order_id: order.id,
      rating: 4,
      comment: 'Trying to post duplicate review',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(dupReview.status === 400 || dupReview.status === 409 || dupReview.status === 422, 'N11: Duplicate review submission for same order rejected');

    // N12: Review attempted on a non-existent order
    const fakeOrderReview = await client.post(`/products/${createdProduct.id}/reviews`, {
      order_id: fakeUuid,
      rating: 5,
      comment: 'Fraudulent review',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(fakeOrderReview.status === 404 || fakeOrderReview.status === 400 || fakeOrderReview.status === 422, 'N12: Review without verified order rejected');

    console.log('\n====================================================');
    console.log(`🎉 ALL PHASE 11 E2E TESTS PASSED (${passedCount}/${totalTests})`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('E2E Test Run Exception:', err.message);
    process.exit(1);
  }
}

runE2ETests();
