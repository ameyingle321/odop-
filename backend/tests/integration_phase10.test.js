// backend/tests/integration_phase10.test.js
// Verification of Phase 10 Full Integration (Frontend API Client to Backend to Supabase)

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const client = axios.create({ baseURL: API_URL, timeout: 15000 });

async function runPhase10Tests() {
  console.log('--- Phase 10 Integration Tests Starting ---');
  const timestamp = Date.now();

  try {
    // 1. Health & Reference APIs
    console.log('1. Testing /api/health, /api/districts, /api/categories...');
    const health = await client.get('/health');
    if (!health.data.success) throw new Error('Health check failed');

    const districtsRes = await client.get('/districts');
    const districts = districtsRes.data.data?.districts || districtsRes.data.data;
    if (!Array.isArray(districts) || districts.length === 0) throw new Error('Districts fetch failed');
    const testDistrict = districts[0];
    console.log(`✓ Districts loaded (${districts.length} found). Using "${testDistrict.name}"`);

    const categoriesRes = await client.get('/categories');
    const categories = categoriesRes.data.data?.categories || categoriesRes.data.data;
    if (!Array.isArray(categories) || categories.length === 0) throw new Error('Categories fetch failed');
    const testCategory = categories[0];
    console.log(`✓ Categories loaded (${categories.length} found). Using "${testCategory.name}"`);

    // 2. Auth: Register Seller
    console.log('2. Testing Seller registration with district association...');
    const sellerPayload = {
      name: `Artisan Master ${timestamp}`,
      email: `artisan.${timestamp}@gmail.com`,
      password: 'SecurePassword123!',
      phone: '9876543210',
      business_name: `Heritage Crafts ${timestamp}`,
      district_id: testDistrict.id,
      address: '12 Weaver Colony, Artisan Lane',
      state: testDistrict.state || 'Uttar Pradesh',
    };
    const sellerReg = await client.post('/auth/register/seller', sellerPayload);
    const sellerToken = sellerReg.data.data.session.access_token;
    console.log(`✓ Seller registered with ID: ${sellerReg.data.data.user.id}`);

    // 3. Auth: Register Buyer
    console.log('3. Testing Buyer registration...');
    const buyerPayload = {
      name: `Craft Collector ${timestamp}`,
      email: `collector.${timestamp}@gmail.com`,
      password: 'SecurePassword123!',
      phone: '9876543211',
    };
    const buyerReg = await client.post('/auth/register', buyerPayload);
    const buyerToken = buyerReg.data.data.session.access_token;
    console.log(`✓ Buyer registered with ID: ${buyerReg.data.data.user.id}`);

    // 4. Seller creates a product
    console.log('4. Testing Product creation by seller...');
    const productPayload = {
      name: `Handcrafted Terracotta Vessel ${timestamp}`,
      category_id: testCategory.id,
      district_id: testDistrict.id,
      price: 1850,
      stock: 15,
      description: 'Traditional wood-fired terracotta vessel shaped on a potters wheel.',
      odop_product_name: `Terracotta Pottery ${timestamp}`,
      images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61'],
    };
    const prodRes = await client.post('/products', productPayload, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const createdProduct = prodRes.data.data;
    console.log(`✓ Product created with ID: ${createdProduct.id}`);

    // 5. Public Product Discovery & Filtering
    console.log('5. Testing Public Catalog Search & District Filtering...');
    const catalogRes = await client.get('/products', {
      params: {
        search: 'Terracotta',
        district: testDistrict.slug || testDistrict.name,
        min_price: 1000,
        max_price: 2500,
        sort_by: 'price',
        sort_order: 'desc',
      },
    });
    const catalogItems = catalogRes.data.data.products || catalogRes.data.data;
    if (!catalogItems.some(p => p.id === createdProduct.id)) {
      throw new Error('Created product not found in filtered catalog');
    }
    console.log(`✓ Product successfully retrieved via filtered discovery search!`);

    // 6. Buyer Cart Management
    console.log('6. Testing Cart addition & retrieval by buyer...');
    await client.post('/cart/items', { product_id: createdProduct.id, quantity: 2 }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const cartRes = await client.get('/cart', {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const cartItems = cartRes.data.data.items;
    if (!cartItems.some(i => i.product_id === createdProduct.id)) {
      throw new Error('Item missing from cart');
    }
    console.log(`✓ Cart contains ${cartItems.length} items. Total: ₹${cartRes.data.data.subtotal}`);

    // 7. Buyer Orders creation
    console.log('7. Testing Order creation from Cart...');
    const orderPayload = {
      delivery_name: 'Craft Collector',
      delivery_phone: '9876543211',
      delivery_address: '42 Heritage Boulevard, Suite 5',
      delivery_city: 'Lucknow',
      delivery_district: testDistrict.name,
      delivery_state: 'Uttar Pradesh',
      delivery_pincode: '226001',
    };
    const orderRes = await client.post('/orders', orderPayload, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const createdOrder = orderRes.data.data;
    console.log(`✓ Order created with ID: ${createdOrder.id}, status: ${createdOrder.status}`);

    // 8. Payment Initiation
    console.log('8. Testing Razorpay Payment Initiation...');
    const payOrderRes = await client.post('/payments/create-order', {
      order_id: createdOrder.id,
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    const rzpOrder = payOrderRes.data.data;
    console.log(`✓ Razorpay order initialized: ${rzpOrder.razorpay_order_id}`);

    // 9. Seller fulfillment transition to delivered
    console.log('9. Testing Seller fulfillment updates (confirmed -> processing -> shipped -> delivered)...');
    await client.patch(`/seller/orders/${createdOrder.id}/status`, { order_status: 'confirmed' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    await client.patch(`/seller/orders/${createdOrder.id}/status`, { order_status: 'processing' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    await client.patch(`/seller/orders/${createdOrder.id}/status`, { order_status: 'shipped' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    await client.patch(`/seller/orders/${createdOrder.id}/status`, { order_status: 'delivered' }, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    console.log('✓ Order status successfully transitioned to "delivered"');

    // 10. Buyer Review Submission for delivered product
    console.log('10. Testing Verified Buyer Review submission for delivered product...');
    const reviewRes = await client.post(`/products/${createdProduct.id}/reviews`, {
      order_id: createdOrder.id,
      rating: 5,
      comment: 'Exquisite authentic terracotta craft! Genuine craftsmanship from the registered ODOP district.',
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    console.log(`✓ Verified review posted: ${reviewRes.data.data.id}`);

    // 11. Public Reviews retrieval
    console.log('11. Testing Public Product Reviews retrieval and summary stats...');
    const publicReviews = await client.get(`/products/${createdProduct.id}/reviews`);
    const reviewsList = publicReviews.data.data.reviews;
    const summary = publicReviews.data.data.summary || publicReviews.data.data.meta;
    if (reviewsList.length === 0 || summary?.average_rating !== 5) {
      throw new Error(`Review stats not properly updated: ${JSON.stringify(summary)}`);
    }
    console.log(`✓ Public review verified: ${reviewsList.length} reviews, Average rating: ${summary.average_rating}/5`);

    console.log('\n======================================================');
    console.log('🎉 PHASE 10 FULL INTEGRATION TESTS: ALL PASSED (11/11)');
    console.log('======================================================');
  } catch (error) {
    console.error('❌ Phase 10 test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPhase10Tests();
