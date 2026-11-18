import { supabaseAdmin } from './src/config/supabase.js';

export function getExactProductImage(productName) {
  const name = (productName || '').toLowerCase();

  // Glassware & Bangles
  if (name.includes('glass') && (name.includes('vase') || name.includes('decor'))) {
    return '/images/products/firozabad-glass-vase.jpg';
  }
  if (name.includes('bangle')) {
    return '/images/products/firozabad-glass-bangles.jpg';
  }

  // Pottery & Ceramics
  if (name.includes('blue pottery') && (name.includes('plate') || name.includes('serving') || name.includes('dish'))) {
    return '/images/products/jaipur-blue-pottery-plate.jpg';
  }
  if (name.includes('blue pottery') || (name.includes('pottery') && name.includes('vase'))) {
    return '/images/products/jaipur-blue-pottery-vase.jpg';
  }
  if (name.includes('terracotta') || name.includes('clay') || name.includes('vessel')) {
    return '/images/products/terracotta-vessel-authentic.jpg';
  }

  // Textiles & Sarees
  if (name.includes('bandhani')) {
    return '/images/products/jodhpuri-bandhani-dupatta.jpg';
  }
  if (name.includes('chanderi')) {
    return '/images/products/chanderi-handloom-saree.jpg';
  }
  if (name.includes('paithani')) {
    return '/images/products/paithani-silk-saree-authentic.jpg';
  }
  if (name.includes('himroo') || name.includes('shawl')) {
    return '/images/products/himroo-brocade-shawl.jpg';
  }
  if (name.includes('saree') || name.includes('brocade')) {
    return '/images/products/silk-brocade-saree.jpg';
  }
  if (name.includes('stole') || name.includes('scarf') || name.includes('dupatta')) {
    return '/images/products/silk-stole-scarf.jpg';
  }
  if (name.includes('khadi') && (name.includes('fabric') || name.includes('kurta'))) {
    return '/images/products/khadi-fabric.jpg';
  }
  if (name.includes('chaddar') || name.includes('solapuri')) {
    return '/images/products/solapur-chaddar-weave.jpg';
  }
  if (name.includes('cushion')) {
    return '/images/products/cushion-cover-authentic.jpg';
  }
  // Notebooks, Journals & Stationery
  if (name.includes('notebook') || name.includes('journal') || name.includes('diary')) {
    return '/images/products/handmade-journal-diary.jpg';
  }
  if (name.includes('bookmark')) {
    return '/images/products/woven-bookmark.jpg';
  }
  if (name.includes('coaster')) {
    return '/images/products/indian-coaster-set.jpg';
  }

  // Apron & Kitchen Textiles
  if (name.includes('apron')) {
    return '/images/products/block-print-apron.jpg';
  }
  if (name.includes('runner') || name.includes('towel')) {
    return '/images/products/cotton-table-runner.jpg';
  }

  // Food, Teas & Spices
  if (name.includes('preserve')) {
    return '/images/products/grape-preserve.jpg';
  }
  if (name.includes('golden milk') || name.includes('turmeric blend')) {
    return '/images/products/golden-turmeric-blend.jpg';
  }
  if (name.includes('orange') && name.includes('slice')) {
    return '/images/products/candied-orange-slices.jpg';
  }
  if (name.includes('fruit leather') || (name.includes('mango') && name.includes('leather'))) {
    return '/images/products/aam-papad-fruit-leather.jpg';
  }
  if (name.includes('green tea') || name.includes('tea canister')) {
    return '/images/products/green-tea-leaves-canister.jpg';
  }
  if (name.includes('tea') || name.includes('darjeeling')) {
    return '/images/products/darjeeling-tea-leaves.jpg';
  }
  if (name.includes('spice box') || name.includes('masala')) {
    return '/images/products/sheesham-spice-box.jpg';
  }
  if (name.includes('turmeric') || name.includes('haldi')) {
    return '/images/products/sangli-turmeric-authentic.jpg';
  }
  if (name.includes('banana') && name.includes('chip')) {
    return '/images/products/kerala-banana-chips-authentic.jpg';
  }
  if (name.includes('banana') && name.includes('mat')) {
    return '/images/products/banana-fibre-mat.jpg';
  }
  if (name.includes('strawberry') && name.includes('jam')) {
    return '/images/products/strawberry-jam-authentic.jpg';
  }
  if (name.includes('strawberry') && (name.includes('box') || name.includes('dried'))) {
    return '/images/products/dried-strawberries-authentic.jpg';
  }
  if (name.includes('candle')) {
    if (name.includes('orange')) return '/images/products/orange-peel-candle.jpg';
    return '/images/products/berry-soy-candle.jpg';
  }
  if (name.includes('marmalade')) {
    return '/images/products/nagpur-marmalade-authentic.jpg';
  }
  if (name.includes('sitaphal') || name.includes('custard')) {
    return '/images/products/sitaphal-custard-apple-authentic.jpg';
  }
  if (name.includes('mango') || name.includes('alphonso')) {
    return '/images/products/mango-chutney-authentic.jpg';
  }
  if (name.includes('raisin') || name.includes('grape')) {
    return '/images/products/nashik-raisins-authentic.jpg';
  }

  // Footwear
  if (name.includes('chappal') || name.includes('footwear')) {
    return '/images/products/kolhapuri-chappal-authentic.jpg';
  }
  if (name.includes('jutti')) {
    return '/images/products/leather-jutti.jpg';
  }

  // Bags
  if (name.includes('tote') || (name.includes('bag') && !name.includes('clutch'))) {
    return '/images/products/khadi-tote-authentic.jpg';
  }
  if (name.includes('clutch') || name.includes('pouch')) {
    return '/images/products/evening-clutch-bag.jpg';
  }

  // Art & Woodcraft
  if (name.includes('warli')) {
    return '/images/products/warli-harvest-authentic.jpg';
  }
  if (name.includes('chess')) {
    return '/images/products/wooden-chess-set.jpg';
  }
  if (name.includes('spinner')) {
    return '/images/products/wooden-spinning-top.jpg';
  }
  if (name.includes('toy') || name.includes('animal') || name.includes('sawantwadi')) {
    return '/images/products/sawantwadi-toys-authentic.jpg';
  }

  return '/images/products/silk-brocade-saree.jpg';
}

async function syncAll() {
  console.log('Fetching all products to update exact matching images...');
  const { data: products, error } = await supabaseAdmin.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  console.log(`Updating ${products.length} products with exact photographic matches...`);
  let count = 0;

  for (const p of products) {
    const exactImage = getExactProductImage(p.name);

    // Update existing product_images entry
    const { data: existing } = await supabaseAdmin
      .from('product_images')
      .select('id')
      .eq('product_id', p.id);

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from('product_images')
        .update({
          image_url: exactImage,
          display_order: 0,
        })
        .eq('product_id', p.id);
    } else {
      await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: p.id,
          image_url: exactImage,
          display_order: 0,
        });
    }

    console.log(`✓ "${p.name}" -> ${exactImage}`);
    count++;
  }

  console.log(`\nSuccessfully updated ${count}/${products.length} products to exact matching images!`);
}

syncAll();
