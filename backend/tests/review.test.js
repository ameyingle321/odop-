/**
 * ODOP Nexus — Phase 8: Reviews & Ratings Tests
 *
 * Verifies Acceptance Criteria & Business Invariants:
 *   1. CRITICAL ELIGIBILITY (TRD §17):
 *      - Unauthenticated review submission rejected (401 Unauthorized)
 *      - Review on non-delivered order (pending_payment / confirmed / shipped) rejected (400 Bad Request)
 *      - Review on product not in order rejected (400 Bad Request)
 *      - Review on another buyer's delivered order rejected (404 Not Found)
 *   2. Valid Review Creation:
 *      - Buyer submits review for delivered product (201 Created)
 *      - Correctly associated with order, product, and buyer profile
 *   3. INVARIANT: Duplicate Review Prevention:
 *      - Attempting duplicate review for same order & product rejected (409 Conflict)
 *   4. Rating Validation:
 *      - Rating < 1 rejected (422 Unprocessable Entity)
 *      - Rating > 5 rejected (422 Unprocessable Entity)
 *      - Non-integer rating rejected (422 Unprocessable Entity)
 *   5. Public Review Discovery & Aggregation:
 *      - Public GET /api/products/:productId/reviews returns 200 OK
 *      - Includes buyer name snapshot
 *      - Accurately calculates average_rating, total_reviews, and rating_breakdown
 *      - Rating query filter (?rating=5)
 *   6. Buyer Review Management & Deletion:
 *      - GET /api/reviews/my returns buyer's reviews
 *      - Unauthorized buyer cannot delete another buyer's review (403 Forbidden)
 *      - Owning buyer deletes review (200 OK)
 *
 * Usage: node tests/review.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';
import { ORDER_STATUS } from '../src/constants/index.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('ODOP Nexus — Phase 8 Reviews & Ratings Integration Tests');
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
  let sellerToken = null;
  let sellerUserId = null;

  let buyer1Token = null;
  let buyer1UserId = null;

  let buyer2Token = null;
  let buyer2UserId = null;

  let productA = null; // Included in order
  let productB = null; // NOT included in order
  let order1 = null;

  try {
    // ------------------------------------------------------------------
    // Setup Reference Data & Test Users
    // ------------------------------------------------------------------
    const { data: district } = await supabaseAdmin.from('districts').select('id, name').limit(1).single();
    const { data: category } = await supabaseAdmin.from('categories').select('id').limit(1).single();

    // 1. Setup Seller
    const sEmail = `seller.rev.${timestamp}@gmail.com`;
    const sRegRes = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Artisan Review Test',
        email: sEmail,
        password: 'Password123!',
        phone: '9876543201',
        district_id: district.id,
        business_name: 'Artisan Crafts & Weaves',
        address: '44 Shilp Marg',
        state: 'Maharashtra',
      }),
    });
    const sData = await sRegRes.json();
    sellerUserId = sData.data.user.id;
    sellerToken = sData.data.session.access_token;

    // 2. Setup Buyer 1 & Buyer 2
    const b1Email = `buyer1.rev.${timestamp}@gmail.com`;
    const b1RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reviewer Buyer One',
        email: b1Email,
        password: 'Password123!',
      }),
    });
    const b1Data = await b1RegRes.json();
    buyer1UserId = b1Data.data.user.id;
    buyer1Token = b1Data.data.session.access_token;

    const b2Email = `buyer2.rev.${timestamp}@gmail.com`;
    const b2RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reviewer Buyer Two',
        email: b2Email,
        password: 'Password123!',
      }),
    });
    const b2Data = await b2RegRes.json();
    buyer2UserId = b2Data.data.user.id;
    buyer2Token = b2Data.data.session.access_token;

    // 3. Create Product A (purchased) & Product B (not purchased)
    const prodARes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Handmade Chanderi Saree ${timestamp}`,
        description: 'Traditional royal fabric',
        price: 2200.0,
        stock: 20,
        category_id: category.id,
        district_id: district.id,
        status: 'active',
      }),
    });
    productA = (await prodARes.json()).data;

    const prodBRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Wooden Lacquer Toy ${timestamp}`,
        description: 'Eco-friendly craft toy',
        price: 450.0,
        stock: 15,
        category_id: category.id,
        district_id: district.id,
        status: 'active',
      }),
    });
    productB = (await prodBRes.json()).data;

    // 4. Create Order with Product A for Buyer 1 (initial status: pending_payment)
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
      body: JSON.stringify({
        delivery_name: 'Reviewer Buyer One',
        delivery_phone: '+919876543210',
        delivery_address: 'Flat 4B, Residency Tower',
        delivery_city: 'Pune',
        delivery_district: 'Pune',
        delivery_state: 'Maharashtra',
        delivery_pincode: '411004',
        items: [{ product_id: productA.id, quantity: 1 }],
      }),
    });
    order1 = (await orderRes.json()).data;

    // ------------------------------------------------------------------
    // TEST 1: CRITICAL INVARIANT: Non-Delivered Order Rejected
    // ------------------------------------------------------------------
    console.log('--- 1. Eligibility Rule: Non-Delivered Order Rejected ---');
    {
      // 1. Unauthenticated attempt
      const unauthRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Great product!' }),
      });
      assert(unauthRes.status === 401, 'Unauthenticated review submission returns 401 Unauthorized');

      // 2. Order is in pending_payment -> review rejected
      const pendingRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Great product!' }),
      });
      assert(pendingRes.status === 400, 'Review submission for pending_payment order rejected (400 Bad Request)');

      // 3. Transition order to confirmed -> still rejected
      await supabaseAdmin.from('orders').update({ order_status: ORDER_STATUS.CONFIRMED }).eq('id', order1.id);
      const confRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Great product!' }),
      });
      assert(confRes.status === 400, 'Review submission for confirmed order rejected (400 Bad Request)');

      // 4. Transition order to shipped -> still rejected
      await supabaseAdmin.from('orders').update({ order_status: ORDER_STATUS.SHIPPED }).eq('id', order1.id);
      const shipRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Great product!' }),
      });
      assert(shipRes.status === 400, 'Review submission for shipped order rejected (400 Bad Request)');
    }

    // ------------------------------------------------------------------
    // TEST 2: Eligibility Rule: Product Not in Order & Non-Owning Buyer
    // ------------------------------------------------------------------
    console.log('\n--- 2. Eligibility Rule: Product Mismatch & Ownership Isolation ---');
    {
      // Transition order to DELIVERED
      await supabaseAdmin.from('orders').update({ order_status: ORDER_STATUS.DELIVERED }).eq('id', order1.id);

      // 1. Buyer 1 attempts to review Product B (which was NOT in order1)
      const unboughtProdRes = await fetch(`${BASE_URL}/products/${productB.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Did not buy this' }),
      });
      assert(unboughtProdRes.status === 400, 'Review on unpurchased product rejected (400 Bad Request)');

      // 2. Buyer 2 attempts to use Buyer 1's delivered order1 to review Product A
      const buyer2StealRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer2Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 5, comment: 'Not my order' }),
      });
      assert(buyer2StealRes.status === 404, 'Review on another buyer\'s delivered order returns 404 Not Found');
    }

    // ------------------------------------------------------------------
    // TEST 3: Rating Range & Schema Validation
    // ------------------------------------------------------------------
    console.log('\n--- 3. Rating Schema Validation (1 to 5 only) ---');
    {
      // Rating 0 (below min 1)
      const zeroRatingRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 0, comment: 'Zero stars' }),
      });
      assert(zeroRatingRes.status === 422, 'Rating 0 rejected with 422 Unprocessable Entity');

      // Rating 6 (above max 5)
      const sixRatingRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 6, comment: 'Six stars' }),
      });
      assert(sixRatingRes.status === 422, 'Rating 6 rejected with 422 Unprocessable Entity');

      // Non-integer rating 4.5
      const floatRatingRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order1.id, rating: 4.5, comment: 'Float rating' }),
      });
      assert(floatRatingRes.status === 422, 'Fractional rating 4.5 rejected with 422 Unprocessable Entity');
    }

    // ------------------------------------------------------------------
    // TEST 4: Valid Review Submission
    // ------------------------------------------------------------------
    console.log('\n--- 4. Valid Review Submission for Delivered Product ---');
    let createdReviewId = null;
    {
      const validReviewRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          order_id: order1.id,
          rating: 5,
          comment: 'Exquisite silk weaving, exceptional quality from Pune!',
        }),
      });
      const validReviewData = await validReviewRes.json();
      assert(validReviewRes.status === 201, 'Valid review returns 201 Created');
      assert(validReviewData.success === true, 'Response success is true');
      assert(validReviewData.data.rating === 5, 'Review rating recorded as 5');
      assert(validReviewData.data.product_id === productA.id, 'Linked to product A');
      assert(validReviewData.data.buyer_id === buyer1UserId, 'Linked to buyer 1');
      assert(validReviewData.data.order_id === order1.id, 'Linked to order 1');
      assert(validReviewData.data.profiles?.full_name === 'Reviewer Buyer One', 'Includes buyer full name profile');
      createdReviewId = validReviewData.data.id;
    }

    // ------------------------------------------------------------------
    // TEST 5: INVARIANT: Duplicate Review Prevention (Unique Constraint)
    // ------------------------------------------------------------------
    console.log('\n--- 5. Invariant: Duplicate Review Prevented ---');
    {
      const duplicateRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          order_id: order1.id,
          rating: 4,
          comment: 'Submitting a second review for same order',
        }),
      });
      assert(duplicateRes.status === 409, 'Duplicate review rejected with 409 Conflict');
    }

    // ------------------------------------------------------------------
    // TEST 6: Public Reviews & Aggregates Discovery
    // ------------------------------------------------------------------
    console.log('\n--- 6. Public Reviews & Ratings Aggregates Discovery ---');
    {
      const getReviewsRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`);
      const getReviewsData = await getReviewsRes.json();
      assert(getReviewsRes.status === 200, 'Public GET /products/:id/reviews returns 200 OK');
      assert(Array.isArray(getReviewsData.data.reviews), 'Returns array of reviews');
      assert(getReviewsData.data.reviews.length === 1, 'Contains exactly 1 review');
      assert(getReviewsData.data.summary.total_reviews === 1, 'total_reviews is 1');
      assert(getReviewsData.data.summary.average_rating === 5, 'average_rating is 5.0');
      assert(getReviewsData.data.summary.rating_breakdown[5] === 1, 'rating_breakdown has 1 five-star review');
      assert(getReviewsData.data.summary.rating_breakdown[1] === 0, 'rating_breakdown has 0 one-star reviews');

      // Filter by rating = 5
      const filter5Res = await fetch(`${BASE_URL}/products/${productA.id}/reviews?rating=5`);
      const filter5Data = await filter5Res.json();
      assert(filter5Data.data.reviews.length === 1, 'Filter ?rating=5 returns matching review');

      // Filter by rating = 1
      const filter1Res = await fetch(`${BASE_URL}/products/${productA.id}/reviews?rating=1`);
      const filter1Data = await filter1Res.json();
      assert(filter1Data.data.reviews.length === 0, 'Filter ?rating=1 returns 0 reviews');
    }

    // ------------------------------------------------------------------
    // TEST 7: Buyer Reviews Management & Deletion
    // ------------------------------------------------------------------
    console.log('\n--- 7. Buyer Reviews Management & Ownership Isolation ---');
    {
      // Buyer 1 views their reviews
      const b1ReviewsRes = await fetch(`${BASE_URL}/reviews/my`, {
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const b1ReviewsData = await b1ReviewsRes.json();
      assert(b1ReviewsRes.status === 200, 'GET /reviews/my returns 200 OK');
      assert(b1ReviewsData.data.length === 1, 'Buyer 1 sees their 1 submitted review');
      assert(b1ReviewsData.data[0].id === createdReviewId, 'Review ID matches');

      // Buyer 2 tries to delete Buyer 1's review
      const b2DeleteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyer2Token}` },
      });
      assert(b2DeleteRes.status === 403, 'Buyer 2 deleting Buyer 1 review returns 403 Forbidden');

      // Buyer 1 deletes own review
      const b1DeleteRes = await fetch(`${BASE_URL}/reviews/${createdReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      assert(b1DeleteRes.status === 200, 'Buyer 1 deletes own review (200 OK)');

      // Verify product aggregate is now 0 reviews
      const postDeleteRes = await fetch(`${BASE_URL}/products/${productA.id}/reviews`);
      const postDeleteData = await postDeleteRes.json();
      assert(postDeleteData.data.reviews.length === 0, 'Product reviews list is empty after deletion');
      assert(postDeleteData.data.summary.total_reviews === 0, 'Product total_reviews updated to 0');
    }

    // ------------------------------------------------------------------
    // Cleanup Test Users & Data
    // ------------------------------------------------------------------
    console.log('\n--- Cleanup Test Users & Data ---');
    if (order1?.id) await supabaseAdmin.from('orders').delete().eq('id', order1.id);
    if (productA?.id) await supabaseAdmin.from('products').delete().eq('id', productA.id);
    if (productB?.id) await supabaseAdmin.from('products').delete().eq('id', productB.id);

    if (sellerUserId) await supabaseAdmin.auth.admin.deleteUser(sellerUserId);
    if (buyer1UserId) await supabaseAdmin.auth.admin.deleteUser(buyer1UserId);
    if (buyer2UserId) await supabaseAdmin.auth.admin.deleteUser(buyer2UserId);
    console.log('  🧹 Cleaned up review test orders, products, and users');
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
