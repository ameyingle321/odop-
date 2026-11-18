/**
 * ODOP Nexus — Phase 4: Seller System & Product Management Integration Tests
 *
 * Verifies Acceptance Criteria & Business Invariants:
 *   1. Seller profile retrieval (GET /api/seller/profile)
 *   2. Seller profile update (PUT /api/seller/profile)
 *   3. Seller dashboard overview (GET /api/seller/dashboard)
 *   4. Product creation with matching district (POST /api/products) -> 201 Created
 *   5. INVARIANT: Product creation with mismatched district -> 400 Bad Request
 *   6. RBAC: Non-seller (buyer) attempting product creation -> 403 Forbidden
 *   7. View product details (GET /api/products/:id) -> 200 OK
 *   8. Product edit by owning seller (PUT /api/products/:id) -> 200 OK
 *   9. OWNERSHIP: Product edit by different seller -> 403 Forbidden
 *  10. OWNERSHIP: Product deletion by different seller -> 403 Forbidden
 *  11. Seller product listing (GET /api/seller/products) -> Paginated list
 *  12. Dashboard reflects updated metrics
 *  13. Product deletion by owning seller (DELETE /api/products/:id) -> 200 OK
 *  14. Automated cleanup of test data
 *
 * Usage: node tests/seller.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('ODOP Nexus — Phase 4 Seller System Integration Tests');
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

  // Setup: Fetch districts & categories from database
  const { data: districts } = await supabaseAdmin
    .from('districts')
    .select('id, name')
    .order('name');

  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .order('name');

  if (!districts || districts.length < 2) {
    console.error('❌ Need at least 2 districts in database to test district mismatch');
    process.exit(1);
  }
  if (!categories || categories.length === 0) {
    console.error('❌ Need categories in database');
    process.exit(1);
  }

  const district1 = districts[0]; // e.g. Agra or Aurangabad
  const district2 = districts[1]; // different district
  const category = categories[0];

  console.log(`Reference data loaded: District1=${district1.name}, District2=${district2.name}, Category=${category.name}`);

  const timestamp = Date.now();
  let seller1Token = null;
  let seller1UserId = null;
  let seller2Token = null;
  let seller2UserId = null;
  let buyerToken = null;
  let buyerUserId = null;
  let createdProductId = null;

  try {
    // --- 1. Register Seller 1 (District 1) ---
    console.log('\n--- 1. Register & Authenticate Seller 1 ---');
    const seller1Email = `seller1.${timestamp}@gmail.com`;
    const reg1Res = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Seller One',
        email: seller1Email,
        password: 'Password123!',
        phone: '9876543201',
        business_name: 'Artisan Works 1',
        address: '10 Industrial Area',
        district_id: district1.id,
        state: 'State1',
      }),
    });
    const reg1Data = await reg1Res.json();
    assert(reg1Res.status === 201, 'Seller 1 registered successfully');
    seller1UserId = reg1Data.data.user.id;
    seller1Token = reg1Data.data.session.access_token;

    // --- 2. Register Seller 2 (District 2) for ownership & isolation tests ---
    console.log('\n--- 2. Register & Authenticate Seller 2 ---');
    const seller2Email = `seller2.${timestamp}@gmail.com`;
    const reg2Res = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Seller Two',
        email: seller2Email,
        password: 'Password123!',
        phone: '9876543202',
        business_name: 'Artisan Works 2',
        address: '20 Market Street',
        district_id: district2.id,
        state: 'State2',
      }),
    });
    const reg2Data = await reg2Res.json();
    assert(reg2Res.status === 201, 'Seller 2 registered successfully');
    seller2UserId = reg2Data.data.user.id;
    seller2Token = reg2Data.data.session.access_token;

    // --- 3. Register Buyer for role authorization tests ---
    console.log('\n--- 3. Register Buyer for RBAC testing ---');
    const buyerEmail = `buyer.${timestamp}@gmail.com`;
    const regBuyerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regular Buyer',
        email: buyerEmail,
        password: 'Password123!',
      }),
    });
    const regBuyerData = await regBuyerRes.json();
    assert(regBuyerRes.status === 201, 'Buyer registered successfully');
    buyerUserId = regBuyerData.data.user.id;
    buyerToken = regBuyerData.data.session.access_token;

    // --- 4. Seller 1 Profile Retrieval & Update ---
    console.log('\n--- 4. Seller Profile Management ---');
    const profRes = await fetch(`${BASE_URL}/seller/profile`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` },
    });
    const profData = await profRes.json();
    assert(profRes.status === 200, 'GET /seller/profile returns 200 OK');
    assert(profData.data.business_name === 'Artisan Works 1', 'Profile has correct business_name');
    assert(profData.data.district_id === district1.id, 'Profile has registered district_id');

    const updateRes = await fetch(`${BASE_URL}/seller/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        business_name: 'Artisan Works 1 (Updated)',
        address: '99 New Craft Road',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'PUT /seller/profile returns 200 OK');
    assert(updateData.data.business_name === 'Artisan Works 1 (Updated)', 'Updated business_name saved');

    // --- 5. Seller 1 Dashboard Initial State ---
    console.log('\n--- 5. Seller Dashboard Initial State ---');
    const dashRes = await fetch(`${BASE_URL}/seller/dashboard`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` },
    });
    const dashData = await dashRes.json();
    assert(dashRes.status === 200, 'GET /seller/dashboard returns 200 OK');
    assert(dashData.data.metrics.total_products === 0, 'Initial total_products is 0');

    // --- 6. CRITICAL INVARIANT: District Mismatch Rejected ---
    console.log('\n--- 6. CRITICAL INVARIANT: District Mismatch Rejected ---');
    // Seller 1 is in district1. Try creating product in district2.
    const mismatchRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        name: 'Mismatched District Product',
        price: 499.00,
        stock: 10,
        category_id: category.id,
        district_id: district2.id, // WRONG DISTRICT!
      }),
    });
    const mismatchData = await mismatchRes.json();
    assert(mismatchRes.status === 400, 'Rejects mismatched product district with 400 Bad Request');
    assert(mismatchData.success === false, 'success is false');
    assert(
      mismatchData.message.includes('District mismatch'),
      'Clear error: Product district must match seller registered district',
    );

    // --- 7. RBAC: Non-seller (Buyer) Cannot Create Products ---
    console.log('\n--- 7. RBAC: Buyer Cannot Create Products ---');
    const buyerCreateRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`, // Buyer token!
      },
      body: JSON.stringify({
        name: 'Unauthorized Product',
        price: 299.00,
        category_id: category.id,
      }),
    });
    assert(buyerCreateRes.status === 403, 'Buyer receives 403 Forbidden on product creation');

    // --- 8. Valid Product Creation (Matching District) ---
    console.log('\n--- 8. Valid Product Creation (Seller 1) ---');
    const validCreateRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        name: 'Handcrafted Heritage Item',
        description: 'Authentic ODOP handcrafted specialty',
        price: 1250.00,
        stock: 25,
        category_id: category.id,
        district_id: district1.id, // Explicitly matching district
        odop_product_name: 'Traditional ODOP Craft',
        images: [
          'https://example.com/craft-1.jpg',
          'https://example.com/craft-2.jpg',
        ],
      }),
    });
    const validCreateData = await validCreateRes.json();
    assert(validCreateRes.status === 201, 'Valid product returns 201 Created');
    assert(validCreateData.success === true, 'Response success is true');
    assert(validCreateData.data.district_id === district1.id, 'Product district equals seller district');
    assert(validCreateData.data.images.length === 2, 'Attached 2 product images');
    assert(validCreateData.data.slug.includes('handcrafted-heritage-item'), 'Generated slug from product name');
    createdProductId = validCreateData.data.id;

    // --- 9. View Product Details (Public) ---
    console.log('\n--- 9. View Product Details ---');
    const viewRes = await fetch(`${BASE_URL}/products/${createdProductId}`);
    const viewData = await viewRes.json();
    assert(viewRes.status === 200, 'GET /products/:id returns 200 OK');
    assert(viewData.data.id === createdProductId, 'Product ID matches');
    assert(viewData.data.districts.name === district1.name, 'Includes joined district details');
    assert(viewData.data.categories.name === category.name, 'Includes joined category details');
    assert(viewData.data.product_images.length === 2, 'Includes product images');

    // --- 10. Update Product by Owning Seller ---
    console.log('\n--- 10. Update Product by Owning Seller ---');
    const updateProdRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller1Token}`,
      },
      body: JSON.stringify({
        price: 1399.00,
        stock: 30,
        description: 'Updated premium description',
      }),
    });
    const updateProdData = await updateProdRes.json();
    assert(updateProdRes.status === 200, 'Owning seller can update product (200 OK)');
    assert(Number(updateProdData.data.price) === 1399.00, 'Updated price saved');
    assert(updateProdData.data.stock === 30, 'Updated stock saved');

    // --- 11. CRITICAL: Ownership Protection (Seller 2 Cannot Edit Seller 1 Product) ---
    console.log('\n--- 11. OWNERSHIP: Different Seller Cannot Edit Product ---');
    const unauthorizedEditRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seller2Token}`, // Seller 2 token!
      },
      body: JSON.stringify({
        price: 99.00,
      }),
    });
    assert(unauthorizedEditRes.status === 403, 'Seller 2 receives 403 Forbidden when updating Seller 1 product');

    // --- 12. CRITICAL: Ownership Protection (Seller 2 Cannot Delete Seller 1 Product) ---
    console.log('\n--- 12. OWNERSHIP: Different Seller Cannot Delete Product ---');
    const unauthorizedDeleteRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${seller2Token}`, // Seller 2 token!
      },
    });
    assert(unauthorizedDeleteRes.status === 403, 'Seller 2 receives 403 Forbidden when deleting Seller 1 product');

    // --- 13. Seller Products List ---
    console.log('\n--- 13. Seller Products Listing ---');
    const listRes = await fetch(`${BASE_URL}/seller/products?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /seller/products returns 200 OK');
    assert(listData.data.products.length === 1, 'Seller 1 sees exactly 1 product');
    assert(listData.data.total === 1, 'Total count is 1');

    // Seller 2 should see 0 products
    const list2Res = await fetch(`${BASE_URL}/seller/products?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${seller2Token}` },
    });
    const list2Data = await list2Res.json();
    assert(list2Data.data.products.length === 0, 'Seller 2 sees 0 products (strict isolation)');

    // --- 14. Dashboard Metrics Updated ---
    console.log('\n--- 14. Dashboard Metrics Updated ---');
    const dashUpdatedRes = await fetch(`${BASE_URL}/seller/dashboard`, {
      headers: { 'Authorization': `Bearer ${seller1Token}` },
    });
    const dashUpdatedData = await dashUpdatedRes.json();
    assert(dashUpdatedData.data.metrics.total_products === 1, 'Dashboard reflects total_products = 1');
    assert(dashUpdatedData.data.metrics.active_products === 1, 'Dashboard reflects active_products = 1');
    assert(dashUpdatedData.data.recent_products.length === 1, 'Dashboard includes created product');

    // --- 15. Delete Product by Owning Seller ---
    console.log('\n--- 15. Delete Product by Owning Seller ---');
    const deleteRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${seller1Token}` },
    });
    assert(deleteRes.status === 200, 'Owning seller deletes product (200 OK)');

    const verifyDeletedRes = await fetch(`${BASE_URL}/products/${createdProductId}`);
    assert(verifyDeletedRes.status === 404, 'Deleted product is no longer accessible (404 Not Found)');
    createdProductId = null; // Mark cleaned up

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // --- Cleanup ---
    console.log('\n--- Cleanup Test Users & Data ---');
    try {
      if (createdProductId) {
        await supabaseAdmin.from('product_images').delete().eq('product_id', createdProductId);
        await supabaseAdmin.from('products').delete().eq('id', createdProductId);
      }
      if (seller1UserId) {
        await supabaseAdmin.from('seller_profiles').delete().eq('user_id', seller1UserId);
        await supabaseAdmin.from('profiles').delete().eq('id', seller1UserId);
        await supabaseAdmin.auth.admin.deleteUser(seller1UserId);
        console.log('  🧹 Cleaned up Seller 1');
      }
      if (seller2UserId) {
        await supabaseAdmin.from('seller_profiles').delete().eq('user_id', seller2UserId);
        await supabaseAdmin.from('profiles').delete().eq('id', seller2UserId);
        await supabaseAdmin.auth.admin.deleteUser(seller2UserId);
        console.log('  🧹 Cleaned up Seller 2');
      }
      if (buyerUserId) {
        await supabaseAdmin.from('profiles').delete().eq('id', buyerUserId);
        await supabaseAdmin.auth.admin.deleteUser(buyerUserId);
        console.log('  🧹 Cleaned up Buyer');
      }
    } catch (cleanupErr) {
      console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
    }
  }

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal crash in tests:', err);
  process.exit(1);
});
