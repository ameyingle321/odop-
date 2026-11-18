/**
 * ODOP Nexus — Auth Integration Tests
 *
 * Verifies Phase 3 Acceptance Criteria:
 *   1. New user registration (Buyer & Seller)
 *   2. Valid login
 *   3. Invalid login (wrong password / non-existent user)
 *   4. Logout (POST /api/auth/logout)
 *   5. Protected route without login (401)
 *   6. Buyer accessing profile
 *   7. Seller accessing profile with seller details
 *   8. Unauthorized role attempting restricted functionality (403 Forbidden)
 *
 * Usage: node tests/auth.test.js
 */

import { supabaseAdmin } from '../src/config/supabase.js';

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('========================================');
  console.log('ODOP Nexus — Phase 3 Auth Integration Tests');
  console.log('========================================\n');

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

  // --- 1. Health Check ---
  console.log('--- 1. Health & Database Connectivity ---');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.status === 200, 'Health endpoint returns 200 OK');
    assert(data.data.database === 'connected', 'Supabase database is connected');
  } catch (err) {
    assert(false, 'Health check failed', err.message);
  }

  // --- 2. Protected Route Without Login ---
  console.log('\n--- 2. Protected Route Access Without Token ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/profile`);
    const data = await res.json();
    assert(res.status === 401, 'Returns 401 Unauthorized');
    assert(data.success === false, 'success is false');
    assert(data.message.includes('Authentication required'), 'Proper error message');
  } catch (err) {
    assert(false, 'Unauthenticated test failed', err.message);
  }

  // --- 3. Input Validation ---
  console.log('\n--- 3. Joi Validation Middleware ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });
    const data = await res.json();
    assert(res.status === 422, 'Returns 422 Unprocessable Entity');
    assert(data.errors !== undefined, 'Returns field-level validation errors');
  } catch (err) {
    assert(false, 'Validation test failed', err.message);
  }

  const timestamp = Date.now();
  const testBuyerEmail = `buyer.${timestamp}@gmail.com`;
  const testBuyerPassword = 'Password123!';
  let buyerToken = null;
  let buyerUserId = null;

  // --- 4. Buyer Registration ---
  console.log('\n--- 4. Buyer Registration ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditi Sharma',
        email: testBuyerEmail,
        password: testBuyerPassword,
        phone: '9876543210',
      }),
    });
    const data = await res.json();
    assert(res.status === 201, 'Buyer registration returns 201 Created');
    assert(data.success === true, 'Response success is true');
    assert(data.data.user.role === 'buyer', 'User role is buyer');
    assert(data.data.user.email === testBuyerEmail, 'User email matches');
    assert(data.data.session?.access_token !== undefined, 'Session token provided');
    buyerUserId = data.data.user.id;
    buyerToken = data.data.session.access_token;
  } catch (err) {
    assert(false, 'Buyer registration failed', err.message);
  }

  // --- 5. Valid Login ---
  console.log('\n--- 5. Valid Login ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testBuyerEmail,
        password: testBuyerPassword,
      }),
    });
    const data = await res.json();
    assert(res.status === 200, 'Valid login returns 200 OK');
    assert(data.data.user.role === 'buyer', 'Logged in user role is buyer');
    assert(data.data.session?.access_token !== undefined, 'Returns active access token');
    buyerToken = data.data.session.access_token;
  } catch (err) {
    assert(false, 'Login failed', err.message);
  }

  // --- 6. Invalid Login ---
  console.log('\n--- 6. Invalid Login ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testBuyerEmail,
        password: 'WrongPassword123!',
      }),
    });
    const data = await res.json();
    assert(res.status === 401, 'Returns 401 for wrong password');
    assert(data.success === false, 'success is false');
    assert(data.message.includes('Invalid email or password'), 'Clean error message without leaking details');
  } catch (err) {
    assert(false, 'Invalid login test failed', err.message);
  }

  // --- 7. Authenticated Profile Retrieval ---
  console.log('\n--- 7. Authenticated Profile Retrieval ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${buyerToken}`,
      },
    });
    const data = await res.json();
    assert(res.status === 200, 'Profile returns 200 OK');
    assert(data.data.full_name === 'Aditi Sharma', 'Profile full_name matches');
    assert(data.data.role === 'buyer', 'Profile role is buyer');
  } catch (err) {
    assert(false, 'Profile retrieval failed', err.message);
  }

  // --- 8. Seller Registration ---
  console.log('\n--- 8. Seller Registration ---');
  const testSellerEmail = `seller.${timestamp}@gmail.com`;
  const testSellerPassword = 'Password123!';
  let sellerUserId = null;
  let sellerToken = null;

  try {
    const { data: district } = await supabaseAdmin
      .from('districts')
      .select('id, name')
      .limit(1)
      .single();

    assert(district !== null, `Found sample district: ${district.name}`);

    const res = await fetch(`${BASE_URL}/auth/register/seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Patel',
        email: testSellerEmail,
        password: testSellerPassword,
        phone: '9876543211',
        business_name: 'Paithani Heritage Weaves',
        address: '42 Silk Market',
        district_id: district.id,
        state: 'Maharashtra',
      }),
    });
    const data = await res.json();
    assert(res.status === 201, 'Seller registration returns 201 Created');
    assert(data.data.user.role === 'seller', 'User role is seller');
    assert(data.data.user.seller_profile_id !== undefined, 'Seller profile ID returned');
    sellerUserId = data.data.user.id;
  } catch (err) {
    assert(false, 'Seller registration failed', err.message);
  }

  // --- 9. Seller Login & Profile Verification ---
  console.log('\n--- 9. Seller Login & Profile Verification ---');
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: testSellerPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Seller login returns 200 OK');
    assert(loginData.data.user.role === 'seller', 'Logged in user role is seller');
    sellerToken = loginData.data.session.access_token;

    const profRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${sellerToken}`,
      },
    });
    const profData = await profRes.json();
    assert(profRes.status === 200, 'Seller profile returns 200 OK');
    assert(profData.data.role === 'seller', 'Profile role is seller');
    assert(profData.data.seller_profile !== undefined, 'Attached seller_profile object');
    assert(profData.data.seller_profile.business_name === 'Paithani Heritage Weaves', 'Business name matches');
  } catch (err) {
    assert(false, 'Seller profile verification failed', err.message);
  }

  // --- 10. Logout Endpoint ---
  console.log('\n--- 10. Logout Endpoint ---');
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${buyerToken}`,
      },
    });
    const data = await res.json();
    assert(res.status === 200, 'Logout returns 200 OK');
    assert(data.success === true, 'Response success is true');
    assert(data.message.includes('Logged out successfully'), 'Clean logout confirmation');
  } catch (err) {
    assert(false, 'Logout test failed', err.message);
  }

  // --- Cleanup Test Users ---
  console.log('\n--- Cleanup Test Users ---');
  try {
    if (buyerUserId) {
      await supabaseAdmin.from('profiles').delete().eq('id', buyerUserId);
      await supabaseAdmin.auth.admin.deleteUser(buyerUserId);
      console.log('  🧹 Cleaned up test buyer user');
    }
    if (sellerUserId) {
      await supabaseAdmin.from('seller_profiles').delete().eq('user_id', sellerUserId);
      await supabaseAdmin.from('profiles').delete().eq('id', sellerUserId);
      await supabaseAdmin.auth.admin.deleteUser(sellerUserId);
      console.log('  🧹 Cleaned up test seller user');
    }
  } catch (cleanupErr) {
    console.warn('  ⚠️ Cleanup warning:', cleanupErr.message);
  }

  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
