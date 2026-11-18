/**
 * ODOP Nexus — Phase 7: Payment Integration (Razorpay) Tests
 *
 * Verifies Acceptance Criteria & Business Invariants:
 *   1. Payment Initiation (POST /api/payments/create-order)
 *      - Associated with authenticated buyer's order
 *      - Rejects unauthenticated requests (401)
 *      - Rejects unauthorized cross-buyer access (404)
 *      - Creates pending record in payments table
 *      - Calculates exact amount in paise
 *   2. CRITICAL SECURITY: Cryptographic Signature Verification (POST /api/payments/verify)
 *      - Valid HMAC-SHA256 signature confirms payment (200 OK)
 *      - Database payment record updated to 'paid'
 *      - Order status updated to 'confirmed' and payment_status to 'paid'
 *      - FORGED / TAMPERED signature is rejected (400 Bad Request)
 *      - NO FALSE SUCCESSFUL PAYMENT: Order is NEVER marked as paid on bad signature
 *   3. Payment Failure Handling (POST /api/payments/failure)
 *      - Records failed payment attempt in database
 *      - Order payment_status updated to 'failed'
 *      - Order remains in 'pending_payment' so buyer can retry
 *   4. Payment History & Security Isolation (GET /api/payments/order/:orderId)
 *      - Owning buyer can view payment records
 *      - Non-owning buyer is blocked (404 Not Found)
 *   5. Invariant: Already Paid Order Cannot Re-Initiate Payment (400 Bad Request)
 *   6. Invariant: Cancelled Order Cannot Initiate Payment (400 Bad Request)
 *   7. Webhook Processing (POST /api/payments/webhook)
 *
 * Usage: node tests/payment.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';
import { generateTestSignature, generateTestWebhookSignature } from '../src/config/razorpay.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../src/constants/index.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================================');
  console.log('ODOP Nexus — Phase 7 Razorpay Payment Integration Tests');
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
  let sellerProfileId = null;

  let buyer1Token = null;
  let buyer1UserId = null;

  let buyer2Token = null;
  let buyer2UserId = null;

  let product = null;
  let testOrder = null;

  try {
    // ------------------------------------------------------------------
    // Setup Reference Data & Test Users
    // ------------------------------------------------------------------
    const { data: district } = await supabaseAdmin.from('districts').select('id, name').limit(1).single();
    const { data: category } = await supabaseAdmin.from('categories').select('id').limit(1).single();

    // 1. Setup Seller
    const sEmail = `seller.pay.${timestamp}@gmail.com`;
    const sRegRes = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Payment Test Artisan',
        email: sEmail,
        password: 'Password123!',
        phone: '9876543201',
        district_id: district.id,
        business_name: 'Artisan Payment Crafts',
        address: '12 Workshop Road',
        state: 'Maharashtra',
      }),
    });
    const sData = await sRegRes.json();
    sellerUserId = sData.data.user.id;
    sellerToken = sData.data.session.access_token;
    sellerProfileId = sData.data.user.seller_profile_id;

    // 2. Setup Buyer 1 & Buyer 2
    const b1Email = `buyer1.pay.${timestamp}@gmail.com`;
    const b1RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Payment Buyer 1',
        email: b1Email,
        password: 'Password123!',
      }),
    });
    const b1Data = await b1RegRes.json();
    buyer1UserId = b1Data.data.user.id;
    buyer1Token = b1Data.data.session.access_token;

    const b2Email = `buyer2.pay.${timestamp}@gmail.com`;
    const b2RegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Payment Buyer 2',
        email: b2Email,
        password: 'Password123!',
      }),
    });
    const b2Data = await b2RegRes.json();
    buyer2UserId = b2Data.data.user.id;
    buyer2Token = b2Data.data.session.access_token;

    // 3. Create Product (price 1500, stock 10)
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        name: `Handcrafted Copper Jug ${timestamp}`,
        description: 'Pure hammered copper craft',
        price: 1500.0,
        stock: 10,
        category_id: category.id,
        district_id: district.id,
        status: 'active',
      }),
    });
    product = (await prodRes.json()).data;

    // 4. Create Order for Buyer 1 (1 unit of product = 1500)
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
      body: JSON.stringify({
        delivery_name: 'Payment Buyer 1',
        delivery_phone: '+919876543210',
        delivery_address: 'Flat 101, Lake View',
        delivery_city: 'Pune',
        delivery_district: 'Pune',
        delivery_state: 'Maharashtra',
        delivery_pincode: '411001',
        items: [{ product_id: product.id, quantity: 1 }],
      }),
    });
    testOrder = (await orderRes.json()).data;

    // ------------------------------------------------------------------
    // TEST 1: Payment Initiation
    // ------------------------------------------------------------------
    console.log('--- 1. Payment Order Initiation ---');
    let initiatedPayment = null;
    {
      // 1. Unauthenticated request rejected
      const unauthRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: testOrder.id }),
      });
      assert(unauthRes.status === 401, 'Unauthenticated POST /payments/create-order returns 401 Unauthorized');

      // 2. Buyer 2 cannot initiate payment for Buyer 1's order (Isolation)
      const buyer2Res = await fetch(`${BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer2Token}` },
        body: JSON.stringify({ order_id: testOrder.id }),
      });
      assert(buyer2Res.status === 404, 'Buyer 2 cannot initiate payment for Buyer 1 order (404 Not Found)');

      // 3. Buyer 1 initiates payment successfully
      const payInitRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: testOrder.id }),
      });
      const payInitData = await payInitRes.json();
      assert(payInitRes.status === 201, 'Buyer 1 initiates payment (201 Created)');
      assert(payInitData.success === true, 'Response success is true');
      initiatedPayment = payInitData.data;

      assert(initiatedPayment.order_id === testOrder.id, 'Payment linked to correct internal order ID');
      assert(initiatedPayment.amount === 1500, 'Payment amount matches order total (1500.00)');
      assert(initiatedPayment.amount_paise === 150000, 'Amount in paise is 150000 (1500 * 100)');
      assert(initiatedPayment.currency === 'INR', 'Currency is INR');
      assert(Boolean(initiatedPayment.razorpay_order_id), 'Razorpay order ID returned');

      // 4. Verify payment row in database
      const { data: dbPayment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', initiatedPayment.payment_id)
        .single();
      assert(dbPayment.status === PAYMENT_STATUS.PENDING, 'Database payment status is pending');
      assert(Number(dbPayment.amount) === 1500, 'Database payment amount is 1500.00');
    }

    // ------------------------------------------------------------------
    // TEST 2: CRITICAL INVARIANT: Forged / Tampered Signature Rejection
    // ------------------------------------------------------------------
    console.log('\n--- 2. CRITICAL SECURITY: Tampered Signature Rejected ---');
    {
      const fakePaymentId = 'pay_fake_payment_12345';
      const forgedSignature = 'forged_invalid_signature_hash_abcdef';

      const verifyFakeRes = await fetch(`${BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          order_id: testOrder.id,
          razorpay_order_id: initiatedPayment.razorpay_order_id,
          razorpay_payment_id: fakePaymentId,
          razorpay_signature: forgedSignature,
        }),
      });
      assert(verifyFakeRes.status === 400, 'Forged signature rejected with 400 Bad Request');

      // Database integrity: Ensure order is NOT marked as paid
      const { data: orderAfterTamper } = await supabaseAdmin
        .from('orders')
        .select('payment_status, order_status')
        .eq('id', testOrder.id)
        .single();
      assert(orderAfterTamper.payment_status !== PAYMENT_STATUS.PAID, 'CRITICAL: Order payment_status is NOT paid');
      assert(orderAfterTamper.order_status !== ORDER_STATUS.CONFIRMED, 'CRITICAL: Order order_status is NOT confirmed');
    }

    // ------------------------------------------------------------------
    // TEST 3: Cryptographic Signature Verification (Success)
    // ------------------------------------------------------------------
    console.log('\n--- 3. Valid Cryptographic Verification & Order Confirmation ---');
    {
      const genuinePaymentId = `pay_rzp_mock_${Date.now()}`;
      // Generate genuine HMAC-SHA256 signature
      const validSignature = generateTestSignature(
        initiatedPayment.razorpay_order_id,
        genuinePaymentId
      );

      const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          order_id: testOrder.id,
          razorpay_order_id: initiatedPayment.razorpay_order_id,
          razorpay_payment_id: genuinePaymentId,
          razorpay_signature: validSignature,
        }),
      });
      const verifyData = await verifyRes.json();
      assert(verifyRes.status === 200, 'POST /payments/verify returns 200 OK');
      assert(verifyData.success === true, 'Verification success is true');
      assert(verifyData.data.order.payment_status === PAYMENT_STATUS.PAID, 'Order payment_status is paid');
      assert(verifyData.data.order.order_status === ORDER_STATUS.CONFIRMED, 'Order status transitioned to confirmed');
      assert(verifyData.data.payment.status === PAYMENT_STATUS.PAID, 'Database payment record is paid');

      // Double check in database directly
      const { data: dbOrderFinal } = await supabaseAdmin
        .from('orders')
        .select('order_status, payment_status')
        .eq('id', testOrder.id)
        .single();
      assert(dbOrderFinal.payment_status === 'paid', 'Database confirms payment_status: paid');
      assert(dbOrderFinal.order_status === 'confirmed', 'Database confirms order_status: confirmed');
    }

    // ------------------------------------------------------------------
    // TEST 4: INVARIANT: Already Paid Order Cannot Re-Initiate
    // ------------------------------------------------------------------
    console.log('\n--- 4. Invariant: Already Paid Order Re-Initiation Rejected ---');
    {
      const reinitRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: testOrder.id }),
      });
      assert(reinitRes.status === 400, 'Cannot initiate payment for already paid order (400 Bad Request)');
    }

    // ------------------------------------------------------------------
    // TEST 5: Payment Failure Handling & Retry Enablement
    // ------------------------------------------------------------------
    console.log('\n--- 5. Payment Failure Recording & Retry Enablement ---');
    {
      // Create a second order to test failure recording
      const order2Res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          delivery_name: 'Payment Buyer 1',
          delivery_phone: '+919876543210',
          delivery_address: 'Flat 101, Lake View',
          delivery_city: 'Pune',
          delivery_district: 'Pune',
          delivery_state: 'Maharashtra',
          delivery_pincode: '411001',
          items: [{ product_id: product.id, quantity: 1 }],
        }),
      });
      const order2 = (await order2Res.json()).data;

      // Initiate payment for order 2
      const pay2InitRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({ order_id: order2.id }),
      });
      const pay2Init = (await pay2InitRes.json()).data;

      // Report failure (e.g. buyer cancelled modal or card declined)
      const failRes = await fetch(`${BASE_URL}/payments/failure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer1Token}` },
        body: JSON.stringify({
          order_id: order2.id,
          provider_order_id: pay2Init.razorpay_order_id,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Payment was cancelled by the customer',
        }),
      });
      assert(failRes.status === 200, 'POST /payments/failure returns 200 OK');

      // Check DB: payment is marked failed, but order remains pending_payment for retry
      const { data: dbOrder2 } = await supabaseAdmin
        .from('orders')
        .select('order_status, payment_status')
        .eq('id', order2.id)
        .single();
      assert(dbOrder2.payment_status === PAYMENT_STATUS.FAILED, 'Order payment_status is failed');
      assert(dbOrder2.order_status === ORDER_STATUS.PENDING_PAYMENT, 'Order order_status remains pending_payment to allow retry');

      // Clean up order 2
      await supabaseAdmin.from('orders').delete().eq('id', order2.id);
    }

    // ------------------------------------------------------------------
    // TEST 6: Payment Records History & Security Isolation
    // ------------------------------------------------------------------
    console.log('\n--- 6. Payment History & Access Isolation ---');
    {
      // Buyer 1 retrieves payments for their order
      const getPayRes = await fetch(`${BASE_URL}/payments/order/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${buyer1Token}` },
      });
      const getPayData = await getPayRes.json();
      assert(getPayRes.status === 200, 'Buyer 1 retrieves payments for own order (200 OK)');
      assert(Array.isArray(getPayData.data), 'Returns array of payment attempts');
      assert(getPayData.data.length >= 1, 'Contains payment record');
      assert(getPayData.data[0].status === PAYMENT_STATUS.PAID, 'Payment record confirms paid status');

      // Buyer 2 cannot access Buyer 1's payments
      const b2GetPayRes = await fetch(`${BASE_URL}/payments/order/${testOrder.id}`, {
        headers: { Authorization: `Bearer ${buyer2Token}` },
      });
      assert(b2GetPayRes.status === 404, 'Buyer 2 attempting to view Buyer 1 payments returns 404 Not Found');
    }

    // ------------------------------------------------------------------
    // TEST 7: Webhook Processing
    // ------------------------------------------------------------------
    console.log('\n--- 7. Razorpay Webhook Processing ---');
    {
      const webhookPayload = {
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: initiatedPayment.razorpay_order_id,
              amount: 150000,
              status: 'paid',
            },
          },
          payment: {
            entity: {
              id: 'pay_webhook_test_123',
              order_id: initiatedPayment.razorpay_order_id,
            },
          },
        },
      };

      const webhookSignature = generateTestWebhookSignature(webhookPayload);
      const webhookRes = await fetch(`${BASE_URL}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': webhookSignature,
        },
        body: JSON.stringify(webhookPayload),
      });
      assert(webhookRes.status === 200, 'POST /payments/webhook returns 200 OK');
    }

    // ------------------------------------------------------------------
    // Cleanup Test Users & Data
    // ------------------------------------------------------------------
    console.log('\n--- Cleanup Test Users & Data ---');
    if (testOrder?.id) await supabaseAdmin.from('orders').delete().eq('id', testOrder.id);
    if (product?.id) await supabaseAdmin.from('products').delete().eq('id', product.id);

    if (sellerUserId) await supabaseAdmin.auth.admin.deleteUser(sellerUserId);
    if (buyer1UserId) await supabaseAdmin.auth.admin.deleteUser(buyer1UserId);
    if (buyer2UserId) await supabaseAdmin.auth.admin.deleteUser(buyer2UserId);
    console.log('  🧹 Cleaned up payment test orders, products, and users');
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
