/**
 * Additional frontend demo data, same schema as products.js.
 * Every listing, seller, price, review count, and stock level below is fictional.
 * Verify official district-product mappings before publishing this data publicly.
 * Image URLs reuse photos already present in products.js; swap in your own as needed.
 */

export const moreSellers = [
  { id: 'seller-haldi-ghar', name: 'Haldi Ghar Naturals', district: 'Sangli', rating: 4.8, verified: true },
  { id: 'seller-khandesh-kele', name: 'Khandesh Kele Co.', district: 'Jalgaon', rating: 4.6, verified: true },
  { id: 'seller-sevagram-khadi', name: 'Sevagram Khadi Studio', district: 'Wardha', rating: 4.9, verified: true },
  { id: 'seller-marathwada-sitaphal', name: 'Marathwada Sitaphal Co.', district: 'Beed', rating: 4.6, verified: true },
  { id: 'seller-mahabaleshwar-berry', name: 'Mahabaleshwar Berry Farm', district: 'Satara', rating: 4.7, verified: true },
];

export const moreProducts = [
  // ───────── Sangli · Turmeric ─────────
  {
    id: 'odop-san-001', sku: 'SAN-TUR-001', slug: 'sangli-stone-ground-turmeric',
    name: 'Stone-Ground Sangli Turmeric', district: 'Sangli', state: 'Maharashtra',
    districtProduct: 'Turmeric products', category: 'Food & pantry', subcategory: 'Spices',
    sellerId: 'seller-haldi-ghar', price: 280, originalPrice: null, stock: 60,
    rating: 4.8, reviewCount: 88, badge: 'Bestseller', material: 'Sun-dried turmeric fingers, stone-ground',
    dimensions: '250 g pouch', color: 'Deep gold', deliveryDays: '3–5 days',
    shortDescription: 'A vivid, earthy turmeric powder ground in small lots for everyday cooking.',
    story: 'A staple pantry listing that shows how a district crop can anchor a whole storefront.',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Golden spice in a small jar', tags: ['sangli', 'turmeric', 'spice'], isDemo: true,
  },
  {
    id: 'odop-san-002', sku: 'SAN-TUR-002', slug: 'turmeric-golden-milk-blend',
    name: 'Golden Milk Blend', district: 'Sangli', state: 'Maharashtra',
    districtProduct: 'Turmeric products', category: 'Food & pantry', subcategory: 'Drink mixes',
    sellerId: 'seller-haldi-ghar', price: 360, originalPrice: 420, stock: 34,
    rating: 4.7, reviewCount: 41, badge: 'Wellness pick', material: 'Turmeric, ginger, cinnamon, black pepper',
    dimensions: '120 g tin', color: 'Warm saffron', deliveryDays: '3–5 days',
    shortDescription: 'A caffeine-free evening drink mix to whisk into warm milk.',
    story: 'A value-added product that moves beyond the raw ingredient into a ready-to-use format.',
    imageUrl: 'https://images.unsplash.com/photo-1599599810694-57a9c2e85660?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Spice blend in a bowl', tags: ['sangli', 'turmeric', 'wellness'], isDemo: true,
  },
  {
    id: 'odop-san-003', sku: 'SAN-TUR-003', slug: 'turmeric-block-print-apron',
    name: 'Haldi Block-Print Apron', district: 'Sangli', state: 'Maharashtra',
    districtProduct: 'Turmeric products', category: 'Home & living', subcategory: 'Kitchen textiles',
    sellerId: 'seller-haldi-ghar', price: 890, originalPrice: 1050, stock: 15,
    rating: 4.6, reviewCount: 16, badge: 'Kitchen edit', material: 'Cotton dyed with turmeric and mordant',
    dimensions: 'Adjustable · 70 × 85 cm', color: 'Mustard & ivory', deliveryDays: '4–6 days',
    shortDescription: 'A natural-dyed cotton apron with a hand block-printed border.',
    story: 'A non-food gift that keeps the district ingredient visible in the design.',
    imageUrl: 'https://images.unsplash.com/photo-1583845112203-454c1dbe0f99?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Printed cotton kitchen textile', tags: ['sangli', 'turmeric', 'kitchen'], isDemo: true,
  },

  // ───────── Jalgaon · Banana ─────────
  {
    id: 'odop-jal-001', sku: 'JAL-BAN-001', slug: 'jalgaon-peppered-banana-chips',
    name: 'Peppered Banana Chips', district: 'Jalgaon', state: 'Maharashtra',
    districtProduct: 'Banana products', category: 'Food & pantry', subcategory: 'Snacks',
    sellerId: 'seller-khandesh-kele', price: 220, originalPrice: null, stock: 75,
    rating: 4.6, reviewCount: 63, badge: 'Everyday snack', material: 'Raw banana, groundnut oil, black pepper',
    dimensions: '200 g pouch', color: 'Pale gold', deliveryDays: '3–5 days',
    shortDescription: 'Thin, crisp banana chips finished with cracked black pepper.',
    story: 'A low-price, high-stock listing that works well in recurring-buy and snack sections.',
    imageUrl: 'https://images.unsplash.com/photo-1599599810694-57a9c2e85660?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Crunchy snack mix in a bowl', tags: ['jalgaon', 'banana', 'snack'], isDemo: true,
  },
  {
    id: 'odop-jal-002', sku: 'JAL-BAN-002', slug: 'banana-fibre-table-mat-set',
    name: 'Banana Fibre Table Mat Set', district: 'Jalgaon', state: 'Maharashtra',
    districtProduct: 'Banana products', category: 'Home & living', subcategory: 'Tableware',
    sellerId: 'seller-khandesh-kele', price: 1190, originalPrice: 1400, stock: 12,
    rating: 4.7, reviewCount: 22, badge: 'Eco pick', material: 'Woven banana fibre',
    dimensions: 'Set of 4 · 35 cm', color: 'Natural straw', deliveryDays: '5–7 days',
    shortDescription: 'Four sturdy round mats woven from upcycled banana-stem fibre.',
    story: 'Shows how agricultural by-products can become a premium home-décor line.',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Handmade natural-fibre table mats', tags: ['jalgaon', 'banana-fibre', 'eco'], isDemo: true,
  },
  {
    id: 'odop-jal-003', sku: 'JAL-BAN-003', slug: 'banana-fibre-journal',
    name: 'Banana Fibre Journal', district: 'Jalgaon', state: 'Maharashtra',
    districtProduct: 'Banana products', category: 'Stationery & gifts', subcategory: 'Notebooks',
    sellerId: 'seller-khandesh-kele', price: 380, originalPrice: null, stock: 44,
    rating: 4.5, reviewCount: 19, badge: 'Under ₹500', material: 'Banana-fibre paper, cotton thread binding',
    dimensions: 'A5 · 96 pages', color: 'Oatmeal', deliveryDays: '3–5 days',
    shortDescription: 'A textured, thread-bound journal made from banana-fibre paper.',
    story: 'An entry-price gifting listing with a clear sustainability angle.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Handmade paper journal', tags: ['jalgaon', 'journal', 'sustainable'], isDemo: true,
  },

  // ───────── Wardha · Khadi ─────────
  {
    id: 'odop-war-001', sku: 'WAR-KHA-001', slug: 'handspun-khadi-kurta-fabric',
    name: 'Handspun Khadi Kurta Fabric', district: 'Wardha', state: 'Maharashtra',
    districtProduct: 'Khadi textiles', category: 'Style', subcategory: 'Fabric',
    sellerId: 'seller-sevagram-khadi', price: 1850, originalPrice: 2100, stock: 18,
    rating: 4.9, reviewCount: 71, badge: 'Bestseller', material: 'Handspun, handwoven cotton khadi',
    dimensions: '2.5 m × 110 cm', color: 'Soft indigo', deliveryDays: '5–7 days',
    shortDescription: 'A breathable, softly textured khadi length ready for tailoring.',
    story: 'A hero textile listing with length and width fields for made-to-measure flows.',
    imageUrl: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Folded handwoven cotton fabric', tags: ['wardha', 'khadi', 'handloom'], isDemo: true,
  },
  {
    id: 'odop-war-002', sku: 'WAR-KHA-002', slug: 'khadi-everyday-tote',
    name: 'Khadi Everyday Tote', district: 'Wardha', state: 'Maharashtra',
    districtProduct: 'Khadi textiles', category: 'Accessories', subcategory: 'Bags',
    sellerId: 'seller-sevagram-khadi', price: 760, originalPrice: null, stock: 29,
    rating: 4.7, reviewCount: 33, badge: 'Handloom', material: 'Khadi cotton with inner lining',
    dimensions: '36 × 40 cm', color: 'Natural & rust', deliveryDays: '4–6 days',
    shortDescription: 'A roomy, lined tote with reinforced handles for daily carry.',
    story: 'An accessory-format listing that lets a textile seller reach a new audience.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Natural cotton tote bag', tags: ['wardha', 'tote', 'khadi'], isDemo: true,
  },
  {
    id: 'odop-war-003', sku: 'WAR-KHA-003', slug: 'handmade-paper-diary',
    name: 'Handmade Paper Diary', district: 'Wardha', state: 'Maharashtra',
    districtProduct: 'Khadi textiles', category: 'Stationery & gifts', subcategory: 'Notebooks',
    sellerId: 'seller-sevagram-khadi', price: 450, originalPrice: null, stock: 36,
    rating: 4.6, reviewCount: 25, badge: 'Under ₹500', material: 'Cotton-rag paper, khadi cover',
    dimensions: 'A5 · 120 pages', color: 'Cream & indigo', deliveryDays: '3–5 days',
    shortDescription: 'A cotton-rag paper diary bound in a khadi cover.',
    story: 'A small add-on product suited to the cart and gifting flow.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Small bound diary', tags: ['wardha', 'diary', 'gift'], isDemo: true,
  },

  // ───────── Beed · Custard apple ─────────
  {
    id: 'odop-bed-001', sku: 'BED-CUS-001', slug: 'sitaphal-pulp-jar',
    name: 'Sitaphal Pulp Jar', district: 'Beed', state: 'Maharashtra',
    districtProduct: 'Custard apple products', category: 'Food & pantry', subcategory: 'Pulps & purees',
    sellerId: 'seller-marathwada-sitaphal', price: 480, originalPrice: null, stock: 21,
    rating: 4.6, reviewCount: 29, badge: 'Seasonal', material: 'Custard apple pulp, minimal sugar',
    dimensions: '300 g jar', color: 'Creamy white', deliveryDays: '4–6 days',
    shortDescription: 'Seed-free custard apple pulp for desserts, shakes, and ice-cream bases.',
    story: 'A seasonal food listing demonstrating a longer delivery window and lower stock.',
    imageUrl: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Fruit pulp in a glass jar', tags: ['beed', 'custard-apple', 'dessert'], isDemo: true,
  },
  {
    id: 'odop-bed-002', sku: 'BED-CUS-002', slug: 'sitaphal-fruit-bar',
    name: 'Sitaphal Fruit Bar', district: 'Beed', state: 'Maharashtra',
    districtProduct: 'Custard apple products', category: 'Food & pantry', subcategory: 'Snacks',
    sellerId: 'seller-marathwada-sitaphal', price: 260, originalPrice: 300, stock: 52,
    rating: 4.5, reviewCount: 18, badge: 'New', material: 'Custard apple, dates, cashew',
    dimensions: 'Pack of 6 · 180 g', color: 'Ivory & caramel', deliveryDays: '3–5 days',
    shortDescription: 'Chewy fruit-and-nut bars with a gentle custard-apple sweetness.',
    story: 'A grab-and-go format that pairs well with the pulp jar in bundle suggestions.',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Soft fruit snack pieces', tags: ['beed', 'snack', 'fruit-bar'], isDemo: true,
  },
  {
    id: 'odop-bed-003', sku: 'BED-CUS-003', slug: 'custard-leaf-print-stole',
    name: 'Custard Leaf Print Stole', district: 'Beed', state: 'Maharashtra',
    districtProduct: 'Custard apple products', category: 'Style', subcategory: 'Scarves & stoles',
    sellerId: 'seller-marathwada-sitaphal', price: 1150, originalPrice: null, stock: 10,
    rating: 4.7, reviewCount: 13, badge: 'Limited run', material: 'Cotton block-printed with leaf motifs',
    dimensions: '60 × 180 cm', color: 'Sage green', deliveryDays: '5–7 days',
    shortDescription: 'A lightweight cotton stole carrying a hand-printed leaf pattern.',
    story: 'A style listing that extends the district theme beyond food.',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Printed lightweight stole', tags: ['beed', 'stole', 'block-print'], isDemo: true,
  },

  // ───────── Satara · Strawberry ─────────
  {
    id: 'odop-sat-001', sku: 'SAT-STR-001', slug: 'strawberry-black-pepper-jam',
    name: 'Strawberry & Black Pepper Jam', district: 'Satara', state: 'Maharashtra',
    districtProduct: 'Strawberry products', category: 'Food & pantry', subcategory: 'Spreads',
    sellerId: 'seller-mahabaleshwar-berry', price: 340, originalPrice: null, stock: 31,
    rating: 4.8, reviewCount: 58, badge: 'Small batch', material: 'Strawberry, raw sugar, cracked pepper',
    dimensions: '230 g jar', color: 'Ruby red', deliveryDays: '3–5 days',
    shortDescription: 'A fruit-heavy jam with a peppery finish, made in small kettles.',
    story: 'A flagship food listing with a distinctive flavour twist.',
    imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Red fruit jam in a glass jar', tags: ['satara', 'strawberry', 'jam'], isDemo: true,
  },
  {
    id: 'odop-sat-002', sku: 'SAT-STR-002', slug: 'dried-strawberry-gift-box',
    name: 'Dried Strawberry Gift Box', district: 'Satara', state: 'Maharashtra',
    districtProduct: 'Strawberry products', category: 'Food & pantry', subcategory: 'Snacks',
    sellerId: 'seller-mahabaleshwar-berry', price: 420, originalPrice: 480, stock: 23,
    rating: 4.7, reviewCount: 37, badge: 'Gift box', material: 'Dried strawberry slices, light sugar coating',
    dimensions: '100 g box', color: 'Rose pink', deliveryDays: '3–5 days',
    shortDescription: 'Chewy dried strawberry slices packed in a compact gift box.',
    story: 'A giftable pack-size example with a short delivery estimate.',
    imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Dried fruit slices in a small box', tags: ['satara', 'strawberry', 'gift-box'], isDemo: true,
  },
  {
    id: 'odop-sat-003', sku: 'SAT-STR-003', slug: 'berry-season-soy-candle',
    name: 'Berry Season Soy Candle', district: 'Satara', state: 'Maharashtra',
    districtProduct: 'Strawberry products', category: 'Home & living', subcategory: 'Candles',
    sellerId: 'seller-mahabaleshwar-berry', price: 590, originalPrice: 690, stock: 19,
    rating: 4.6, reviewCount: 21, badge: 'New', material: 'Soy wax with berry fragrance oil',
    dimensions: '170 g · 26 hour burn', color: 'Blush pink', deliveryDays: '4–6 days',
    shortDescription: 'A sweet-tart berry candle in a minimal glass jar.',
    story: 'A contemporary add-on product for the same district story.',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Minimal candle jar', tags: ['satara', 'candle', 'berry'], isDemo: true,
  },
];

export const moreDistricts = [
  { district: 'Sangli', state: 'Maharashtra', product: 'Turmeric products', sellerCount: 1, productCount: 3 },
  { district: 'Jalgaon', state: 'Maharashtra', product: 'Banana products', sellerCount: 1, productCount: 3 },
  { district: 'Wardha', state: 'Maharashtra', product: 'Khadi textiles', sellerCount: 1, productCount: 3 },
  { district: 'Beed', state: 'Maharashtra', product: 'Custard apple products', sellerCount: 1, productCount: 3 },
  { district: 'Satara', state: 'Maharashtra', product: 'Strawberry products', sellerCount: 1, productCount: 3 },
];

/*
 * To merge with the original data, in products.js add at the top:
 *   import { moreSellers, moreProducts, moreDistricts } from './products.extra.js';
 * and change the exports to:
 *   export const demoSellers   = [...baseSellers,   ...moreSellers];
 *   export const demoProducts  = [...baseProducts,  ...moreProducts];
 *   export const demoDistricts = [...baseDistricts, ...moreDistricts];
 */
