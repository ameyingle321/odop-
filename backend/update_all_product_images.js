import { supabaseAdmin } from './src/config/supabase.js';

// Mapping rules based on keywords in product name, odop_product_name, description
function resolveProductImage(product) {
  const text = `${product.name} ${product.odop_product_name || ''} ${product.description || ''}`.toLowerCase();

  if (text.includes('candle')) {
    if (text.includes('orange') || text.includes('nagpur')) return '/images/products/orange-peel-candle.jpg';
    return '/images/products/berry-soy-candle.jpg';
  }
  if (text.includes('strawberry')) {
    if (text.includes('jam') || text.includes('pepper')) return '/images/products/strawberry-pepper-jam.jpg';
    return '/images/products/dried-strawberry-box.jpg';
  }
  if (text.includes('turmeric') || text.includes('haldi')) {
    if (text.includes('blend') || text.includes('milk')) return '/images/products/golden-turmeric-blend.jpg';
    if (text.includes('apron')) return '/images/products/block-print-apron.jpg';
    return '/images/products/sangli-turmeric-powder.jpg';
  }
  if (text.includes('banana')) {
    if (text.includes('chip')) return '/images/products/banana-chips.jpg';
    if (text.includes('mat')) return '/images/products/banana-fibre-mat.jpg';
    if (text.includes('journal') || text.includes('diary')) return '/images/products/handmade-journal-diary.jpg';
    return '/images/products/banana-chips.jpg';
  }
  if (text.includes('sitaphal') || text.includes('custard')) {
    if (text.includes('stole') || text.includes('scarf')) return '/images/products/silk-stole-scarf.jpg';
    return '/images/products/sitaphal-fruit-pulp.jpg';
  }
  if (text.includes('khadi')) {
    if (text.includes('tote') || text.includes('bag')) return '/images/products/khadi-tote-bag.jpg';
    if (text.includes('fabric') || text.includes('kurta')) return '/images/products/khadi-fabric.jpg';
    return '/images/products/khadi-tote-bag.jpg';
  }
  if (text.includes('chappal') || text.includes('jutti') || text.includes('footwear')) {
    if (text.includes('jutti')) return '/images/products/leather-jutti.jpg';
    return '/images/products/kolhapuri-chappal.jpg';
  }
  if (text.includes('paithani') || text.includes('pune')) {
    return '/images/products/paithani-silk-saree.jpg';
  }
  if (text.includes('saree') || text.includes('brocade') || text.includes('silk') || text.includes('varanasi')) {
    if (text.includes('stole')) return '/images/products/silk-stole-scarf.jpg';
    if (text.includes('clutch')) return '/images/products/evening-clutch-bag.jpg';
    return '/images/products/silk-brocade-saree.jpg';
  }
  if (text.includes('warli')) {
    if (text.includes('tote')) return '/images/products/khadi-tote-bag.jpg';
    return '/images/products/warli-tribal-painting.jpg';
  }
  if (text.includes('chaddar') || text.includes('solapur') || text.includes('cushion') || text.includes('runner')) {
    if (text.includes('cushion')) return '/images/products/cushion-cover-handloom.jpg';
    if (text.includes('runner')) return '/images/products/cotton-table-runner.jpg';
    return '/images/products/solapur-chaddar-weave.jpg';
  }
  if (text.includes('wooden') || text.includes('toy') || text.includes('sawantwadi') || text.includes('sindhudurg')) {
    if (text.includes('chess')) return '/images/products/wooden-chess-craft.jpg';
    if (text.includes('spinner')) return '/images/products/wooden-spinner-toy.jpg';
    return '/images/products/sawantwadi-wooden-toys.jpg';
  }
  if (text.includes('terracotta') || text.includes('pottery') || text.includes('vessel')) {
    return '/images/products/terracotta-vessel-pottery.jpg';
  }
  if (text.includes('mango') || text.includes('alphonso') || text.includes('ratnagiri')) {
    if (text.includes('towel') || text.includes('apron')) return '/images/products/cotton-table-runner.jpg';
    return '/images/products/mango-chutney.jpg';
  }
  if (text.includes('orange') || text.includes('marmalade')) {
    if (text.includes('candle')) return '/images/products/orange-peel-candle.jpg';
    return '/images/products/orange-marmalade.jpg';
  }
  if (text.includes('grape') || text.includes('raisin') || text.includes('nashik')) {
    if (text.includes('raisin') || text.includes('mix')) return '/images/products/raisin-trail-mix.jpg';
    if (text.includes('notebook') || text.includes('diary')) return '/images/products/handmade-journal-diary.jpg';
    return '/images/products/grape-preserve.jpg';
  }
  if (text.includes('diary') || text.includes('journal') || text.includes('paper') || text.includes('notebook')) {
    return '/images/products/handmade-journal-diary.jpg';
  }
  if (text.includes('bookmark')) {
    return '/images/products/woven-bookmark.jpg';
  }
  if (text.includes('pouch') || text.includes('clutch') || text.includes('bag')) {
    return '/images/products/evening-clutch-bag.jpg';
  }

  // Fallback default
  return '/images/products/silk-brocade-saree.jpg';
}

async function updateImages() {
  console.log('Fetching all products from Supabase...');
  const { data: products, error } = await supabaseAdmin.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    process.exit(1);
  }

  console.log(`Found ${products.length} products. Updating product_images...`);

  let updatedCount = 0;
  for (const product of products) {
    const localImagePath = resolveProductImage(product);

    // Check if product already has image entries
    const { data: existingImages } = await supabaseAdmin
      .from('product_images')
      .select('id')
      .eq('product_id', product.id);

    if (existingImages && existingImages.length > 0) {
      // Update existing image record
      const { error: updateErr } = await supabaseAdmin
        .from('product_images')
        .update({
          image_url: localImagePath,
          display_order: 0,
        })
        .eq('product_id', product.id);

      if (updateErr) {
        console.warn(`Failed to update image for product ${product.name}:`, updateErr.message);
      } else {
        updatedCount++;
      }
    } else {
      // Insert new image record
      const { error: insertErr } = await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: product.id,
          image_url: localImagePath,
          display_order: 0,
        });

      if (insertErr) {
        console.warn(`Failed to insert image for product ${product.name}:`, insertErr.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated product_images for ${updatedCount}/${products.length} products!`);
}

updateImages();
