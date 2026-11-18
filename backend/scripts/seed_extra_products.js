// backend/scripts/seed_extra_products.js
// Seeds products from Docs/products.extra.js and Project 2/dummy-products/products.js into Supabase

import { supabaseAdmin } from '../src/config/supabase.js';
import { moreSellers, moreProducts, moreDistricts } from '../../Docs/products.extra.js';
import { demoSellers, demoProducts } from '../../Docs/products.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function seed() {
  console.log('====================================================');
  console.log('📦 SEEDING EXTRA ODOP PRODUCTS & SELLERS INTO SUPABASE');
  console.log('====================================================\n');

  try {
    // ----------------------------------------------------
    // 1. Ensure Categories Exist & Map Them
    // ----------------------------------------------------
    console.log('1. Checking and creating categories...');
    const { data: existingCategories } = await supabaseAdmin.from('categories').select('*');
    const categoryMap = new Map();
    existingCategories.forEach(c => categoryMap.set(c.slug, c.id));

    // Ensure common slugs exist
    const categoryFallbacks = [
      { name: 'Food & Pantry', slug: 'food-products' },
      { name: 'Handicrafts & Decor', slug: 'handicrafts' },
      { name: 'Textiles & Handloom', slug: 'textiles' },
      { name: 'Style & Apparel', slug: 'style' },
      { name: 'Home & Living', slug: 'home-living' },
      { name: 'Stationery & Gifts', slug: 'stationery-gifts' },
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Leather Goods', slug: 'leather-goods' },
      { name: 'Art & Decor', slug: 'art-decor' },
    ];

    for (const cat of categoryFallbacks) {
      if (!categoryMap.has(cat.slug)) {
        const { data: createdCat } = await supabaseAdmin
          .from('categories')
          .insert({ name: cat.name, slug: cat.slug, is_active: true })
          .select()
          .single();
        if (createdCat) categoryMap.set(cat.slug, createdCat.id);
      }
    }

    const getCategoryId = (catName) => {
      const lower = (catName || '').toLowerCase();
      if (lower.includes('food') || lower.includes('pantry') || lower.includes('spices') || lower.includes('snack')) {
        return categoryMap.get('food-products');
      }
      if (lower.includes('textile') || lower.includes('khadi') || lower.includes('fabric')) {
        return categoryMap.get('textiles');
      }
      if (lower.includes('leather') || lower.includes('chappal')) {
        return categoryMap.get('leather-goods') || categoryMap.get('textiles');
      }
      if (lower.includes('art') || lower.includes('warli') || lower.includes('decor')) {
        return categoryMap.get('art-decor') || categoryMap.get('handicrafts');
      }
      if (lower.includes('home') || lower.includes('living') || lower.includes('tableware')) {
        return categoryMap.get('home-living') || categoryMap.get('handicrafts');
      }
      if (lower.includes('stationery') || lower.includes('notebook') || lower.includes('gift')) {
        return categoryMap.get('stationery-gifts') || categoryMap.get('handicrafts');
      }
      return categoryMap.get('handicrafts') || existingCategories[0].id;
    };

    // ----------------------------------------------------
    // 2. Ensure Districts Exist & Map Them
    // ----------------------------------------------------
    console.log('2. Checking and creating districts...');
    const allDistrictDefs = [
      ...moreDistricts,
      { district: 'Palghar', state: 'Maharashtra', product: 'Warli folk art' },
      { district: 'Kolhapur', state: 'Maharashtra', product: 'Kolhapuri chappal' },
      { district: 'Solapur', state: 'Maharashtra', product: 'Solapur Chaddar' },
      { district: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', product: 'Paithani Saree' },
      { district: 'Sindhudurg', state: 'Maharashtra', product: 'Wooden Lacquerware Toys' },
      { district: 'Nagpur', state: 'Maharashtra', product: 'Nagpur Orange Products' },
      { district: 'Nashik', state: 'Maharashtra', product: 'Grapes & Wine Products' },
      { district: 'Ratnagiri', state: 'Maharashtra', product: 'Alphonso Mango Products' },
    ];

    const districtMap = new Map();
    const { data: existingDistricts } = await supabaseAdmin.from('districts').select('*');
    existingDistricts.forEach(d => {
      districtMap.set(d.name.toLowerCase(), d.id);
      districtMap.set(d.slug.toLowerCase(), d.id);
    });

    for (const d of allDistrictDefs) {
      const dNameLower = d.district.toLowerCase();
      if (!districtMap.has(dNameLower)) {
        const slug = slugify(d.district);
        const { data: createdDist, error } = await supabaseAdmin
          .from('districts')
          .insert({
            name: d.district,
            state: d.state,
            slug,
            odop_product_name: d.product,
            is_active: true,
          })
          .select()
          .single();
        if (createdDist) {
          districtMap.set(dNameLower, createdDist.id);
          districtMap.set(slug, createdDist.id);
          console.log(`  ✓ Created district: ${d.district} (${d.state})`);
        } else if (error) {
          console.warn(`  ⚠️ Could not insert district ${d.district}:`, error.message);
        }
      }
    }

    // ----------------------------------------------------
    // 3. Ensure Sellers Exist & Map Them
    // ----------------------------------------------------
    console.log('\n3. Creating / linking artisan sellers...');
    const allSellers = [...demoSellers, ...moreSellers];
    const sellerMap = new Map();

    for (const s of allSellers) {
      const distId = districtMap.get(s.district.toLowerCase()) || districtMap.get('pune');
      if (!distId) {
        console.warn(`  ⚠️ No district found for seller ${s.name} (${s.district})`);
        continue;
      }

      // Check if seller profile already exists by business_name
      const { data: existingSeller } = await supabaseAdmin
        .from('seller_profiles')
        .select('id, user_id, business_name, district_id')
        .eq('business_name', s.name)
        .maybeSingle();

      if (existingSeller) {
        sellerMap.set(s.id, existingSeller.id);
        sellerMap.set(s.name, existingSeller.id);
        continue;
      }

      // Create an auth user for this seller
      const sellerEmail = `${slugify(s.name)}@odopdemo.in`;
      let userId;

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: sellerEmail,
        password: 'DemoSellerPassword123!',
        email_confirm: true,
        user_metadata: { full_name: s.name, role: 'seller' },
      });

      if (authUser?.user) {
        userId = authUser.user.id;
      } else {
        // Find existing user if already created
        const { data: existingUser } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('full_name', s.name)
          .maybeSingle();
        userId = existingUser?.id;
      }

      if (!userId) {
        // Fallback: create arbitrary profile
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .upsert({
            full_name: s.name,
            role: 'seller',
          })
          .select()
          .single();
        userId = prof?.id;
      }

      if (userId) {
        const { data: newSellerProfile, error: sErr } = await supabaseAdmin
          .from('seller_profiles')
          .upsert({
            user_id: userId,
            business_name: s.name,
            district_id: distId,
            state: 'Maharashtra',
            address: `Artisan Studio, ${s.district}`,
            phone: '9820098200',
            verification_status: 'approved',
          })
          .select()
          .single();

        if (newSellerProfile) {
          sellerMap.set(s.id, newSellerProfile.id);
          sellerMap.set(s.name, newSellerProfile.id);
          console.log(`  ✓ Linked seller profile: ${s.name} in ${s.district}`);
        } else if (sErr) {
          console.warn(`  ⚠️ Failed to create seller profile for ${s.name}:`, sErr.message);
        }
      }
    }

    // ----------------------------------------------------
    // 4. Insert Products & Images
    // ----------------------------------------------------
    console.log('\n4. Inserting products and image galleries...');
    const allProducts = [...demoProducts, ...moreProducts];
    let insertedCount = 0;

    for (const p of allProducts) {
      const sellerProfileId = sellerMap.get(p.sellerId);
      const districtId = districtMap.get(p.district.toLowerCase());
      const categoryId = getCategoryId(p.category);

      if (!sellerProfileId || !districtId || !categoryId) {
        console.warn(`  ⚠️ Skipping product ${p.name}: Missing relations (Seller: ${!!sellerProfileId}, District: ${!!districtId}, Category: ${!!categoryId})`);
        continue;
      }

      // Check if product already exists by slug or name
      const prodSlug = slugify(p.name);
      const { data: existingProd } = await supabaseAdmin
        .from('products')
        .select('id')
        .or(`slug.eq.${p.slug},slug.eq.${prodSlug}`)
        .maybeSingle();

      if (existingProd) {
        continue; // Already exists
      }

      // Insert product
      const { data: insertedProd, error: pErr } = await supabaseAdmin
        .from('products')
        .insert({
          seller_id: sellerProfileId,
          district_id: districtId,
          category_id: categoryId,
          name: p.name,
          slug: p.slug || prodSlug,
          description: `${p.shortDescription || ''} ${p.story || ''}`.trim() || 'Authentic handcrafted ODOP product.',
          price: Number(p.price) || 999,
          stock: Number(p.stock) || 20,
          status: 'active',
          odop_product_name: p.districtProduct || p.name,
        })
        .select()
        .single();

      if (insertedProd) {
        insertedCount++;
        // Insert product image
        if (p.imageUrl) {
          await supabaseAdmin
            .from('product_images')
            .insert({
              product_id: insertedProd.id,
              image_url: p.imageUrl,
              display_order: 0,
            });
        }
        console.log(`  ✓ Inserted [${p.district}] ${p.name} - ₹${p.price}`);
      } else if (pErr) {
        console.warn(`  ⚠️ Error inserting product ${p.name}:`, pErr.message);
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 SUCCESS: ${insertedCount} new products successfully added to database!`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  }
}

seed();
