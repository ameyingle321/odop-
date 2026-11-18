/**
 * ODOP Nexus — Phase 5: Buyer & Product Discovery Integration Tests
 *
 * Verifies Acceptance Criteria & User Journeys:
 *   1. District reference listing (GET /api/districts)
 *   2. District state filtering & search
 *   3. District detail retrieval by slug and by UUID (GET /api/districts/:idOrSlug)
 *   4. Category reference listing (GET /api/categories)
 *   5. Category detail retrieval by slug and by UUID (GET /api/categories/:idOrSlug)
 *   6. Product-First Discovery: Search without knowing district -> returns product + district + seller
 *   7. CRITICAL VISIBILITY RULE: Excludes non-active products (draft / inactive never returned)
 *   8. Filter products by category (by slug and by UUID)
 *   9. Filter products by district (by slug and by UUID)
 *  10. Filter products by price range (min_price, max_price)
 *  11. Filter products by availability (in_stock=true)
 *  12. Sorting (price asc/desc, created_at desc)
 *  13. Catalog pagination (page, limit, total_pages)
 *  14. Automated test data cleanup
 *
 * Usage: node tests/discovery.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('ODOP Nexus — Phase 5 Discovery Integration Tests');
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

  // --- 1. District Reference Listing ---
  console.log('--- 1. District Reference Discovery ---');
  let puneDistrict = null;
  let varanasiDistrict = null;
  try {
    const res = await fetch(`${BASE_URL}/districts`);
    const data = await res.json();
    assert(res.status === 200, 'GET /districts returns 200 OK');
    assert(data.data.districts.length >= 25, `Loaded all seeded districts (got ${data.data.districts.length})`);
    assert(data.data.total >= 25, 'Total count matches district catalog');

    puneDistrict = data.data.districts.find(d => d.slug === 'pune');
    varanasiDistrict = data.data.districts.find(d => d.slug === 'varanasi');
    assert(puneDistrict !== undefined, 'Found Pune district');
    assert(varanasiDistrict !== undefined, 'Found Varanasi district');
  } catch (err) {
    assert(false, 'Districts listing failed', err.message);
  }

  // --- 2. District State Filtering & Search ---
  console.log('\n--- 2. District State Filter & Search ---');
  try {
    const stateRes = await fetch(`${BASE_URL}/districts?state=Maharashtra`);
    const stateData = await stateRes.json();
    assert(stateRes.status === 200, 'Filter districts by state returns 200 OK');
    assert(
      stateData.data.districts.every(d => d.state === 'Maharashtra'),
      'All returned districts are in Maharashtra',
    );

    const searchRes = await fetch(`${BASE_URL}/districts?search=Varanasi`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Search districts returns 200 OK');
    assert(searchData.data.districts.some(d => d.name === 'Varanasi'), 'Found Varanasi by search keyword');
  } catch (err) {
    assert(false, 'District filter/search failed', err.message);
  }

  // --- 3. District Details Retrieval (Slug & UUID) ---
  console.log('\n--- 3. District Details Retrieval ---');
  try {
    const slugRes = await fetch(`${BASE_URL}/districts/pune`);
    const slugData = await slugRes.json();
    assert(slugRes.status === 200, 'GET /districts/pune returns 200 OK');
    assert(slugData.data.name === 'Pune', 'Resolved Pune district by slug');
    assert(slugData.data.odop_product_name === 'Puneri Pagdi', 'Includes district ODOP specialty');
    assert(slugData.data.active_products_count !== undefined, 'Includes active_products_count');

    const uuidRes = await fetch(`${BASE_URL}/districts/${puneDistrict.id}`);
    const uuidData = await uuidRes.json();
    assert(uuidRes.status === 200, 'GET /districts/:uuid returns 200 OK');
    assert(uuidData.data.id === puneDistrict.id, 'Resolved Pune district by UUID');

    const notFoundRes = await fetch(`${BASE_URL}/districts/non-existent-district-slug`);
    assert(notFoundRes.status === 404, 'Non-existent district slug returns 404 Not Found');
  } catch (err) {
    assert(false, 'District details test failed', err.message);
  }

  // --- 4. Category Reference Listing ---
  console.log('\n--- 4. Category Reference Discovery ---');
  let textilesCategory = null;
  let metalworkCategory = null;
  try {
    const res = await fetch(`${BASE_URL}/categories`);
    const data = await res.json();
    assert(res.status === 200, 'GET /categories returns 200 OK');
    assert(data.data.categories.length >= 11, `Loaded all seeded categories (got ${data.data.categories.length})`);

    textilesCategory = data.data.categories.find(c => c.slug === 'textiles');
    metalworkCategory = data.data.categories.find(c => c.slug === 'metalwork');
    assert(textilesCategory !== undefined, 'Found Textiles category');
    assert(metalworkCategory !== undefined, 'Found Metalwork category');
  } catch (err) {
    assert(false, 'Categories listing failed', err.message);
  }

  // --- 5. Category Details Retrieval (Slug & UUID) ---
  console.log('\n--- 5. Category Details Retrieval ---');
  try {
    const slugRes = await fetch(`${BASE_URL}/categories/textiles`);
    const slugData = await slugRes.json();
    assert(slugRes.status === 200, 'GET /categories/textiles returns 200 OK');
    assert(slugData.data.name === 'Textiles', 'Resolved Textiles category by slug');
    assert(slugData.data.active_products_count !== undefined, 'Includes active_products_count');

    const uuidRes = await fetch(`${BASE_URL}/categories/${textilesCategory.id}`);
    const uuidData = await uuidRes.json();
    assert(uuidRes.status === 200, 'GET /categories/:uuid returns 200 OK');
    assert(uuidData.data.id === textilesCategory.id, 'Resolved Textiles category by UUID');

    const notFoundRes = await fetch(`${BASE_URL}/categories/non-existent-category`);
    assert(notFoundRes.status === 404, 'Non-existent category slug returns 404 Not Found');
  } catch (err) {
    assert(false, 'Category details test failed', err.message);
  }

  // --- Setup Test Products for Search & Discovery ---
  console.log('\n--- Setup Test Products for Discovery ---');
  const timestamp = Date.now();
  let sellerUserId = null;
  let sellerToken = null;
  let sellerId = null;
  const createdProductIds = [];

  try {
    // Register test seller in Pune
    const sellerEmail = `pune.artisan.${timestamp}@gmail.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pune Master Artisan',
        email: sellerEmail,
        password: 'Password123!',
        phone: '9876543299',
        business_name: 'Pune Heritage Crafts Emporium',
        address: '50 Shaniwar Peth',
        district_id: puneDistrict.id,
        state: 'Maharashtra',
      }),
    });
    const regData = await regRes.json();
    sellerUserId = regData.data.user.id;
    sellerToken = regData.data.session.access_token;
    sellerId = regData.data.user.seller_profile_id;

    // Helper to create product
    async function createTestProduct(payload) {
      const pRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sellerToken}`,
        },
        body: JSON.stringify(payload),
      });
      const pData = await pRes.json();
      createdProductIds.push(pData.data.id);
      return pData.data;
    }

    // 1. Active Product: "Authentic Puneri Royal Pagdi" (Price: 850, Stock: 20, Textiles)
    const prod1 = await createTestProduct({
      name: `Puneri Royal Pagdi Special ${timestamp}`,
      description: 'Handcrafted traditional Maharashtrian headdress',
      price: 850.00,
      stock: 20,
      category_id: textilesCategory.id,
      district_id: puneDistrict.id,
      odop_product_name: 'Puneri Pagdi',
      status: 'active',
      images: ['https://example.com/puneri-pagdi.jpg'],
    });

    // 2. Active Product: "Puneri Handmade Brass Samai" (Price: 1650, Stock: 0 [Out of stock], Metalwork)
    const prod2 = await createTestProduct({
      name: `Puneri Brass Samai Lamp ${timestamp}`,
      description: 'Traditional metal lamp crafted in Pune',
      price: 1650.00,
      stock: 0, // OUT OF STOCK
      category_id: metalworkCategory.id,
      district_id: puneDistrict.id,
      status: 'active',
    });

    // 3. Draft Product: (Must NOT be publicly visible)
    const prod3 = await createTestProduct({
      name: `Puneri Draft Prototype ${timestamp}`,
      description: 'Internal workshop prototype',
      price: 2500.00,
      stock: 5,
      category_id: textilesCategory.id,
      district_id: puneDistrict.id,
      status: 'draft',
    });

    // 4. Inactive Product: (Must NOT be publicly visible)
    const prod4 = await createTestProduct({
      name: `Puneri Archived Weave ${timestamp}`,
      description: 'Discontinued craft',
      price: 400.00,
      stock: 10,
      category_id: textilesCategory.id,
      district_id: puneDistrict.id,
      status: 'inactive',
    });

    console.log(`Created 4 test products (2 active, 1 draft, 1 inactive)`);

    // --- 6. Product-First Discovery: Search Without Knowing District ---
    console.log('\n--- 6. Product-First Discovery (Unknown District) ---');
    const searchRes = await fetch(`${BASE_URL}/products?search=${timestamp}`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, 'Search endpoint returns 200 OK');

    const foundProd1 = searchData.data.products.find(p => p.id === prod1.id);
    assert(foundProd1 !== undefined, 'Found product by search keyword without knowing district');
    assert(foundProd1.districts !== null, 'Exposes associated district in search result');
    assert(foundProd1.districts.name === 'Pune', 'Reveals district name is Pune');
    assert(foundProd1.districts.odop_product_name === 'Puneri Pagdi', 'Reveals ODOP product specialty');
    assert(foundProd1.seller_profiles.business_name === 'Pune Heritage Crafts Emporium', 'Exposes seller business name');

    // --- 7. CRITICAL VISIBILITY ACCEPTANCE CRITERION ---
    console.log('\n--- 7. CRITICAL VISIBILITY RULE: Non-Active Products Excluded ---');
    const allFoundIds = searchData.data.products.map(p => p.id);
    assert(allFoundIds.includes(prod1.id), 'Active product 1 is included');
    assert(allFoundIds.includes(prod2.id), 'Active product 2 is included');
    assert(!allFoundIds.includes(prod3.id), 'DRAFT product is NOT exposed in public search');
    assert(!allFoundIds.includes(prod4.id), 'INACTIVE product is NOT exposed in public search');

    // --- 8. Filter by Category (Slug & UUID) ---
    console.log('\n--- 8. Category Filter ---');
    const catSlugRes = await fetch(`${BASE_URL}/products?search=${timestamp}&category=textiles`);
    const catSlugData = await catSlugRes.json();
    assert(catSlugRes.status === 200, 'Category slug filter returns 200 OK');
    assert(catSlugData.data.products.some(p => p.id === prod1.id), 'Returns Textiles product');
    assert(!catSlugData.data.products.some(p => p.id === prod2.id), 'Excludes Metalwork product');

    const catIdRes = await fetch(`${BASE_URL}/products?search=${timestamp}&category_id=${metalworkCategory.id}`);
    const catIdData = await catIdRes.json();
    assert(catIdRes.status === 200, 'Category UUID filter returns 200 OK');
    assert(catIdData.data.products.some(p => p.id === prod2.id), 'Returns Metalwork product');
    assert(!catIdData.data.products.some(p => p.id === prod1.id), 'Excludes Textiles product');

    // --- 9. Filter by District (Slug & UUID) ---
    console.log('\n--- 9. District Filter ---');
    const distSlugRes = await fetch(`${BASE_URL}/products?search=${timestamp}&district=pune`);
    const distSlugData = await distSlugRes.json();
    assert(distSlugRes.status === 200, 'District slug filter returns 200 OK');
    assert(distSlugData.data.products.some(p => p.id === prod1.id), 'Returns Pune product');

    const wrongDistRes = await fetch(`${BASE_URL}/products?search=${timestamp}&district=varanasi`);
    const wrongDistData = await wrongDistRes.json();
    assert(wrongDistData.data.products.length === 0, 'Varanasi district filter excludes Pune products');

    // --- 10. Filter by Price Range ---
    console.log('\n--- 10. Price Range Filter ---');
    // Prod1 is 850, Prod2 is 1650
    const priceRes = await fetch(`${BASE_URL}/products?search=${timestamp}&min_price=1000&max_price=2000`);
    const priceData = await priceRes.json();
    assert(priceRes.status === 200, 'Price range filter returns 200 OK');
    assert(priceData.data.products.some(p => p.id === prod2.id), 'Includes 1650.00 product');
    assert(!priceData.data.products.some(p => p.id === prod1.id), 'Excludes 850.00 product');

    // --- 11. Filter by Availability (in_stock=true) ---
    console.log('\n--- 11. Availability Filter (in_stock=true) ---');
    // Prod1 stock = 20, Prod2 stock = 0
    const stockRes = await fetch(`${BASE_URL}/products?search=${timestamp}&in_stock=true`);
    const stockData = await stockRes.json();
    assert(stockRes.status === 200, 'In-stock filter returns 200 OK');
    assert(stockData.data.products.some(p => p.id === prod1.id), 'Includes available product (stock 20)');
    assert(!stockData.data.products.some(p => p.id === prod2.id), 'Excludes out of stock product (stock 0)');

    // --- 12. Sorting (Price Ascending & Descending) ---
    console.log('\n--- 12. Sorting ---');
    const ascRes = await fetch(`${BASE_URL}/products?search=${timestamp}&sort_by=price&sort_order=asc`);
    const ascData = await ascRes.json();
    assert(ascRes.status === 200, 'Sort price asc returns 200 OK');
    const ascIds = ascData.data.products.map(p => p.id);
    const prod1IdxAsc = ascIds.indexOf(prod1.id);
    const prod2IdxAsc = ascIds.indexOf(prod2.id);
    assert(prod1IdxAsc < prod2IdxAsc, 'Prod1 (850) appears before Prod2 (1650) in ascending order');

    const descRes = await fetch(`${BASE_URL}/products?search=${timestamp}&sort_by=price&sort_order=desc`);
    const descData = await descRes.json();
    const descIds = descData.data.products.map(p => p.id);
    const prod1IdxDesc = descIds.indexOf(prod1.id);
    const prod2IdxDesc = descIds.indexOf(prod2.id);
    assert(prod2IdxDesc < prod1IdxDesc, 'Prod2 (1650) appears before Prod1 (850) in descending order');

    // --- 13. Pagination ---
    console.log('\n--- 13. Pagination ---');
    const pageRes = await fetch(`${BASE_URL}/products?search=${timestamp}&page=1&limit=1`);
    const pageData = await pageRes.json();
    assert(pageRes.status === 200, 'Pagination returns 200 OK');
    assert(pageData.data.products.length === 1, 'Returns exactly 1 product per page');
    assert(pageData.data.total === 2, 'Total active products count is 2');
    assert(pageData.data.total_pages === 2, 'Total pages is 2');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // --- 14. Cleanup ---
    console.log('\n--- 14. Cleanup Test Data ---');
    try {
      for (const pId of createdProductIds) {
        await supabaseAdmin.from('product_images').delete().eq('product_id', pId);
        await supabaseAdmin.from('products').delete().eq('id', pId);
      }
      console.log(`  🧹 Cleaned up ${createdProductIds.length} test products`);

      if (sellerUserId) {
        await supabaseAdmin.from('seller_profiles').delete().eq('user_id', sellerUserId);
        await supabaseAdmin.from('profiles').delete().eq('id', sellerUserId);
        await supabaseAdmin.auth.admin.deleteUser(sellerUserId);
        console.log('  🧹 Cleaned up test seller');
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
