import { supabaseAdmin } from './src/config/supabase.js';

async function seed() {
  console.log('Seeding products for all sidebar districts...');

  // 1. Fetch districts
  const { data: districts } = await supabaseAdmin.from('districts').select('id, name, slug');
  const distMap = {};
  districts.forEach(d => { distMap[d.name] = d; distMap[d.slug] = d; });

  // 2. Fetch categories
  const { data: categories } = await supabaseAdmin.from('categories').select('id, name, slug');
  const catMap = {};
  categories.forEach(c => { catMap[c.slug] = c; catMap[c.name] = c; });

  const textilesId = catMap['textiles']?.id || catMap['accessories']?.id;
  const handicraftsId = catMap['handicrafts']?.id || catMap['art-decor']?.id;
  const foodId = catMap['food-products']?.id || catMap['agricultural-products']?.id;
  const homeId = catMap['home-living']?.id || handicraftsId;

  const districtsToSeed = [
    {
      districtName: 'Aurangabad',
      businessName: 'Aurangabad Heritage Handlooms',
      products: [
        {
          name: 'Aurangabad Paithani Silk Saree',
          price: 8500,
          description: 'Authentic handwoven Paithani silk saree featuring peacock motifs and pure zari border from Aurangabad.',
          categoryId: textilesId,
          image: '/images/products/paithani-silk-saree.jpg',
        },
        {
          name: 'Ajanta Motif Silk Stole',
          price: 1450,
          description: 'Handprinted soft silk stole inspired by historic Ajanta cave wall murals.',
          categoryId: textilesId,
          image: '/images/products/silk-stole-scarf.jpg',
        },
        {
          name: 'Himroo Handwoven Brocade Shawl',
          price: 3200,
          description: 'Traditional Aurangabad Himroo weave combining spun silk and cotton threads.',
          categoryId: textilesId,
          image: '/images/products/silk-brocade-saree.jpg',
        },
      ]
    },
    {
      districtName: 'Chanderi',
      businessName: 'Chanderi Weaver Guild',
      products: [
        {
          name: 'Chanderi Handspun Zari Saree',
          price: 4200,
          description: 'Sheer texture and luxurious drape woven with traditional gold zari bootis in Chanderi.',
          categoryId: textilesId,
          image: '/images/products/chanderi-saree.jpg',
        },
        {
          name: 'Chanderi Silk Cotton Dupatta',
          price: 1250,
          description: 'Lightweight gossamer weave silk dupatta finished with delicate zari border.',
          categoryId: textilesId,
          image: '/images/products/silk-stole-scarf.jpg',
        },
      ]
    },
    {
      districtName: 'Darjeeling',
      businessName: 'Darjeeling Estate Teas',
      products: [
        {
          name: 'First Flush Darjeeling Black Tea',
          price: 650,
          description: 'Muscatel aroma and floral notes picked from high-altitude Himalayan tea gardens in Darjeeling.',
          categoryId: foodId,
          image: '/images/products/darjeeling-tea.jpg',
        },
        {
          name: 'Himalayan Spring Green Tea Canister',
          price: 520,
          description: 'Single-estate hand-plucked green tea leaves packed in an airtight artisanal tin.',
          categoryId: foodId,
          image: '/images/products/darjeeling-tea.jpg',
        },
      ]
    },
    {
      districtName: 'Firozabad',
      businessName: 'Suhag Glass Studio',
      products: [
        {
          name: 'Handmade Firozabad Glass Bangle Set',
          price: 350,
          description: 'Set of vibrant handmade glass bangles with micro gold luster crafted by traditional glass artisans.',
          categoryId: handicraftsId,
          image: '/images/products/firozabad-glass.jpg',
        },
        {
          name: 'Artisan Blown Glass Decor Vase',
          price: 980,
          description: 'Mouth-blown iridescent decorative glass vessel created in the heritage kilns of Firozabad.',
          categoryId: homeId,
          image: '/images/products/firozabad-glass.jpg',
        },
      ]
    },
    {
      districtName: 'Jaipur',
      businessName: 'Jaipur Blue Ceramics',
      products: [
        {
          name: 'Jaipur Blue Pottery Floral Vase',
          price: 1200,
          description: 'Traditional quartz clay blue pottery hand-painted with cobalt blue cobalt cobalt floral patterns.',
          categoryId: handicraftsId,
          image: '/images/products/jaipur-blue-pottery.jpg',
        },
        {
          name: 'Hand-painted Blue Pottery Serving Plate',
          price: 850,
          description: 'Authentic GI-tagged Jaipur blue pottery plate glazed and fired without clay.',
          categoryId: homeId,
          image: '/images/products/jaipur-blue-pottery.jpg',
        },
      ]
    },
    {
      districtName: 'Jodhpur',
      businessName: 'Marwar Craft Guild',
      products: [
        {
          name: 'Jodhpuri Bandhani Silk Dupatta',
          price: 1100,
          description: 'Traditional tie-and-dye bandhani dots created by master craftswomen of Jodhpur.',
          categoryId: textilesId,
          image: '/images/products/jodhpur-bandhani.jpg',
        },
        {
          name: 'Handcarved Sheesham Wood Spice Box',
          price: 950,
          description: 'Solid seasoned rosewood masala dabba with brass latch handcrafted in Jodhpur.',
          categoryId: homeId,
          image: '/images/products/wooden-chess-craft.jpg',
        },
      ]
    },
  ];

  for (const group of districtsToSeed) {
    const dist = distMap[group.districtName];
    if (!dist) {
      console.warn(`District ${group.districtName} not found!`);
      continue;
    }

    // Check if seller profile already exists for this district
    let { data: seller } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('district_id', dist.id)
      .limit(1)
      .maybeSingle();

    if (!seller) {
      // Create user first
      const email = `seller_${dist.slug}_${Date.now()}@odopnexus.in`;
      const { data: userAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'Password123!',
        user_metadata: { role: 'seller', full_name: group.businessName },
        email_confirm: true,
      });

      if (authErr) {
        console.error(`Auth error for ${group.businessName}:`, authErr);
        continue;
      }

      // Create seller profile
      const { data: newSeller, error: sellerErr } = await supabaseAdmin
        .from('seller_profiles')
        .insert({
          user_id: userAuth.user.id,
          business_name: group.businessName,
          district_id: dist.id,
          state: dist.state || 'India',
          verification_status: 'pending',
        })
        .select('id')
        .single();

      if (sellerErr) {
        console.error(`Seller error for ${group.businessName}:`, sellerErr);
        continue;
      }
      seller = newSeller;
      console.log(`Created seller ${group.businessName} (${dist.name})`);
    }

    // Insert products
    for (const item of group.products) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
      const { data: product, error: prodErr } = await supabaseAdmin
        .from('products')
        .insert({
          seller_id: seller.id,
          district_id: dist.id,
          category_id: item.categoryId,
          name: item.name,
          slug,
          description: item.description,
          price: item.price,
          stock: 25,
          status: 'active',
          odop_product_name: dist.odop_product_name || item.name,
        })
        .select('id')
        .single();

      if (prodErr) {
        console.error(`Product error for ${item.name}:`, prodErr);
        continue;
      }

      // Add image
      await supabaseAdmin.from('product_images').insert({
        product_id: product.id,
        image_url: item.image,
        display_order: 0,
      });

      console.log(`✓ Inserted product "${item.name}" for district ${dist.name}`);
    }
  }

  console.log('Seeding complete!');
}

seed();
