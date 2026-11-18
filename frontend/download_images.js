import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, 'public', 'images', 'products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Curated high quality authentic photographic images for ODOP crafts & products
const imagesToDownload = [
  // Saree & Brocade & Silk & Paithani
  {
    name: 'silk-brocade-saree.jpg',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'paithani-silk-saree.jpg',
    url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'silk-stole-scarf.jpg',
    url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'khadi-fabric.jpg',
    url: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'solapur-chaddar-weave.jpg',
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'cushion-cover-handloom.jpg',
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'cotton-table-runner.jpg',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'block-print-apron.jpg',
    url: 'https://images.unsplash.com/photo-1583845112203-454c1dbe0f99?auto=format&fit=crop&w=900&q=80',
  },
  
  // Candles & Fragrance
  {
    name: 'berry-soy-candle.jpg',
    url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'orange-peel-candle.jpg',
    url: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=900&q=80',
  },

  // Strawberries & Jams & Confectionery
  {
    name: 'dried-strawberry-box.jpg',
    url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'strawberry-pepper-jam.jpg',
    url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'orange-marmalade.jpg',
    url: 'https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'grape-preserve.jpg',
    url: 'https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=900&q=80',
  },

  // Turmeric & Spices
  {
    name: 'sangli-turmeric-powder.jpg',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'golden-turmeric-blend.jpg',
    url: 'https://images.unsplash.com/photo-1599599810694-57a9c2e85660?auto=format&fit=crop&w=900&q=80',
  },

  // Banana Products & Snacks
  {
    name: 'banana-chips.jpg',
    url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'banana-fibre-mat.jpg',
    url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=900&q=80',
  },

  // Sitaphal / Custard Apple & Mango & Dry Fruits
  {
    name: 'sitaphal-fruit-pulp.jpg',
    url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'mango-chutney.jpg',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'raisin-trail-mix.jpg',
    url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=80',
  },

  // Kolhapuri Leather & Jutti
  {
    name: 'kolhapuri-chappal.jpg',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'leather-jutti.jpg',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
  },

  // Bags, Totes, Clutches
  {
    name: 'khadi-tote-bag.jpg',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'evening-clutch-bag.jpg',
    url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=80',
  },

  // Journals, Stationery, Bookmarks
  {
    name: 'handmade-journal-diary.jpg',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'woven-bookmark.jpg',
    url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80',
  },

  // Warli Art & Paintings
  {
    name: 'warli-tribal-painting.jpg',
    url: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80',
  },

  // Toys & Woodcraft & Terracotta
  {
    name: 'sawantwadi-wooden-toys.jpg',
    url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'wooden-chess-craft.jpg',
    url: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'terracotta-vessel-pottery.jpg',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'wooden-spinner-toy.jpg',
    url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  },
];

async function downloadAll() {
  console.log(`Starting download of ${imagesToDownload.length} product images...`);
  let downloadedCount = 0;

  for (const item of imagesToDownload) {
    const destPath = path.join(targetDir, item.name);
    try {
      console.log(`Downloading ${item.name}...`);
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`Failed to download ${item.name}: Status ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      downloadedCount++;
      console.log(`✓ Saved ${item.name} (${Math.round(buffer.length / 1024)} KB)`);
    } catch (err) {
      console.error(`Error downloading ${item.name}:`, err.message);
    }
  }

  console.log(`\nSuccessfully downloaded ${downloadedCount}/${imagesToDownload.length} images to ${targetDir}`);
}

downloadAll();
