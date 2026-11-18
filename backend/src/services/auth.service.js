/**
 * Authentication service.
 *
 * Uses Supabase Auth for identity management:
 *   - auth.users   → authentication identity (email/password)
 *   - profiles      → application-level user data (role, name, phone)
 *   - seller_profiles → extended seller data (business, district)
 *
 * Passwords are hashed by Supabase Auth (Argon2id) — we never handle
 * plaintext passwords beyond forwarding them to the Supabase signUp/signIn calls.
 *
 * See: Development Rules §14 — Authentication Rules
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/index.js';
import { HTTP, ROLES } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Register a new buyer.
 *
 * Flow:
 *   1. Create auth.users record via Supabase Auth
 *   2. Create profiles record with role = 'buyer'
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.phone]
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function registerBuyer({ name, email, password, phone }) {
  // 1. Create Supabase Auth user (admin creates confirmed user, avoiding rate-limited email send)
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: ROLES.BUYER },
  });

  if (createError) {
    logger.error('registerBuyer: Supabase Auth createUser failed', { error: createError.message });

    if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
      throw new AppError('An account with this email already exists.', HTTP.CONFLICT);
    }
    throw new AppError(createError.message, HTTP.BAD_REQUEST);
  }

  const userId = createData.user?.id;
  if (!userId) {
    throw new AppError('Registration failed — no user ID returned.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 2. Create application profile (using admin client to bypass RLS)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: name,
      phone: phone || null,
      role: ROLES.BUYER,
    });

  if (profileError) {
    logger.error('registerBuyer: Profile creation failed', { userId, error: profileError.message });
    // Auth user was created but profile failed — attempt cleanup
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new AppError('Registration failed. Please try again.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 3. Automatically sign in to get active session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  logger.info('Buyer registered', { userId, email });

  return {
    user: {
      id: userId,
      email,
      name,
      role: ROLES.BUYER,
    },
    session: sessionData?.session || null,
  };
}

/**
 * Register a new seller.
 *
 * Flow:
 *   1. Create auth.users record via Supabase Auth (admin client)
 *   2. Create profiles record with role = 'seller'
 *   3. Create seller_profiles record with business details
 *
 * @param {object} params
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function registerSeller({
  name, email, password, phone,
  business_name, address, district_id, state,
}) {
  // Validate that district exists
  const { data: district, error: districtError } = await supabaseAdmin
    .from('districts')
    .select('id, name')
    .eq('id', district_id)
    .single();

  if (districtError || !district) {
    throw new AppError('Invalid district ID.', HTTP.BAD_REQUEST);
  }

  // 1. Create Supabase Auth user (admin creates confirmed user)
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: ROLES.SELLER },
  });

  if (createError) {
    logger.error('registerSeller: Supabase Auth createUser failed', { error: createError.message });

    if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
      throw new AppError('An account with this email already exists.', HTTP.CONFLICT);
    }
    throw new AppError(createError.message, HTTP.BAD_REQUEST);
  }

  const userId = createData.user?.id;
  if (!userId) {
    throw new AppError('Registration failed — no user ID returned.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 2. Create application profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: name,
      phone: phone || null,
      role: ROLES.SELLER,
    });

  if (profileError) {
    logger.error('registerSeller: Profile creation failed', { userId, error: profileError.message });
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new AppError('Registration failed. Please try again.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 3. Create seller profile
  const { data: sellerProfile, error: sellerError } = await supabaseAdmin
    .from('seller_profiles')
    .insert({
      user_id: userId,
      business_name,
      phone: phone || null,
      address,
      district_id,
      state,
      verification_status: 'pending',
    })
    .select()
    .single();

  if (sellerError) {
    logger.error('registerSeller: Seller profile creation failed', { userId, error: sellerError.message });
    // Cleanup: remove profile and auth user
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new AppError('Seller registration failed. Please try again.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // 4. Automatically sign in to get active session
  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  logger.info('Seller registered', { userId, email, sellerId: sellerProfile.id });

  return {
    user: {
      id: userId,
      email,
      name,
      role: ROLES.SELLER,
      seller_profile_id: sellerProfile.id,
    },
    session: sessionData?.session || null,
  };
}

/**
 * Log in an existing user.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function login({ email, password }) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    logger.warn('Login failed', { email, error: authError.message });
    throw new AppError('Invalid email or password.', HTTP.UNAUTHORIZED);
  }

  const userId = authData.user?.id;

  // Fetch the application profile for role info
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, avatar_url')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    logger.error('Login: Profile not found for authenticated user', { userId });
    throw new AppError('User profile not found.', HTTP.INTERNAL_SERVER_ERROR);
  }

  // If seller, also include seller profile id
  let sellerProfileId = null;
  if (profile.role === ROLES.SELLER) {
    const { data: sellerProfile } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    sellerProfileId = sellerProfile?.id || null;
  }

  logger.info('User logged in', { userId, role: profile.role });

  return {
    user: {
      id: userId,
      email: authData.user.email,
      name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      avatar_url: profile.avatar_url,
      ...(sellerProfileId && { seller_profile_id: sellerProfileId }),
    },
    session: authData.session,
  };
}

/**
 * Get the current authenticated user's profile.
 *
 * @param {string} userId - UUID from auth middleware.
 * @returns {Promise<object>}
 */
export async function getProfile(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, role, avatar_url, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new AppError('Profile not found.', HTTP.NOT_FOUND);
  }

  // If seller, attach seller profile details
  if (profile.role === ROLES.SELLER) {
    const { data: sellerProfile } = await supabaseAdmin
      .from('seller_profiles')
      .select('id, business_name, phone, address, district_id, state, verification_status, created_at')
      .eq('user_id', userId)
      .single();

    if (sellerProfile) {
      profile.seller_profile = sellerProfile;
    }
  }

  return profile;
}
